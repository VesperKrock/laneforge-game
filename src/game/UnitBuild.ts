import { ACTIVE_WEAPONS, WEAPON_CATALOG, FAMILY_LABELS, compileCombatBehavior } from './WeaponCatalog';
import type { AnimationFamily, WeaponDefinition, CombatBehavior } from './WeaponCatalog';
import { DEFAULT_APPEARANCE, isAppearanceId } from './Appearance';
import type { AppearanceId } from './Appearance';

// Experimental numbers, not the source author's balance data.
export const TEMP_R2A_CORE = Object.freeze({ id: 'infantry_demo', name: 'Bộ Binh demo', hp: 60, speed: 85, damagePhysical: 0, cost: 10 });
export const TEMP_R2A_SHIELD = Object.freeze({ id: 'demo_shield', hp: 30, cost: 10 });
export const TEMP_R2A_TWO_HAND_MULTIPLIER = 1.30;

export type OffHand = Readonly<{ kind: 'empty' } | { kind: 'shield'; shieldId: string }
  | { kind: 'weapon'; weaponId: string }>;
// TEMP_R2D: additive experimental equipment; no defense or weight simulation.
export const TEMP_R2D_ARMORS = Object.freeze([
  Object.freeze({ id: 'light_armor', name: 'Light Armor', hp: 8, cost: 2, speed: 0 }),
  Object.freeze({ id: 'chain_armor', name: 'Chain Armor', hp: 18, cost: 6, speed: -6 }),
  Object.freeze({ id: 'heavy_armor', name: 'Heavy Armor', hp: 32, cost: 11, speed: -12 }),
]);
export const TEMP_R2D_ACCESSORIES = Object.freeze([
  Object.freeze({ id: 'vital_charm', name: 'Vital Charm', hp: 12, cost: 4, speed: 0, damage: 0, cooldown: 0 }),
  Object.freeze({ id: 'swift_charm', name: 'Swift Charm', hp: 0, cost: 4, speed: 8, damage: 0, cooldown: 0 }),
  Object.freeze({ id: 'whetstone', name: 'Whetstone', hp: 0, cost: 5, speed: 0, damage: 4, cooldown: .2 }),
]);
export interface EquipmentLoadout {
  readonly mainHand: string | null;
  readonly offHand: OffHand;
  // Omitted fields preserve pre-R2D builds; null explicitly selects no equipment.
  readonly armor?: string | null;
  readonly accessory?: string | null;
}
export interface UnitBuild { readonly coreId: string; readonly appearanceId?: string; readonly equipment: EquipmentLoadout }
export type GripMode = 'one_hand' | 'two_hand_grip' | 'fixed_two_hand';
export interface CompiledUnitProfile {
  readonly build: UnitBuild;
  readonly appearanceId: AppearanceId;
  readonly weaponId: string;
  readonly family: AnimationFamily;
  readonly gripMode: GripMode;
  readonly name: string;
  readonly mark: string;
  readonly role: string;
  readonly hp: number;
  readonly shieldHp: number;
  readonly damagePhysicalCore: number;
  readonly damagePhysicalWeaponBase: number;
  readonly damagePhysicalWeapon: number;
  readonly weaponBonus: number;
  readonly damage: number;
  readonly attackInterval: number;
  readonly windup: number;
  readonly attackRange: number;
  readonly speed: number;
  readonly cost: number;
  readonly cooldown: number;
  readonly behavior: CombatBehavior;
}

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasOnly = (value: Record<string, unknown>, keys: string[]) => Object.getPrototypeOf(value) === Object.prototype
  && Reflect.ownKeys(value).every(key => typeof key === 'string' && keys.includes(key)
    && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, 'value'));

