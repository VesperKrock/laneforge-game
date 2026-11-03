import { ACTIVE_WEAPONS, WEAPON_CATALOG, FAMILY_LABELS, compileCombatBehavior } from './WeaponCatalog';
import type { AnimationFamily, WeaponDefinition, CombatBehavior } from './WeaponCatalog';

// Experimental numbers, not the source author's balance data.
export const TEMP_R2A_CORE = Object.freeze({ id: 'infantry_demo', name: 'Bộ Binh demo', hp: 60, speed: 85, damagePhysical: 0, cost: 10 });
export const TEMP_R2A_SHIELD = Object.freeze({ id: 'demo_shield', hp: 30, cost: 10 });
export const TEMP_R2A_TWO_HAND_MULTIPLIER = 1.30;

export type OffHand = Readonly<{ kind: 'empty' } | { kind: 'shield'; shieldId: string }
  | { kind: 'weapon'; weaponId: string }>;
export interface EquipmentLoadout { readonly mainHand: string | null; readonly offHand: OffHand }
export interface UnitBuild { readonly coreId: string; readonly equipment: EquipmentLoadout }
export type GripMode = 'one_hand' | 'two_hand_grip' | 'fixed_two_hand';
export interface CompiledUnitProfile {
  readonly build: UnitBuild;
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
  if (!object(build) || !hasOnly(build, ['coreId', 'equipment']) || build.coreId !== TEMP_R2A_CORE.id) errors.push('Lõi không hợp lệ; R2A chỉ có Bộ Binh demo.');
  const equipment = object(build) && hasOnly(build, ['coreId', 'equipment']) ? build.equipment : undefined;
  if (!object(equipment) || !hasOnly(equipment, ['mainHand', 'offHand'])) errors.push('Trang bị không hợp lệ.');
  const safeEquipment = object(equipment) && hasOnly(equipment, ['mainHand', 'offHand']) ? equipment : undefined;
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
  // Round only the physical weapon component; never multiply core damage or splash.
  const weaponDamage = Math.round(weapon.damagePhysicalWeapon * (gripMode === 'two_hand_grip' ? TEMP_R2A_TWO_HAND_MULTIPLIER : 1));
  const snapshot: UnitBuild = Object.freeze({ coreId: build.coreId, equipment: Object.freeze({
    mainHand: weapon.id, offHand: Object.freeze({ ...build.equipment.offHand }),
  }) });
  const source = WEAPON_CATALOG.find(item => item.id === weapon.id)!;
  const behavior = compileCombatBehavior(weapon.behavior);
  if (behavior.kind === 'support_retreat' && behavior.kiteDistance >= weapon.attackRange) throw new RangeError('Retreat threshold must be inside attack range');
  return Object.freeze({ build: snapshot, weaponId: weapon.id, family: weapon.animationFamily, gripMode,
    name: `Thử · ${source.sourceName}`, mark: weapon.mark, role: `${FAMILY_LABELS[weapon.animationFamily]} · ${weapon.roleNote ?? 'Thử nghiệm'}`,
    hp: TEMP_R2A_CORE.hp, shieldHp: shield ? TEMP_R2A_SHIELD.hp : 0,
    damagePhysicalCore: TEMP_R2A_CORE.damagePhysical, damagePhysicalWeaponBase: weapon.damagePhysicalWeapon,
    damagePhysicalWeapon: weaponDamage, weaponBonus: weaponDamage - weapon.damagePhysicalWeapon,
    damage: TEMP_R2A_CORE.damagePhysical + weaponDamage,
    attackInterval: weapon.attackInterval, windup: weapon.windup, attackRange: weapon.attackRange,
    speed: TEMP_R2A_CORE.speed, cost: TEMP_R2A_CORE.cost + weapon.cost + (shield ? TEMP_R2A_SHIELD.cost : 0),
    cooldown: weapon.cooldown, behavior,
  });
}
