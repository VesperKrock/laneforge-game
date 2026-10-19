// TEMP_R1B: provisional playtest values, not approved game balance.
export const DEMO = Object.freeze({
  width: 960,
  height: 400,
  playerBaseX: 110,
  enemyBaseX: 850,
  baseHp: 240,
  initialGold: 100,
  maxGold: 125,
  goldPerSecond: 5,
  spawnOffset: 14,
});

// TEMP_R1C: formation/cadence experiments; unit stats and economy stay TEMP_R1B.
export const TEMP_R1C = Object.freeze({ supportOffset: 24, botDecisionSeconds: 0.75 });

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
  gold: Record<Side, number> = { friendly: DEMO.initialGold, enemy: DEMO.initialGold };
  cooldowns: Record<Side, number[]> = { friendly: TEMP_R1B_SLOTS.map(() => 0), enemy: TEMP_R1B_SLOTS.map(() => 0) };
  playerHp: number = DEMO.baseHp;
  enemyHp: number = DEMO.baseHp;
  elapsed = 0;
  hits = 0;
  units: Unit[] = [];
  event = 'Bấm Bắt đầu để đấu với Bot.';
  botChoice: { slot: number; reason: string; at: number } | undefined;
  private nextId = 0;
  private botDecisionIn: number = TEMP_R1C.botDecisionSeconds;

  start(): void {
    this.phase = 'running';
    this.gold = { friendly: DEMO.initialGold, enemy: DEMO.initialGold };
    this.cooldowns = { friendly: TEMP_R1B_SLOTS.map(() => 0), enemy: TEMP_R1B_SLOTS.map(() => 0) };
    this.playerHp = DEMO.baseHp;
    this.enemyHp = DEMO.baseHp;
    this.elapsed = 0;
    this.hits = 0;
    this.units = [];
    this.nextId = 0;
    this.botDecisionIn = TEMP_R1C.botDecisionSeconds;
    this.botChoice = undefined;
    this.event = 'Solo vs Bot — mỗi bên có Vàng và năm CD riêng.';
  }

  canSummon(side: Side, slot: number): boolean {
    if ((side !== 'friendly' && side !== 'enemy') || !Number.isInteger(slot) || slot < 0 || slot >= TEMP_R1B_SLOTS.length) return false;
    const profile = TEMP_R1B_UNITS[TEMP_R1B_SLOTS[slot]];
    return this.phase === 'running' && this.cooldowns[side][slot] <= 0 && this.gold[side] >= profile.cost && this.spawnIsClear(side);
  }

  summon(side: Side, slot: number): boolean {
    if (!this.canSummon(side, slot)) return false;
    const kind = TEMP_R1B_SLOTS[slot];
    const profile = TEMP_R1B_UNITS[kind];
    this.gold[side] -= profile.cost;
    this.cooldowns[side][slot] = profile.cooldown;
    this.spawn(side, kind);
    this.event = `${side === 'friendly' ? 'Player' : 'Bot'}: ${profile.name} — trừ ${profile.cost} Vàng thử nghiệm.`;
    return true;
  }

  step(seconds: number): void {
    if (this.phase !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
    this.assertBattleInvariant();
    // A background tab never causes a large burst of movement or damage on return.
    const dt = Math.min(seconds, 0.05);
    this.elapsed += dt;
    for (const side of ['friendly', 'enemy'] as const) {
      this.gold[side] = Math.min(DEMO.maxGold, this.gold[side] + DEMO.goldPerSecond * dt);
      this.cooldowns[side] = this.cooldowns[side].map(cooldown => Math.max(0, cooldown - dt));
    }
    for (const unit of this.units) {
      if (unit.hp <= 0) continue;
      unit.attackIn -= dt;
      unit.flash = Math.max(0, unit.flash - dt);
    }
    // Allies may overlap/pass each other; only opponents stop forward movement.
    for (const support of [false, true]) {
      const moves = this.units.filter(unit => unit.hp > 0 && (unit.kind === 'spear') === support)
        .map(unit => ({ unit, x: this.nextX(unit, dt) }));
      for (const { unit, x } of moves) unit.x = x;
      this.assertBattleInvariant();
    }
    // Select every hit before applying damage: a same-tick lethal hit cannot cancel a reply.
    const attacks: { unit: Unit; target: Unit | undefined }[] = [];
    for (const unit of [...this.units].sort((a, b) => a.id - b.id)) {
      if (unit.hp <= 0) continue;
      const { target, distance } = this.targetAhead(unit);
      if (distance > unit.attackRange + EPSILON) {
        unit.attackIn = Math.max(0, unit.attackIn); // No attack credit saved while marching.
      } else if (unit.attackIn <= EPSILON) {
        unit.attackIn += unit.attackInterval; // Carry fractional-frame overshoot, not a new full interval.
        unit.flash = 0.15;
        attacks.push({ unit, target });
      }
    }
    for (const { unit, target } of attacks) {
      if (target) target.hp = Math.max(0, target.hp - unit.damage);
      else if (unit.side === 'friendly') this.enemyHp = Math.max(0, this.enemyHp - unit.damage);
      else this.playerHp = Math.max(0, this.playerHp - unit.damage);
      if (unit.side === 'friendly') {
        this.hits += 1;
        const name = TEMP_R1B_UNITS[unit.kind].name;
        this.event = target ? `${name} đánh trúng lính địch!` : `${name} đánh trúng căn cứ địch!`;
      } else this.event = target ? 'Đơn vị ta đang giao chiến.' : 'Căn cứ ta đang bị tấn công!';
    }
    this.assertBattleInvariant(); // Invalid state must never be resolved in either side's favor.
    if (this.enemyHp <= 0 || this.playerHp <= 0) {
      this.phase = this.enemyHp <= 0 ? 'won' : 'lost';
      this.event = this.phase === 'won' ? 'Thắng — căn cứ địch đã bị phá. Bấm Chơi lại để thử tiếp.' : 'Thua — căn cứ ta đã bị phá. Bấm Chơi lại để thử tiếp.';
    }
    this.units = this.units.filter(unit => unit.hp > 0);
    // Like Player input between frames, a paid Bot summon starts acting next step.
    this.botDecisionIn -= dt;
    if (this.phase === 'running' && this.botDecisionIn <= EPSILON) {
      this.botDecisionIn += TEMP_R1C.botDecisionSeconds;
      const choice = this.chooseBotSlot();
      if (choice && this.summon('enemy', choice.slot)) this.botChoice = { ...choice, at: this.elapsed };
    }
  }

  private assertBattleInvariant(): void {
    let friendlyFront = -Infinity;
    let enemyFront = Infinity;
    for (const unit of this.units) {
      if (unit.hp <= 0) continue;
      if (!Number.isFinite(unit.x) || unit.x < this.spawnX('friendly') - EPSILON || unit.x > this.spawnX('enemy') + EPSILON) {
        throw new Error('Battle invariant violated: unit outside lane');
      }
      if (unit.side === 'friendly') friendlyFront = Math.max(friendlyFront, unit.x);
      else enemyFront = Math.min(enemyFront, unit.x);
    }
    if (friendlyFront > enemyFront + EPSILON) throw new Error('Battle invariant violated: opposing units crossed');
    if (this.playerHp <= 0 && this.enemyHp <= 0) throw new Error('Battle invariant violated: both bases destroyed');
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
    return !this.units.some(unit => unit.hp > 0 && unit.side !== side
      && (unit.x - x) * (side === 'friendly' ? 1 : -1) < -EPSILON);
  }

  private nextX(unit: Unit, dt: number): number {
    const direction = unit.side === 'friendly' ? 1 : -1;
    let supportSpace = Infinity;
    if (unit.kind === 'spear') {
      const melee = this.units.filter(other => other.side === unit.side && other.hp > 0 && other.kind !== 'spear');
      if (melee.length) {
        const front = melee.reduce((a, b) => (b.x - a.x) * direction > 0 ? b : a);
        const supportX = direction === 1
          ? Math.max(this.spawnX(unit.side), front.x - TEMP_R1C.supportOffset)
          : Math.min(this.spawnX(unit.side), front.x + TEMP_R1C.supportOffset);
        supportSpace = (supportX - unit.x) * direction;
        if (supportSpace < -EPSILON) {
          // Yield at normal speed when new melee arrives behind; never teleport.
          return unit.x - direction * Math.min(unit.speed * dt, -supportSpace);
        }
      }
    }
    const { distance } = this.targetAhead(unit);
    return unit.x + direction * Math.min(unit.speed * dt, Math.max(0, distance - unit.attackRange), Math.max(0, supportSpace));
  }

  private chooseBotSlot(): { slot: number; reason: string } | undefined {
    const own = this.units.filter(unit => unit.side === 'enemy' && unit.hp > 0);
    const foes = this.units.filter(unit => unit.side === 'friendly' && unit.hp > 0);
    const melee = own.filter(unit => unit.kind !== 'spear');
    const pressure = foes.some(unit => unit.x >= DEMO.enemyBaseX - 180);
    const durable = foes.some(unit => unit.hp >= TEMP_R1B_UNITS.axe.hp
      && melee.some(front => Math.abs(front.x - unit.x) <= 90));
    const supported = melee.some(front => foes.some(foe => Math.abs(front.x - foe.x) <= TEMP_R1B_UNITS.spear.attackRange));
    // An unopposed raiding frontline needs no further spending yet.
    if (!foes.length && melee.some(unit => unit.x < DEMO.width / 2)) return undefined;
    const priorities: Record<UnitKind, { score: number; reason: string }> = {
      shield: { score: !own.some(unit => unit.kind === 'shield') && (!melee.length || pressure) ? 10 : 1, reason: 'Giữ tuyến' },
      spear: { score: supported && melee.length > own.filter(unit => unit.kind === 'spear').length ? 9 : 0, reason: 'Hỗ trợ tuyến trước' },
      axe: { score: durable ? 9 : 2, reason: durable ? 'Đánh mục tiêu bền' : 'Tiếp viện đòn nặng' },
      sword: { score: 5, reason: 'Bổ sung cận chiến' },
      gladiator: { score: pressure ? 8 : 3, reason: pressure ? 'Ứng cứu nhanh' : 'Tiếp viện nhanh' },
    };
    const choices = TEMP_R1B_SLOTS.map((kind, slot) => ({ slot, reason: priorities[kind].reason,
      score: priorities[kind].score - own.filter(unit => unit.kind === kind).length * 2 - (this.botChoice?.slot === slot ? 2 : 0),
    })).filter(choice => choice.score > 0 && this.cooldowns.enemy[choice.slot] <= 0)
      .sort((a, b) => b.score - a.score || a.slot - b.slot);
    const preferred = choices[0];
    // Briefly save for useful support/tank/heavy damage; emergency defense may use cheaper troops.
    if (preferred && preferred.score >= 8 && !pressure
      && this.gold.enemy < TEMP_R1B_UNITS[TEMP_R1B_SLOTS[preferred.slot]].cost) return undefined;
    return choices.find(choice => this.canSummon('enemy', choice.slot));
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
