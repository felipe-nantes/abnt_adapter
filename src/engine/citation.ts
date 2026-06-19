import type { CitationRef } from '../model/types';
import type { ResolvedRules } from '../rules/load';

// Maiúsc/minúsc (NBR 10520:2023): só primeira letra maiúscula por sobrenome.
const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function buildCitationText(ref: CitationRef, rules: ResolvedRules): string {
  const authors = ref.authors.map(toTitle);
  let authorPart: string;
  if (authors.length >= rules.citations.etAlFrom) authorPart = `${authors[0]} et al.`;
  else authorPart = authors.join('; ');

  const locator = ref.page ? `, p. ${ref.page}` : ref.location ? `, local. ${ref.location}` : '';
  return `(${authorPart}, ${ref.year}${locator})`;
}
