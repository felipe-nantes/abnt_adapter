import { Document } from 'docx';
import { loadRules } from '../../src/rules/load';
import { buildSection } from '../../src/engine/section';
import { toBuffer } from '../../src/exporter/docx';
import { readDocx } from '../helpers/ooxml';

test('seção tem A4, margens 3/3/2/2 e header com número de página à direita', async () => {
  const rules = loadRules('abnt-2024');
  const doc = new Document({ sections: [buildSection(rules, [])] });
  const { documentXml, headerXmls } = await readDocx(await toBuffer(doc));

  expect(documentXml).toMatch(/w:w="11906"/);          // A4 largura
  expect(documentXml).toMatch(/w:h="16838"/);          // A4 altura
  expect(documentXml).toMatch(/w:top="1701"/);         // 3cm
  expect(documentXml).toMatch(/w:left="1701"/);        // 3cm
  expect(documentXml).toMatch(/w:bottom="1134"/);      // 2cm
  expect(documentXml).toMatch(/w:right="1134"/);       // 2cm
  expect(documentXml).toMatch(/w:header="1134"/);      // 2cm do topo

  const header = headerXmls.join('');
  expect(header).toMatch(/w:jc w:val="right"/);        // número à direita
  expect(header).toMatch(/PAGE/);                       // campo de número de página
});
