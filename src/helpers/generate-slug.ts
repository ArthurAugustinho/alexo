function normalizeSlugSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateVariantSlug(
  productSlug: string,
  color: string,
  size: string,
) {
  return [
    normalizeSlugSegment(productSlug),
    normalizeSlugSegment(color),
    normalizeSlugSegment(size),
  ]
    .filter(Boolean)
    .join("-");
}
