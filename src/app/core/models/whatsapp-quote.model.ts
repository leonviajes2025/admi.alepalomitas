export type WhatsappQuoteStatus = 'pendiente' | 'en revision' | 'respondida';

export interface WhatsappQuote {
  id: number;
  nombre: string | null;
  cotizacion: string;
  fechaEntregaEstimada: string | null;
  canal: string;
  clienteEstatus: WhatsappQuoteStatus;
  createdAt: string | null;
}

export const WHATSAPP_QUOTE_STATUS_OPTIONS: ReadonlyArray<{
  value: WhatsappQuoteStatus;
  label: string;
}> = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en revision', label: 'En revisión' },
  { value: 'respondida', label: 'Respondida' }
];

export function isWhatsappQuoteStatus(value: string): value is WhatsappQuoteStatus {
  return WHATSAPP_QUOTE_STATUS_OPTIONS.some((option) => option.value === value);
}