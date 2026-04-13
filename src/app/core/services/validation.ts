export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLogErrorCreateInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['El cuerpo debe ser un objeto JSON.'] };
  }

  if (!input.dominio || typeof input.dominio !== 'string' || input.dominio.trim() === '') {
    errors.push('El campo "dominio" es obligatorio y debe ser una cadena no vacía.');
  }

  if (!input.mensaje || typeof input.mensaje !== 'string' || input.mensaje.trim() === '') {
    errors.push('El campo "mensaje" es obligatorio y debe ser una cadena no vacía.');
  }

  if (input.origen !== undefined && typeof input.origen !== 'string') {
    errors.push('El campo "origen" debe ser una cadena si se provee.');
  }

  if (input.metodo !== undefined && typeof input.metodo !== 'string') {
    errors.push('El campo "metodo" debe ser una cadena si se provee.');
  }

  if (input.codigo !== undefined && typeof input.codigo !== 'string' && typeof input.codigo !== 'number') {
    errors.push('El campo "codigo" debe ser string o number si se provee.');
  }

  if (input.detalle !== undefined && typeof input.detalle !== 'string') {
    errors.push('El campo "detalle" debe ser una cadena si se provee.');
  }

  if (input.fechaOcurrencia !== undefined) {
    const dateVal = input.fechaOcurrencia;
    const parsed = typeof dateVal === 'string' || typeof dateVal === 'number' ? Date.parse(dateVal as any) : NaN;
    if (isNaN(parsed)) {
      errors.push('El campo "fechaOcurrencia" debe ser una fecha-hora válida.');
    }
  }

  return { valid: errors.length === 0, errors };
}
