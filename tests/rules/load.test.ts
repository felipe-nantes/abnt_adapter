import { loadRules } from '../../src/rules/load';

test('loadRules resolve o perfil abnt-2024 em unidades docx', () => {
  const r = loadRules('abnt-2024');
  expect(r.page.margin.top).toBe(1701);
  expect(r.page.margin.bottom).toBe(1134);
  expect(r.page.widthTw).toBe(11906);   // 21cm
  expect(r.fonts.family).toBe('Times New Roman');
  expect(r.fonts.bodyHalfPt).toBe(24);
  expect(r.fonts.smallHalfPt).toBe(20);
  expect(r.spacing.bodyLine).toBe(360);
  expect(r.paragraph.firstLineIndentTw).toBe(709);
  expect(r.citations.longIndentTw).toBe(2268);
  expect(r.citations.etAlFrom).toBe(4);
  expect(r.sections.titleStylesByLevel[1]).toEqual({ case: 'uppercase', bold: true, italic: false });
});
