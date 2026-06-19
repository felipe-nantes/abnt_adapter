import { z } from 'zod';

const titleStyle = z.object({
  case: z.enum(['uppercase', 'title', 'sentence']),
  bold: z.boolean(),
  italic: z.boolean(),
});

export const rulesJsonSchema = z.object({
  page: z.object({
    widthCm: z.number(),
    heightCm: z.number(),
    margins: z.object({ top: z.number(), left: z.number(), bottom: z.number(), right: z.number() }),
  }),
  fonts: z.object({
    allowedFamilies: z.array(z.string()),
    defaultFamily: z.string(),
    color: z.string(),
    sizesPt: z.object({ body: z.number(), longCitation: z.number() }).passthrough(),
  }),
  spacing: z.object({ body: z.number(), single: z.number() }).passthrough(),
  paragraph: z.object({ firstLineIndentCm: z.number() }).passthrough(),
  pagination: z.object({ distanceFromTopCm: z.number() }).passthrough(),
  sections: z.object({
    titleStylesByLevel: z.record(titleStyle),
  }).passthrough(),
  citations: z.object({
    system: z.enum(['author-date', 'numeric']),
    long: z.object({ leftIndentCm: z.number() }).passthrough(),
    authorDateFormat: z.object({ etAlFromAuthors: z.number() }).passthrough(),
  }).passthrough(),
  references: z.object({}).passthrough(),
  preTextualElements: z.object({}).passthrough().optional(),
}).passthrough();

export type RulesJson = z.infer<typeof rulesJsonSchema>;
