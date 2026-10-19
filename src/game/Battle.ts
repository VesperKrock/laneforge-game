// TEMP_R1B: provisional playtest values, not approved game balance.
export const DEMO = Object.freeze({
  width: 960,
  height: 400,
  playerBaseX: 110,
  enemyBaseX: 850,
  playerBaseHp: 80,
  enemyBaseHp: 90,
  initialGold: 100,
  maxGold: 125,
  goldPerSecond: 5,
  spawnOffset: 14,
  minSpacing: 24,
});

export const TEMP_R1B_UNITS = {
  sword: { name: 'Trường Kiếm', mark: 'TK', role: 'Cân bằng', hp: 60, damage: 12, attackInterval: 0.65, speed: 105, cost: 25, cooldown: 2, attackRange: 28 },
  axe: { name: 'Rìu', mark: 'RI', role: 'Đòn nặng', hp: 88, damage: 26, attackInterval: 1.2, speed: 72, cost: 35, cooldown: 3.2, attackRange: 28 },
  shield: { name: 'Khiên', mark: 'KH', role: 'Chịu đòn bằng HP', hp: 150, damage: 5, attackInterval: 0.95, speed: 54, cost: 40, cooldown: 4, attackRange: 28 },
  gladiator: { name: 'Kiếm Giác Đấu', mark: 'GD', role: 'Đánh nhanh', hp: 38, damage: 7, attackInterval: 0.35, speed: 138, cost: 20, cooldown: 1.5, attackRange: 28 },
  spear: { name: 'Giáo', mark: 'GI', role: 'Hỗ trợ sau tuyến trước', hp: 50, damage: 10, attackInterval: 0.9, speed: 85, cost: 30, cooldown: 2.8, attackRange: 58 },
} as const;
export type UnitKind = keyof typeof TEMP_R1B_UNITS;
export const TEMP_R1B_SLOTS = ['sword', 'axe', 'shield', 'gladiator', 'spear'] as const;
if (new Set<UnitKind>(TEMP_R1B_SLOTS).size !== TEMP_R1B_SLOTS.length) throw new Error('Summon slots must have unique unit types');
export const TEMP_R1B_ENEMIES: readonly { at: number; kind: UnitKind }[] = [
  { at: 0, kind: 'sword' }, { at: 3, kind: 'shield' }, { at: 3, kind: 'spear' },
  { at: 6, kind: 'gladiator' },
  { at: 10, kind: 'axe' }, { at: 14, kind: 'sword' },
  { at: 18, kind: 'shield' }, { at: 18, kind: 'axe' },
];
const EPSILON = 1e-7;

export type Phase = 'ready' | 'running' | 'won' | 'lost';
export type Side = 'friendly' | 'enemy';
export interface Unit {
  id: number;
  side: Side;
  kind: UnitKind;
  x: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackInterval: number;
  attackRange: number;
  attackIn: number;
  flash: number;
}

export class Battle {
  phase: Phase = 'ready';
  gold: number = DEMO.initialGold;
  cooldowns: number[] = TEMP_R1B_SLOTS.map(() => 0);
  playerHp: number = DEMO.playerBaseHp;
  enemyHp: number = DEMO.enemyBaseHp;
  elapsed = 0;
  hits = 0;
  units: Unit[] = [];
  event = 'Bấm Bắt đầu, sau đó triệu hồi Trường Kiếm.';
  private nextId = 0;
  private nextEnemy = 0;

  start(): void {
    this.phase = 'running';
    this.gold = DEMO.initialGold;
    this.cooldowns = TEMP_R1B_SLOTS.map(() => 0);
    this.playerHp = DEMO.playerBaseHp;
    this.enemyHp = DEMO.enemyBaseHp;
    this.elapsed = 0;
    this.hits = 0;
    this.units = [];
    this.nextId = 0;
    this.nextEnemy = 0;
    this.event = 'Địch đang tiến tới. Năm slot dùng chung Vàng, CD riêng!';
    this.spawnEnemyIfDue();
  }

  canSummon(slot: number): boolean {
    if (!Number.isInteger(slot) || slot < 0 || slot >= TEMP_R1B_SLOTS.length) return false;
    const profile = TEMP_R1B_UNITS[TEMP_R1B_SLOTS[slot]];
    return this.phase === 'running' && this.cooldowns[slot] <= 0 && this.gold >= profile.cost && this.spawnIsClear('friendly');
  }

  summon(slot: number): boolean {
    if (!this.canSummon(slot)) return false;
    const kind = TEMP_R1B_SLOTS[slot];
    const profile = TEMP_R1B_UNITS[kind];
    this.gold -= profile.cost;
    this.cooldowns[slot] = profile.cooldown;
    this.spawn('friendly', kind);
    this.event = `Slot ${slot + 1}: ${profile.name} — trừ ${profile.cost} Vàng thử nghiệm.`;
    return true;
  }

