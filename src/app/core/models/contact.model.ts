export interface Contact {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  aceptaPromociones: boolean;
  pregunta: string;
  createdAt?: string;
}