import { WhatsappQuote } from '../models/whatsapp-quote.model';

export const MOCK_WHATSAPP_QUOTES: WhatsappQuote[] = [
  {
    id: 101,
    nombre: 'Cliente demo',
    cotizacion: 'Necesito 20 piezas del paquete clasico para evento corporativo.',
    fechaEntregaEstimada: '2026-04-20',
    canal: 'WhatsApp',
    estado: 'Pendiente',
    createdAt: '2026-04-05T09:30:00.000Z'
  },
  {
    id: 102,
    nombre: 'Prospecto sin nombre',
    cotizacion: 'Busco una opcion personalizada para una fiesta infantil de 50 invitados.',
    fechaEntregaEstimada: '2026-04-26',
    canal: 'WhatsApp',
    estado: 'En revision',
    createdAt: '2026-04-05T11:15:00.000Z'
  },
  {
    id: 103,
    nombre: 'Comercial Norte',
    cotizacion: 'Solicito precio para combo premium con entrega en sucursal.',
    fechaEntregaEstimada: '2026-05-03',
    canal: 'WhatsApp',
    estado: 'Respondida',
    createdAt: '2026-04-04T16:42:00.000Z'
  }
];