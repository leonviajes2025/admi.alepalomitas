export interface Product {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: string;
  imagenUrl: string;
  activo: boolean;
}

export interface ProductPayload {
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: string;
  imagenUrl: string;
  activo: boolean;
}