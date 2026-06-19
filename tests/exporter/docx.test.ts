import { Document, Paragraph, TextRun } from 'docx';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';

test('toBuffer gera um .docx descompactável com o texto no document.xml', async () => {
  const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun('Olá ABNT')] })] }] });
  const buf = await toBuffer(doc);
  const { documentXml } = await readDocx(buf);
  expect(documentXml).toContain('Olá ABNT');
});
