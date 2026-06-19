import rawJson from '../../config/abnt-2024.rules.json'; // Vitest/Vite resolve JSON; tsconfig resolveJsonModule
import { rulesJsonSchema } from './schema';
import { cmToTw, ptToHalfPt, spacingToLine } from './units';
import type { ProfileOverrides } from '../model/types';

export type TitleStyle = { case: 'uppercase'|'title'|'sentence'; bold: boolean; italic: boolean };
export type ResolvedRules = {
  page: { widthTw: number; heightTw: number; headerTw: number;
          margin: { top: number; right: number; bottom: number; left: number } };
  fonts: { family: string; color: string; bodyHalfPt: number; smallHalfPt: number; pageNumberHalfPt: number };
  spacing: { bodyLine: number; singleLine: number };
  paragraph: { firstLineIndentTw: number };
  sections: { titleStylesByLevel: Record<1|2|3|4|5, TitleStyle> };
  citations: { system: 'author-date'|'numeric'; longIndentTw: number; etAlFrom: number; etAlItalic: boolean };
  unnumberedTitles: { case: TitleStyle['case']; bold: boolean };
};

export function loadRules(profile: 'abnt-2024'): ResolvedRules {
  if (profile !== 'abnt-2024') throw new Error(`perfil desconhecido: ${profile}`);
  const j = rulesJsonSchema.parse(rawJson);
  const styles = j.sections.titleStylesByLevel as Record<string, TitleStyle>;
  return {
    page: {
      widthTw: cmToTw(j.page.widthCm),
      heightTw: cmToTw(j.page.heightCm),
      headerTw: cmToTw(j.pagination.distanceFromTopCm),
      margin: {
        top: cmToTw(j.page.margins.top),
        right: cmToTw(j.page.margins.right),
        bottom: cmToTw(j.page.margins.bottom),
        left: cmToTw(j.page.margins.left),
      },
    },
    fonts: {
      family: j.fonts.defaultFamily,
      color: j.fonts.color.replace('#', ''),
      bodyHalfPt: ptToHalfPt(j.fonts.sizesPt.body),
      smallHalfPt: ptToHalfPt(j.fonts.sizesPt.longCitation),
      pageNumberHalfPt: ptToHalfPt(j.fonts.sizesPt.pageNumber),
    },
    spacing: { bodyLine: spacingToLine(j.spacing.body), singleLine: spacingToLine(j.spacing.single) },
    paragraph: { firstLineIndentTw: cmToTw(j.paragraph.firstLineIndentCm) },
    sections: {
      titleStylesByLevel: {
        1: styles['1'], 2: styles['2'], 3: styles['3'], 4: styles['4'], 5: styles['5'],
      },
    },
    citations: {
      system: j.citations.system,
      longIndentTw: cmToTw(j.citations.long.leftIndentCm),
      etAlFrom: j.citations.authorDateFormat.etAlFromAuthors,
      etAlItalic: j.citations.authorDateFormat.etAlItalic,
    },
    unnumberedTitles: {
      case: j.sections.unnumberedTitles.case,
      bold: j.sections.unnumberedTitles.bold,
    },
  };
}

// Mínimos por lado segundo a ABNT (NBR 14724:2024): topo/esquerda 3cm, inferior/direita 2cm.
const MIN_MARGIN_CM: Record<'top'|'left'|'bottom'|'right', number> = {
  top: 3.0, left: 3.0, bottom: 2.0, right: 2.0,
};

export function applyOverrides(rules: ResolvedRules, overrides?: ProfileOverrides): ResolvedRules {
  if (!overrides) return rules;
  const next: ResolvedRules = structuredClone(rules);

  if (overrides.fontFamily) next.fonts.family = overrides.fontFamily;
  if (overrides.citationSystem) next.citations.system = overrides.citationSystem;

  if (overrides.titleStylesByLevel) {
    for (const [lvl, style] of Object.entries(overrides.titleStylesByLevel)) {
      next.sections.titleStylesByLevel[Number(lvl) as 1|2|3|4|5] = style!;
    }
  }

  if (overrides.margins) {
    for (const [side, cm] of Object.entries(overrides.margins) as ['top'|'left'|'bottom'|'right', number][]) {
      const min = MIN_MARGIN_CM[side];
      if (cm < min) throw new Error(`margem ${cm}cm < mínimo ${min}cm (${side})`);
      next.page.margin[side] = cmToTw(cm);
    }
  }
  return next;
}
