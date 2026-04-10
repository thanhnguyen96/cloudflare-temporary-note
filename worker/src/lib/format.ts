export function sanitizeFilename(name: string): string {
  return name.replace(/[\r\n"]/g, "_").trim().slice(0, 180);
}

export function sanitizeContentType(contentType: string): string {
  const normalized = contentType.trim().toLowerCase();
  if (!normalized || normalized.length > 120) {
    return "application/octet-stream";
  }

  return normalized;
}

export function buildContentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, (char) => {
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
  });

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

