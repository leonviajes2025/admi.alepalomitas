import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Contact } from '../../core/models/contact.model';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacts-page.component.html',
  styleUrl: './contacts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactsPageComponent {
  private readonly apiService = inject(AdminApiService);

  protected readonly contacts = signal<Contact[]>([]);
  protected readonly query = signal('');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly filteredContacts = computed(() => {
    const currentQuery = this.query().trim().toLowerCase();

    if (!currentQuery) {
      return this.contacts();
    }

    return this.contacts().filter((contact) => {
      const haystack = [contact.nombre, contact.email, contact.telefono, contact.pregunta]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(currentQuery);
    });
  });

  constructor() {
    this.loadContacts();
  }

  protected loadContacts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.apiService
      .getContacts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (contacts) => this.contacts.set(contacts),
        error: () => this.errorMessage.set('No fue posible cargar los contactos.')
      });
  }

  protected updateQuery(value: string): void {
    this.query.set(value);
  }
}