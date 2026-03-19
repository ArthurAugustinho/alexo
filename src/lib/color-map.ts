const COLOR_HEX_MAP: Record<string, string> = {
  amarela: "#facc15",
  azul: "#3b82f6",
  bege: "#c8b38b",
  branca: "#f5f5f5",
  branco: "#f5f5f5",
  cinza: "#9ca3af",
  marrom: "#7c4a2d",
  preta: "#0a0a0a",
  preto: "#0a0a0a",
  verde: "#22c55e",
  vinho: "#7f1d3f",
};

export function getColorHex(colorName: string): string {
  const normalizedColorName = colorName.trim().toLowerCase();

  return COLOR_HEX_MAP[normalizedColorName] ?? "#d4d4d8";
}
