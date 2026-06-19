import { cmToTw, ptToHalfPt, spacingToLine } from '../../src/rules/units';

test('cmToTw converte cm para twips arredondado', () => {
  expect(cmToTw(3)).toBe(1701);   // 3 * 566.93 = 1700.79 -> 1701
  expect(cmToTw(2)).toBe(1134);   // 1133.86 -> 1134
  expect(cmToTw(1.25)).toBe(709); // 708.66 -> 709
  expect(cmToTw(4)).toBe(2268);
});

test('ptToHalfPt dobra o valor', () => {
  expect(ptToHalfPt(12)).toBe(24);
  expect(ptToHalfPt(10)).toBe(20);
});

test('spacingToLine mapeia multiplicador para line', () => {
  expect(spacingToLine(1.5)).toBe(360);
  expect(spacingToLine(1.0)).toBe(240);
});
