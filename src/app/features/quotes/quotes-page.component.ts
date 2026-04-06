import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { WhatsappQuote } from '../../core/models/whatsapp-quote.model';
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

  protected readonly quotes = signal<WhatsappQuote[]>([]);

  constructor() {
    this.apiService.getWhatsappQuotes().subscribe((quotes) => this.quotes.set(quotes));
  }
}