export const price = (value:number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

export function encodeBase64UrlSafe(data:string) {
  // Codifica en Base64 estándar
  const base64 = btoa(data);
  // Reemplaza caracteres para hacerla URL Safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64UrlSafe(base64UrlSafe:string) {
  // Reemplaza caracteres URL Safe por los estándar
  let base64 = base64UrlSafe?.replace(/-/g, '+').replace(/_/g, '/');
  // Agrega el relleno `=` si es necesario
  while (base64.length % 4) {
      base64 += '=';
  }
  return atob(base64);
}
