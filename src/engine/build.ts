import { Document, type FileChild } from 'docx';
import type { StructuredDocument, Block } from '../model/types';
import { applyOverrides, type ResolvedRules } from '../rules/load';
import { buildSection } from './section';
import { buildParagraph } from './paragraph';
import { buildHeading, SectionCounter } from './heading';
import { buildLongCitation } from './citation';
import { buildReferences } from './references';

export function build(model: StructuredDocument, baseRules: ResolvedRules): Document {
  const rules = applyOverrides(baseRules, model.overrides);
  const counter = new SectionCounter();
  const children: FileChild[] = [];

  for (const block of model.body as Block[]) {
    if (block.kind === 'heading') children.push(buildHeading(block, counter, rules));
    else if (block.kind === 'paragraph') children.push(buildParagraph(block, rules));
    else if (block.kind === 'longCitation') children.push(buildLongCitation(block, rules));
  }

  if (model.references.length > 0) children.push(...buildReferences(model.references, rules));

  return new Document({ sections: [buildSection(rules, children)] });
}
