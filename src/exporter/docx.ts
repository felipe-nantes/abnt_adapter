import { Document, Packer } from 'docx';

export function toBuffer(doc: Document): Promise<Buffer> {
  return Packer.toBuffer(doc);
}
