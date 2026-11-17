// Appearance is identity metadata only. No texture, combat stats or behavior lives here.
export const APPEARANCES = Object.freeze([
  Object.freeze({ id: 'actor_1_1', name: 'Tóc nâu · áo lam' }),
  Object.freeze({ id: 'actor_2_1', name: 'Tóc xanh · giáp bạc' }),
  Object.freeze({ id: 'actor_2_4', name: 'Tóc tím · áo đỏ' }),
  Object.freeze({ id: 'actor_2_7', name: 'Tóc vàng · choàng xanh' }),
  Object.freeze({ id: 'actor_3_6', name: 'Mũ đỏ' }),
] as const);
export type AppearanceId = typeof APPEARANCES[number]['id'];
export const DEFAULT_APPEARANCE: AppearanceId = 'actor_1_1';
export const isAppearanceId = (value: unknown): value is AppearanceId => APPEARANCES.some(a => a.id === value);
export const appearanceName = (id: AppearanceId): string => APPEARANCES.find(a => a.id === id)!.name;
