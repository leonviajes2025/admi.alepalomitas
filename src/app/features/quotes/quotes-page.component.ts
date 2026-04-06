import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import {
  isWhatsappQuoteStatus,
  WhatsappQuote,
  WhatsappQuoteStatus,
  WHATSAPP_QUOTE_STATUS_OPTIONS
} from '../../core/models/whatsapp-quote.model';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-quotes-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './quotes-page.component.html',
  styleUrl: './quotes-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotesPageComponent {
  private readonly apiService = inject(AdminApiService);

  protected readonly statusOptions = WHATSAPP_QUOTE_STATUS_OPTIONS;
  protected readonly quotes = signal<WhatsappQuote[]>([]);
  protected readonly pendingCount = computed(() => this.quotes().filter((q) => q.clienteEstatus === 'pendiente').length);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly updatingQuoteIds = signal<ReadonlySet<number>>(new Set());

  constructor() {
    this.loadQuotes();
  }

  protected loadQuotes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.apiService
      .getWhatsappQuotes()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (quotes) => this.quotes.set(quotes),
        error: () => this.errorMessage.set('No fue posible cargar las cotizaciones de WhatsApp.')
      });
  }

  protected updateClientStatus(quote: WhatsappQuote, nextStatusValue: string): void {
    if (!isWhatsappQuoteStatus(nextStatusValue) || quote.clienteEstatus === nextStatusValue) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.toggleQuoteUpdatingState(quote.id, true);

    this.apiService
      .updateWhatsappQuoteStatus(quote.id, nextStatusValue)
      .pipe(finalize(() => this.toggleQuoteUpdatingState(quote.id, false)))
      .subscribe({
        next: (updatedQuote) => {
          this.quotes.update((quotes) =>
            quotes.map((currentQuote) => (currentQuote.id === quote.id ? { ...currentQuote, ...updatedQuote } : currentQuote))
          );
          this.successMessage.set('Estatus del cliente actualizado correctamente.');
        },
        error: () => this.errorMessage.set('No fue posible actualizar el estatus del cliente.')
      });
  }

  protected getStatusLabel(status: WhatsappQuoteStatus): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? 'Pendiente';
  }

  protected isUpdatingQuote(quoteId: number): boolean {
    return this.updatingQuoteIds().has(quoteId);
  }

  protected isPendingStatus(status: WhatsappQuoteStatus): boolean {
    return status === 'pendiente';
  }

  protected isInReviewStatus(status: WhatsappQuoteStatus): boolean {
    return status === 'en revision';
  }

  private toggleQuoteUpdatingState(quoteId: number, isUpdating: boolean): void {
    const nextUpdatingIds = new Set(this.updatingQuoteIds());

    if (isUpdating) {
      nextUpdatingIds.add(quoteId);
    } else {
      nextUpdatingIds.delete(quoteId);
    }

    this.updatingQuoteIds.set(nextUpdatingIds);
  }
}