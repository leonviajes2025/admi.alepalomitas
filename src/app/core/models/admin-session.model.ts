export interface LoginPayload {
  nombreUsuario: string;
  contrasena: string;
}

export interface AuthenticatedAdmin {
  id: number | null;
  nombreUsuario: string;
  nombreCompleto: string;
  tienePermiso: true;
}
