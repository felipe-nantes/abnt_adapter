import { loadRules, applyOverrides } from '../../src/rules/load';

test('override de fontFamily válido é aplicado', () => {
  const r = applyOverrides(loadRules('abnt-2024'), { fontFamily: 'Arial' });
  expect(r.fonts.family).toBe('Arial');
});

test('override de margem válido é convertido para twips', () => {
  const r = applyOverrides(loadRules('abnt-2024'), { margins: { top: 3.5 } });
  expect(r.page.margin.top).toBe(1984); // 3.5 * 566.93 = 1984.25 -> 1984
});

test('override de margem abaixo do mínimo é rejeitado', () => {
  expect(() => applyOverrides(loadRules('abnt-2024'), { margins: { bottom: 1.5 } }))
    .toThrow(/margem .* mínimo/);
});

test('citationSystem numeric é aceito como override válido', () => {
  const r = applyOverrides(loadRules('abnt-2024'), { citationSystem: 'numeric' });
  expect(r.citations.system).toBe('numeric');
});
