export function calculateStraightLineValue(input: { purchasePrice: number; salvageValue?: number; usefulLifeYears: number; purchaseDate: Date | string }) {
  const purchasePrice = Number(input.purchasePrice || 0);
  const salvageValue = Number(input.salvageValue || 0);
  const life = Math.max(Number(input.usefulLifeYears || 1), 1);
  const start = new Date(input.purchaseDate);
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth());
  const monthly = (purchasePrice - salvageValue) / (life * 12);
  return Math.max(salvageValue, Math.round((purchasePrice - monthly * months) * 100) / 100);
}
