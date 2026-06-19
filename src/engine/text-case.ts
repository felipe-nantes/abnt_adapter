import type { TitleStyle } from '../rules/load';

// Aplica a caixa tipográfica (NBR 14724/6024) ao texto do título.
export function applyCase(text: string, c: TitleStyle['case']): string {
  if (c === 'uppercase') return text.toUpperCase();
  if (c === 'sentence') return text.charAt(0).toUpperCase() + text.slice(1);
  return text; // 'title': mantém o texto como veio do modelo
}
