// R0B demo constants only. These are not approved game balance or R1 rules.
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
  summonCost: 25,
  summonCooldown: 2,
  attackRange: 28,
});

export type Phase = 'ready' | 'running' | 'won' | 'lost';
export type Side = 'friendly' | 'enemy';
export interface Unit {
  id: number;
  side: Side;
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
  cooldown = 0;
  playerHp: number = DEMO.playerBaseHp;
  enemyHp: number = DEMO.enemyBaseHp;
  elapsed = 0;
  hits = 0;
  units: Unit[] = [];
  event = 'Bấm Bắt đầu, sau đó triệu hồi Trường Kiếm.';
  private nextId = 0;
  private secondEnemySpawned = false;

  start(): void {
    this.phase = 'running';
    this.gold = DEMO.initialGold;
    this.cooldown = 0;
    this.playerHp = DEMO.playerBaseHp;
    this.enemyHp = DEMO.enemyBaseHp;
    this.elapsed = 0;
    this.hits = 0;
    this.units = [];
    this.nextId = 0;
    this.secondEnemySpawned = false;
    this.event = 'Địch đang tiến tới. Triệu hồi để giữ tuyến!';
    this.spawn('enemy');
  }

  get canSummon(): boolean {
    return this.phase === 'running' && this.cooldown <= 0 && this.gold >= DEMO.summonCost;
  }

  summon(): boolean {
    if (!this.canSummon) return false;
    this.gold -= DEMO.summonCost;
    this.cooldown = DEMO.summonCooldown;
    this.spawn('friendly');
    this.event = 'Đã triệu hồi Trường Kiếm — trừ 25 Vàng demo.';
    return true;
  }

  step(seconds: number): void {
    if (this.phase !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
    // A background tab never causes a large burst of movement or damage on return.
    const dt = Math.min(seconds, 0.05);
    this.elapsed += dt;
    this.gold = Math.min(DEMO.maxGold, this.gold + DEMO.goldPerSecond * dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (!this.secondEnemySpawned && this.elapsed >= 6) {
      this.spawn('enemy');
      this.secondEnemySpawned = true;
      this.event = 'Lính địch thứ hai đã xuất hiện theo kịch bản.';
    }

    for (const unit of this.units) {
      if (unit.hp <= 0) continue;
      unit.attackIn = Math.max(0, unit.attackIn - dt);
      unit.flash = Math.max(0, unit.flash - dt);
      const direction = unit.side === 'friendly' ? 1 : -1;
      const targets = this.units.filter(other => other.side !== unit.side && other.hp > 0 && (other.x - unit.x) * direction >= -DEMO.attackRange);
      const target = targets.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0];
      const targetX = target?.x ?? (unit.side === 'friendly' ? DEMO.enemyBaseX : DEMO.playerBaseX);
      const distance = Math.abs(targetX - unit.x);
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
          this.event = target ? 'Trường Kiếm đánh trúng lính địch!' : 'Trường Kiếm đánh trúng căn cứ địch!';
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

  private spawn(side: Side): void {
    const friendly = side === 'friendly';
    const hp = friendly ? 60 : 40;
    this.units.push({
      id: this.nextId++, side,
      x: friendly ? DEMO.playerBaseX + 42 : DEMO.enemyBaseX - 42,
      hp, maxHp: hp,
      damage: friendly ? 12 : 8,
      speed: friendly ? 105 : 65,
      attackInterval: friendly ? 0.65 : 0.85,
      attackIn: 0, flash: 0,
    });
  }
}