export function validateBuild(build: unknown): Readonly<{ valid: boolean; errors: readonly string[] }> {
  const errors: string[] = [];
  const safeBuild = object(build) && hasOnly(build, ['coreId', 'equipment', 'appearanceId']) ? build : undefined;
  if (!safeBuild || safeBuild.coreId !== TEMP_R2A_CORE.id) errors.push('Lõi không hợp lệ; R2A chỉ có Bộ Binh demo.');
  if (safeBuild && Object.hasOwn(safeBuild, 'appearanceId') && !isAppearanceId(safeBuild.appearanceId)) errors.push('Ngoại hình không hợp lệ.');
  const equipment = safeBuild?.equipment;
  if (!object(equipment) || !hasOnly(equipment, ['mainHand', 'offHand', 'armor', 'accessory'])) errors.push('Trang bị không hợp lệ.');
  const safeEquipment = object(equipment) && hasOnly(equipment, ['mainHand', 'offHand', 'armor', 'accessory']) ? equipment : undefined;
  for (const [key, catalog] of [['armor', TEMP_R2D_ARMORS], ['accessory', TEMP_R2D_ACCESSORIES]] as const) {
    if (safeEquipment && Object.hasOwn(safeEquipment, key) && safeEquipment[key] !== null
      && !catalog.some(item => item.id === safeEquipment[key])) errors.push(`Trang bị ${key} không hợp lệ.`);
  }
  const weapon = safeEquipment ? ACTIVE_WEAPONS.find(item => item.id === safeEquipment.mainHand) : undefined;
  if (!weapon) errors.push(`Tay chính phải là một trong ${ACTIVE_WEAPONS.length} vũ khí đang hoạt động.`);
  const off = safeEquipment?.offHand;
  if (!object(off) || !hasOnly(off, ['kind', 'weaponId', 'shieldId'])) errors.push('Phải chọn tay phụ Trống hoặc Khiên.');
  else if (off.kind === 'weapon') errors.push('Dual wield chưa triển khai.');
  else if (off.kind === 'empty' && hasOnly(off, ['kind'])) { /* valid empty hand */ }
  else if (off.kind === 'shield' && off.shieldId === TEMP_R2A_SHIELD.id && hasOnly(off, ['kind', 'shieldId'])) {
    if (weapon && weapon.gripClass !== 'one_hand') errors.push('Vũ khí hai tay cố định không thể mang Khiên.');
  } else errors.push('Tay phụ không hợp lệ.');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function compileBuild(build: UnitBuild): CompiledUnitProfile {
  const validation = validateBuild(build);
  if (!validation.valid) throw new RangeError(validation.errors.join(' '));
  const weapon = ACTIVE_WEAPONS.find(item => item.id === build.equipment.mainHand) as WeaponDefinition;
  const shield = build.equipment.offHand.kind === 'shield';
  const gripMode: GripMode = weapon.gripClass !== 'one_hand' ? 'fixed_two_hand'
    : !shield && weapon.canTwoHandGrip ? 'two_hand_grip' : 'one_hand';
  const armor = TEMP_R2D_ARMORS.find(item => item.id === build.equipment.armor);
  const accessory = TEMP_R2D_ACCESSORIES.find(item => item.id === build.equipment.accessory);
  const weaponBase = weapon.damagePhysicalWeapon + (accessory?.damage ?? 0);
  // Whetstone enters the base before grip rounding; core and splash stay separate.
  const weaponDamage = Math.round(weaponBase * (gripMode === 'two_hand_grip' ? TEMP_R2A_TWO_HAND_MULTIPLIER : 1));
  const snapshot: UnitBuild = Object.freeze({ coreId: build.coreId,
    ...(Object.hasOwn(build, 'appearanceId') ? { appearanceId: build.appearanceId } : {}), equipment: Object.freeze({
    mainHand: weapon.id, offHand: Object.freeze({ ...build.equipment.offHand }),
    ...(Object.hasOwn(build.equipment, 'armor') ? { armor: build.equipment.armor } : {}),
    ...(Object.hasOwn(build.equipment, 'accessory') ? { accessory: build.equipment.accessory } : {}),
  }) });
  const source = WEAPON_CATALOG.find(item => item.id === weapon.id)!;
  const behavior = compileCombatBehavior(weapon.behavior);
  if (behavior.kind === 'support_retreat' && behavior.kiteDistance >= weapon.attackRange) throw new RangeError('Retreat threshold must be inside attack range');
  return Object.freeze({ build: snapshot, appearanceId: (build.appearanceId ?? DEFAULT_APPEARANCE) as AppearanceId,
    weaponId: weapon.id, family: weapon.animationFamily, gripMode,
    name: `Thử · ${source.sourceName}`, mark: weapon.mark, role: `${FAMILY_LABELS[weapon.animationFamily]} · ${weapon.roleNote ?? 'Thử nghiệm'}`,
    hp: TEMP_R2A_CORE.hp + (armor?.hp ?? 0) + (accessory?.hp ?? 0), shieldHp: shield ? TEMP_R2A_SHIELD.hp : 0,
    damagePhysicalCore: TEMP_R2A_CORE.damagePhysical, damagePhysicalWeaponBase: weaponBase,
    damagePhysicalWeapon: weaponDamage, weaponBonus: weaponDamage - weaponBase,
    damage: TEMP_R2A_CORE.damagePhysical + weaponDamage,
    attackInterval: weapon.attackInterval, windup: weapon.windup, attackRange: weapon.attackRange,
    speed: TEMP_R2A_CORE.speed + (armor?.speed ?? 0) + (accessory?.speed ?? 0),
    cost: TEMP_R2A_CORE.cost + weapon.cost + (shield ? TEMP_R2A_SHIELD.cost : 0) + (armor?.cost ?? 0) + (accessory?.cost ?? 0),
    cooldown: Math.round((weapon.cooldown + (accessory?.cooldown ?? 0)) * 1000) / 1000, behavior,
  });
}
