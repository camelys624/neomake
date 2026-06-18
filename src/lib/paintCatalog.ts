export const paintCatalog = [
  { colorName: "黑色", colorHex: "#111827", weights: [50, 100, 250, 500] },
  { colorName: "白色", colorHex: "#f8fafc", weights: [50, 100, 250, 500] },
  { colorName: "火焰红", colorHex: "#dc2626", weights: [50, 100, 250, 500] },
  { colorName: "柠檬黄", colorHex: "#facc15", weights: [50, 100, 250, 500] },
  { colorName: "宝蓝", colorHex: "#2563eb", weights: [50, 100, 250, 500] },
  { colorName: "森林绿", colorHex: "#166534", weights: [50, 100, 250, 500] },
  { colorName: "金属银", colorHex: "#94a3b8", weights: [50, 100, 250, 500] },
  { colorName: "透明保护剂", colorHex: "#dbeafe", weights: [50, 100, 250, 500] },
] as const;

export type PaintCatalogColor = (typeof paintCatalog)[number];
