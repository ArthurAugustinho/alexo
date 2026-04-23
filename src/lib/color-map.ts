export const colorMap: Record<string, string> = {
  // Neutras
  branca:         "#FFFFFF",
  branco:         "#FFFFFF",
  "off-white":    "#FAF9F6",
  preta:          "#1A1A1A",
  preto:          "#1A1A1A",
  cinza:          "#9E9E9E",
  "cinza claro":  "#E0E0E0",
  "cinza escuro": "#616161",
  prata:          "#C0C0C0",
  bege:           "#D7CCC8",

  // Vermelhos / Rosas
  vermelha:       "#D32F2F",
  vermelho:       "#D32F2F",
  rosa:           "#E91E63",
  "rosa claro":   "#F48FB1",
  "rosa bebê":    "#F8BBD9",
  bordo:          "#880E4F",
  vinho:          "#7B1FA2",

  // Azuis
  azul:           "#1565C0",
  "azul claro":   "#42A5F5",
  "azul escuro":  "#0D47A1",
  "azul royal":   "#1A237E",
  "azul marinho": "#0A1628",
  navy:           "#1A237E",
  ciano:          "#00BCD4",
  "ciano escuro": "#00838F",
  turquesa:       "#00897B",

  // Verdes
  verde:          "#2E7D32",
  "verde claro":  "#66BB6A",
  "verde escuro": "#1B5E20",
  "verde lima":   "#C6EF00",
  oliva:          "#827717",

  // Amarelos / Laranjas / Marrons
  amarela:        "#F9A825",
  amarelo:        "#F9A825",
  laranja:        "#E65100",
  dourada:        "#FFD700",
  dourado:        "#FFD700",
  marrom:         "#5D4037",
  caramelo:       "#A1622A",
  terracota:      "#BF360C",

  // Roxos
  roxa:           "#6A1B9A",
  roxo:           "#6A1B9A",
  lilás:          "#AB47BC",
  lavanda:        "#9575CD",
};

const DEFAULT_SWATCH_HEX = "#d4d4d8";

export function getColorHex(colorName: string): string {
  const key = colorName.trim().toLowerCase();
  return colorMap[key] ?? DEFAULT_SWATCH_HEX;
}
