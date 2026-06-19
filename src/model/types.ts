export type TitleStyle = { case: 'uppercase'|'title'|'sentence'; bold: boolean; italic: boolean };

export type CitationRef = { authors: string[]; year: string; page?: string; location?: string };
export type ShortCitation = { kind: 'shortCitation'; text: string; citation: CitationRef };
export type Run = { text: string; italic?: boolean; bold?: boolean } | ShortCitation;

export type Heading = { kind: 'heading'; level: 1|2|3|4|5; text: string };
export type Paragraph = { kind: 'paragraph'; runs: Run[] };
export type LongCitation = { kind: 'longCitation'; text: string; citation: CitationRef };
export type Block = Heading | Paragraph | LongCitation;

export type Reference = { sortKey: string; runs: Run[] };

export type ProfileOverrides = {
  fontFamily?: 'Times New Roman' | 'Arial';
  citationSystem?: 'author-date' | 'numeric';
  titleStylesByLevel?: Partial<Record<1|2|3|4|5, TitleStyle>>;
  margins?: { top?: number; left?: number; bottom?: number; right?: number }; // cm
};

export type StructuredDocument = {
  overrides?: ProfileOverrides;
  body: Block[];
  references: Reference[];
};
