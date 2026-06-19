const TWIPS_PER_CM = 566.93;

export const cmToTw = (cm: number): number => Math.round(cm * TWIPS_PER_CM);
export const ptToHalfPt = (pt: number): number => Math.round(pt * 2);
export const spacingToLine = (mult: number): number => Math.round(mult * 240);