  step(seconds: number): void {
    if (this.phase !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
    // A background tab never causes a large burst of movement or damage on return.
    const dt = Math.min(seconds, 0.05);
    this.elapsed += dt;
    this.gold = Math.min(DEMO.maxGold, this.gold + DEMO.goldPerSecond * dt);
    this.cooldowns = this.cooldowns.map(cooldown => Math.max(0, cooldown - dt));
    this.spawnEnemyIfDue();

    for (const unit of this.units) {
      if (unit.hp <= 0) continue;
      unit.attackIn -= dt;
      unit.flash = Math.max(0, unit.flash - dt);
    }
    // Move each team front to back: the rear unit cannot pass its living teammate.
    for (const side of ['friendly', 'enemy'] as const) {
      const direction = side === 'friendly' ? 1 : -1;
      const team = this.units.filter(unit => unit.side === side && unit.hp > 0)
        .sort((a, b) => (b.x - a.x) * direction || a.id - b.id);
      let leader: Unit | undefined;
      for (const unit of team) {
        const { distance } = this.targetAhead(unit);
        const space = leader ? Math.max(0, (leader.x - unit.x) * direction - DEMO.minSpacing) : Infinity;
        const movement = Math.min(unit.speed * dt, Math.max(0, distance - unit.attackRange), space);
        unit.x += direction * movement;
        leader = unit;
      }
    }
    // Stable ID order also resolves simultaneous lethal blows without a side bonus.
    for (const unit of [...this.units].sort((a, b) => a.id - b.id)) {
      if (unit.hp <= 0) continue;
      const { target, distance } = this.targetAhead(unit);
      if (distance > unit.attackRange + EPSILON) {
        unit.attackIn = Math.max(0, unit.attackIn); // No attack credit saved while marching.
      } else if (unit.attackIn <= EPSILON) {
        unit.attackIn += unit.attackInterval; // Carry fractional-frame overshoot, not a new full interval.
        unit.flash = 0.15;
        if (target) target.hp = Math.max(0, target.hp - unit.damage);
        else if (unit.side === 'friendly') this.enemyHp = Math.max(0, this.enemyHp - unit.damage);
        else this.playerHp = Math.max(0, this.playerHp - unit.damage);
        if (unit.side === 'friendly') {
          this.hits += 1;
          const name = TEMP_R1B_UNITS[unit.kind].name;
          this.event = target ? `${name} đánh trúng lính địch!` : `${name} đánh trúng căn cứ địch!`;
        } else this.event = target ? 'Đơn vị ta đang giao chiến.' : 'Căn cứ ta đang bị tấn công!';
        if (this.enemyHp <= 0 || this.playerHp <= 0) {
          this.phase = this.enemyHp <= 0 ? 'won' : 'lost';
          this.event = this.phase === 'won' ? 'Thắng — căn cứ địch đã bị phá. Bấm Chơi lại để thử tiếp.' : 'Thua — căn cứ ta đã bị phá. Bấm Chơi lại để thử tiếp.';
          break;
        }
      }
    }
    this.units = this.units.filter(unit => unit.hp > 0);
  }

  private targetAhead(unit: Unit): { target: Unit | undefined; distance: number } {
    const direction = unit.side === 'friendly' ? 1 : -1;
    const baseX = unit.side === 'friendly' ? DEMO.enemyBaseX : DEMO.playerBaseX;
    const baseDistance = Math.max(0, (baseX - unit.x) * direction);
    let distance = baseDistance;
    let target: Unit | undefined;
    for (const other of this.units) {
      if (other.side === unit.side || other.hp <= 0) continue;
      const ahead = (other.x - unit.x) * direction;
      if (ahead < -EPSILON || ahead > baseDistance + EPSILON) continue;
      if (!target || ahead < distance - EPSILON || (Math.abs(ahead - distance) <= EPSILON && other.id < target.id)) {
        target = other;
        distance = Math.max(0, ahead);
      }
    }
    return { target, distance };
  }

  private spawnX(side: Side): number {
    return side === 'friendly' ? DEMO.playerBaseX + DEMO.spawnOffset : DEMO.enemyBaseX - DEMO.spawnOffset;
  }

  private spawnIsClear(side: Side): boolean {
    const x = this.spawnX(side);
    // Fixed gate inside base range. Never place reinforcements behind a base attacker.
    return !this.units.some(unit => unit.hp > 0 && (unit.side === side
      ? Math.abs(unit.x - x) < DEMO.minSpacing - EPSILON
      : (unit.x - x) * (side === 'friendly' ? 1 : -1) < -EPSILON));
  }

  private spawnEnemyIfDue(): void {
    const scheduled = TEMP_R1B_ENEMIES[this.nextEnemy];
    if (scheduled && this.elapsed + EPSILON >= scheduled.at && this.spawnIsClear('enemy')) {
      this.spawn('enemy', scheduled.kind);
      this.nextEnemy += 1;
      this.event = `Địch tiếp viện: ${TEMP_R1B_UNITS[scheduled.kind].name}.`;
    }
  }

  private spawn(side: Side, kind: UnitKind): void {
    const profile = TEMP_R1B_UNITS[kind];
    this.units.push({
      id: this.nextId++, side, kind,
      // Spawn inside base attack range so reinforcements cannot appear behind an attacker.
      x: this.spawnX(side),
      hp: profile.hp, maxHp: profile.hp,
      damage: profile.damage,
      speed: profile.speed,
      attackInterval: profile.attackInterval,
      attackRange: profile.attackRange,
      attackIn: 0, flash: 0,
    });
  }
}
