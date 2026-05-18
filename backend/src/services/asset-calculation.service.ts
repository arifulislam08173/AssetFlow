export function calculateAutoSalvageValue(purchasePrice: number, condition?: string | null) {
  const normalized = String(condition || "").toLowerCase();
  const percentage = normalized.includes("new") || normalized.includes("excellent")
    ? 0.1
    : normalized.includes("good")
      ? 0.07
      : normalized.includes("fair")
        ? 0.05
        : normalized.includes("poor")
          ? 0.02
          : normalized.includes("damaged") || normalized.includes("unusable")
            ? 0
            : 0.05;
  return Math.round((Number(purchasePrice || 0) * percentage + Number.EPSILON) * 100) / 100;
}
