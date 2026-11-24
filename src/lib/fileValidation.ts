// --------------------------------------------------------------------------------------
//
// Helper de validación de extensión de archivos, compartido entre ArticleForm y
// CameraReadyForm (antes vivía duplicado dentro de ArticleForm).
//
// --------------------------------------------------------------------------------------

export function validateFileExtension(file: File, allowedExtensions: string[]): boolean {
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some((ext) => fileName.endsWith(ext.toLowerCase()));
}

// Normaliza las extensiones permitidas de una conferencia (array o CSV) a una lista
// de strings en minúscula, p. ej. [".pdf", ".zip"].
export function normalizeAllowedExtensions(exts: unknown): string[] {
  if (Array.isArray(exts)) {
    return exts.map((ext) => String(ext).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof exts === "string") {
    return exts
      .split(",")
      .map((ext) => ext.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

export function formatAllowedExtensions(exts: unknown): string {
  const normalized = normalizeAllowedExtensions(exts);
  if (normalized.length === 0) return "ninguna";
  return normalized.map((ext) => ext.toUpperCase()).join(", ");
}
