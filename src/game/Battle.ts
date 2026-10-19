// TEMP_R1A: provisional playtest values, not approved game balance.
export const DEMO = Object.freeze({
  width: 960,
  height: 400,
  playerBaseX: 110,
  enemyBaseX: 850,
  playerBaseHp: 80,
  enemyBaseHp: 90,
  initialGold: 100,
  maxGold: 125,
  goldPerSecond: 6,
  spawnOffset: 14,
  attackRange: 28,
});

export const TEMP_R1A_UNITS = {
  sword: { name: 'Trường Kiếm', mark: 'TK', role: 'Cân bằng', hp: 60, damage: 12, attackInterval: 0.65, speed: 105, cost: 25, cooldown: 2 },
  axe: { name: 'Rìu', mark: 'RI', role: 'Đòn nặng', hp: 88, damage: 26, attackInterval: 1.2, speed: 72, cost: 35, cooldown: 3.2 },
  shield: { name: 'Khiên', mark: 'KH', role: 'Chịu đòn bằng HP', hp: 150, damage: 5, attackInterval: 0.95, speed: 54, cost: 40, cooldown: 4 },
  gladiator: { name: 'Kiếm Giác Đấu', mark: 'GD', role: 'Đánh nhanh', hp: 38, damage: 7, attackInterval: 0.35, speed: 138, cost: 20, cooldown: 1.5 },
} as const;
export type UnitKind = keyof typeof TEMP_R1A_UNITS;
export const TEMP_R1A_SLOTS = ['sword', 'axe', 'shield', 'gladiator', 'sword'] as const;
const TEMP_R1A_ENEMIES: readonly { at: number; kind: UnitKind }[] = [
  { at: 0, kind: 'sword' }, { at: 6, kind: 'axe' }, { at: 10, kind: 'gladiator' },
];

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
  attackIn: number;
  flash: number;
}

export class Battle {
  phase: Phase = 'ready';
  gold: number = DEMO.initialGold;
  cooldowns: number[] = TEMP_R1A_SLOTS.map(() => 0);
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
    this.cooldowns = TEMP_R1A_SLOTS.map(() => 0);
    this.playerHp = DEMO.playerBaseHp;
    this.enemyHp = DEMO.enemyBaseHp;
    this.elapsed = 0;
    this.hits = 0;
    this.units = [];
    this.nextId = 0;
    this.nextEnemy = 1;
    this.event = 'Địch đang tiến tới. Năm slot dùng chung Vàng, CD riêng!';
    this.spawn('enemy', TEMP_R1A_ENEMIES[0].kind);
  }

  canSummon(slot: number): boolean {
    if (!Number.isInteger(slot) || slot < 0 || slot >= TEMP_R1A_SLOTS.length) return false;
    const profile = TEMP_R1A_UNITS[TEMP_R1A_SLOTS[slot]];
    return this.phase === 'running' && this.cooldowns[slot] <= 0 && this.gold >= profile.cost;
  }

  summon(slot: number): boolean {
    if (!this.canSummon(slot)) return false;
    const kind = TEMP_R1A_SLOTS[slot];
    const profile = TEMP_R1A_UNITS[kind];
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
    const scheduled = TEMP_R1A_ENEMIES[this.nextEnemy];
    if (scheduled && this.elapsed >= scheduled.at) {
      this.spawn('enemy', scheduled.kind);
      this.nextEnemy += 1;
      this.event = `Địch tiếp viện: ${TEMP_R1A_UNITS[scheduled.kind].name}.`;
    }

    for (const unit of this.units) {
      if (unit.hp <= 0) continue;
      unit.attackIn = Math.max(0, unit.attackIn - dt);
      unit.flash = Math.max(0, unit.flash - dt);
      const direction = unit.side === 'friendly' ? 1 : -1;
      const baseX = unit.side === 'friendly' ? DEMO.enemyBaseX : DEMO.playerBaseX;
      let distance = Math.max(0, (baseX - unit.x) * direction);
      let target: Unit | undefined;
      for (const other of this.units) {
        if (other.side === unit.side || other.hp <= 0) continue;
        const ahead = (other.x - unit.x) * direction;
        if (ahead >= 0 && ahead <= distance) { target = other; distance = ahead; }
      }
      if (distance > DEMO.attackRange) {
        unit.x += direction * Math.min(unit.speed * dt, distance - DEMO.attackRange);
      } else if (unit.attackIn <= 0) {
        unit.attackIn = unit.attackInterval;
        unit.flash = 0.15;
        if (target) target.hp = Math.max(0, target.hp - unit.damage);
        else if (unit.side === 'friendly') this.enemyHp = Math.max(0, this.enemyHp - unit.damage);
        else this.playerHp = Math.max(0, this.playerHp - unit.damage);
        if (unit.side === 'friendly') {
          this.hits += 1;
          const name = TEMP_R1A_UNITS[unit.kind].name;
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

  private spawn(side: Side, kind: UnitKind): void {
    const friendly = side === 'friendly';
    const profile = TEMP_R1A_UNITS[kind];
    this.units.push({
      id: this.nextId++, side, kind,
      // Spawn inside base attack range so reinforcements cannot appear behind an attacker.
      x: friendly ? DEMO.playerBaseX + DEMO.spawnOffset : DEMO.enemyBaseX - DEMO.spawnOffset,
      hp: profile.hp, maxHp: profile.hp,
      damage: profile.damage,
      speed: profile.speed,
      attackInterval: profile.attackInterval,
      attackIn: 0, flash: 0,
    });
  }
}
