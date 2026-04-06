import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { Product, ProductPayload } from '../../core/models/product.model';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SupabaseStorageService } from '../../core/services/supabase-storage.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly apiService = inject(AdminApiService);
  private readonly storageService = inject(SupabaseStorageService);
  protected readonly categoryOptions = ['dulce', 'salada'] as const;
  protected readonly canUploadImages = this.storageService.isConfigured();
  protected readonly isMobileImageCaptureAvailable = signal(false);

  protected readonly activeView = signal<'form' | 'list'>('form');
  protected readonly products = signal<Product[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isUploadingImage = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly originalImageUrl = signal('');
  protected readonly pendingUploadedImageUrl = signal('');
  protected readonly selectedImageName = signal('');
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly productForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    categoria: ['', [Validators.required, Validators.pattern(/^(dulce|salada)$/)]],
    descripcion: ['', [Validators.required, Validators.maxLength(400)]],
    precio: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    imagenUrl: ['', [Validators.required]],
    activo: [true, [Validators.required]]
  });

  constructor() {
    this.updateMobileImageCaptureAvailability();
    this.loadProducts();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.updateMobileImageCaptureAvailability();
  }

  protected loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.apiService
      .getProducts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (products) => this.products.set(products),
        error: () => this.errorMessage.set('No fue posible cargar los productos.')
      });
  }

  protected submit(): void {
    if (this.isUploadingImage()) {
      this.errorMessage.set('Espera a que termine la subida de la imagen.');
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = this.productForm.getRawValue() as ProductPayload;
    const editingId = this.editingId();
    const previousImageUrl = this.originalImageUrl();
    const request$ = editingId === null
      ? this.apiService.createProduct(payload)
      : this.apiService.updateProduct(editingId, payload);

    request$
      .subscribe({
        next: () => void this.handleSuccessfulSubmit(editingId, previousImageUrl, payload.imagenUrl),
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set(
            editingId === null
              ? 'No fue posible crear el producto.'
              : 'No fue posible actualizar el producto.'
          );
        }
      });
  }

  protected async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    if (!file) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.isSupportedImageFile(file)) {
      this.errorMessage.set('Selecciona un archivo de imagen valido.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('La imagen no puede superar los 5 MB.');
      input.value = '';
      return;
    }

    this.isUploadingImage.set(true);
    this.selectedImageName.set(file.name);
    const previousPendingImageUrl = this.pendingUploadedImageUrl();

    try {
      const imageUrl = await this.storageService.uploadProductImage(file);

      if (previousPendingImageUrl && previousPendingImageUrl !== imageUrl) {
        await this.deleteImageSilently(previousPendingImageUrl);
      }

      this.productForm.patchValue({ imagenUrl: imageUrl });
      this.pendingUploadedImageUrl.set(imageUrl);
      this.successMessage.set('Imagen subida correctamente.');
    } catch (error) {
      this.errorMessage.set(this.getUploadErrorMessage(error));
    } finally {
      this.isUploadingImage.set(false);
      input.value = '';
    }
  }

  protected editProduct(product: Product): void {
    void this.deletePendingUploadedImage();
    this.activeView.set('form');
    this.editingId.set(product.id);
    this.originalImageUrl.set(product.imagenUrl);
    this.pendingUploadedImageUrl.set('');
    this.selectedImageName.set('');
    this.productForm.patchValue({
      nombre: product.nombre,
      categoria: product.categoria,
      descripcion: product.descripcion,
      precio: product.precio,
      imagenUrl: product.imagenUrl,
      activo: product.activo
    });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected deleteProduct(product: Product): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSaving.set(true);

    this.apiService
      .deleteProduct(product.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          if (this.editingId() === product.id) {
            this.resetForm();
          }
          this.successMessage.set('Producto eliminado.');
          this.loadProducts();
        },
        error: () => this.errorMessage.set('No fue posible eliminar el producto.')
      });
  }

  protected resetForm(): void {
    void this.deletePendingUploadedImage();
    this.editingId.set(null);
    this.originalImageUrl.set('');
    this.pendingUploadedImageUrl.set('');
    this.selectedImageName.set('');
    this.productForm.reset({
      nombre: '',
      categoria: '',
      descripcion: '',
      precio: '',
      imagenUrl: '',
      activo: true
    });
  }

  protected showCreateView(): void {
    this.activeView.set('form');
  }

  protected showListView(): void {
    this.activeView.set('list');
  }

  protected formatPrice(value: string): number {
    return Number.parseFloat(value || '0');
  }

  private async handleSuccessfulSubmit(
    editingId: number | null,
    previousImageUrl: string,
    currentImageUrl: string
  ): Promise<void> {
    let successMessage = editingId === null ? 'Producto creado.' : 'Producto actualizado.';

    try {
      if (editingId !== null && previousImageUrl && previousImageUrl !== currentImageUrl) {
        await this.storageService.deleteProductImageByPublicUrl(previousImageUrl);
      }
    } catch {
      successMessage = 'Producto actualizado, pero no se pudo eliminar la imagen anterior.';
    } finally {
      this.isSaving.set(false);
    }

    this.successMessage.set(successMessage);
    this.originalImageUrl.set('');
    this.pendingUploadedImageUrl.set('');
    this.resetForm();
    this.activeView.set('list');
    this.loadProducts();
  }

  private async deletePendingUploadedImage(): Promise<void> {
    const pendingUploadedImageUrl = this.pendingUploadedImageUrl();

    if (!pendingUploadedImageUrl) {
      return;
    }

    this.pendingUploadedImageUrl.set('');
    await this.deleteImageSilently(pendingUploadedImageUrl);
  }

  private async deleteImageSilently(imageUrl: string): Promise<void> {
    try {
      await this.storageService.deleteProductImageByPublicUrl(imageUrl);
    } catch {
      // La limpieza de archivos temporales no debe bloquear el formulario.
    }
  }

  private getUploadErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible subir la imagen.';
  }

  private isSupportedImageFile(file: File): boolean {
    if (file.type.startsWith('image/')) {
      return true;
    }

    return /\.(avif|bmp|gif|heic|heif|jpeg|jpg|png|webp)$/i.test(file.name);
  }

  private updateMobileImageCaptureAvailability(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.isMobileImageCaptureAvailable.set(false);
      return;
    }

    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isNarrowViewport = window.matchMedia('(max-width: 720px)').matches;
    const mobileUserAgent = /android|iphone|ipod|iemobile|opera mini/i.test(navigator.userAgent);

    this.isMobileImageCaptureAvailable.set(hasCoarsePointer && (isNarrowViewport || mobileUserAgent));
  }
}