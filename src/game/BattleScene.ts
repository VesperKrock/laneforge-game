import Phaser from 'phaser';
import { Battle, DEMO, TEMP_R1D_UNITS } from './Battle';
import { hasWeaponVisual, preloadWeaponVisuals, registerVisualFrames, WeaponRig, visualPose } from './WeaponVisual';

const DRAW_Y = { sword: 0, axe: -6, shield: 6, gladiator: -12, spear: -18, hammer: 12 } as const;

export class BattleScene extends Phaser.Scene {
  private readonly battle: Battle;
  private readonly onUpdate: () => void;
  private drawing!: Phaser.GameObjects.Graphics;
  private message!: Phaser.GameObjects.Text;
  private readonly unitLabels = new Map<number, Phaser.GameObjects.Text>();
  private readonly visualRigs = new Map<number, WeaponRig>();
  private readonly labelRows = new Map<number, number>();
  private viewport = { left: 0, top: 0, zoom: 1 };
  private view: 'follow' | 'friendly' | 'enemy' | 'overview' = 'follow';

  constructor(battle: Battle, onUpdate: () => void) {
    super('battle');
    this.battle = battle;
    this.onUpdate = onUpdate;
  }

  preload(): void { preloadWeaponVisuals(this); }

  setView(view: 'follow' | 'friendly' | 'enemy' | 'overview'): void { this.view = view; }

  create(): void {
    registerVisualFrames(this);
    this.drawing = this.add.graphics();
    this.message = this.add.text(DEMO.width / 2, 90, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '22px', color: '#d9e5de', align: 'center',
    }).setOrigin(0.5);
    this.paint();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const rig of this.visualRigs.values()) rig.destroy();
      this.visualRigs.clear(); this.unitLabels.clear(); this.labelRows.clear();
    });
  }

  update(_time: number, delta: number): void {
    if (!document.hidden) this.battle.step(delta / 1000);
    this.positionCamera();
    this.paint();
    this.onUpdate();
  }

  private paint(): void {
    const g = this.drawing;
    g.clear();
    g.fillStyle(0x0c191e).fillRect(0, 0, DEMO.width, DEMO.height);
    g.fillStyle(0x13262a).fillTriangle(120, 245, 370, 75, 620, 245);
    g.fillStyle(0x102126).fillTriangle(420, 245, 685, 110, 950, 245);
    g.fillStyle(0x162a2a).fillRect(0, 278, DEMO.width, 122);
    g.lineStyle(1, 0x27403b);
    for (let x = 0; x < DEMO.width; x += 40) g.lineBetween(x, 278, x - 80, 400);
    for (let y = 300; y < DEMO.height; y += 28) g.lineBetween(0, y, DEMO.width, y);
    g.fillStyle(0x334f47).fillRect(135, 278, 690, 5);
    g.lineStyle(2, 0x87977c, 0.28).lineBetween(480, 224, 480, 300);
    this.base(DEMO.playerBaseX, 0x69ceb5, this.battle.playerHp / DEMO.baseHp);
    this.base(DEMO.enemyBaseX, 0xe88a72, this.battle.enemyHp / DEMO.baseHp);

    const livingIds = new Set(this.battle.units.map(unit => unit.id));
    const visualIds = new Set(this.battle.units.filter(unit => unit.profile && hasWeaponVisual(unit.profile.weaponId)).map(unit => unit.id));
    for (const [id, rig] of this.visualRigs) {
      if (!visualIds.has(id)) { rig.destroy(); this.visualRigs.delete(id); }
    }
    for (const [id, label] of this.unitLabels) {
      if (!livingIds.has(id)) { label.destroy(); this.unitLabels.delete(id); this.labelRows.delete(id); }
    }
    for (const unit of this.battle.units) {
      const friendly = unit.side === 'friendly';
      const color = friendly ? 0x76dec3 : 0xf09b84;
      const direction = friendly ? 1 : -1;
      // Visual offset only: combat still uses the shared lane coordinate.
      const offset = DRAW_Y[unit.kind];
      const bob = Math.sin(this.battle.elapsed * 10 + unit.id) * 1.5 + offset;
      const mapped = unit.profile && hasWeaponVisual(unit.profile.weaponId);
      g.fillStyle(0x060e10, 0.5).fillEllipse(unit.x, 280, 30, 8);
      if (mapped && unit.profile) {
        let rig = this.visualRigs.get(unit.id);
        if (!rig) { rig = new WeaponRig(this, unit.x, 280 + offset, .65); this.visualRigs.set(unit.id, rig); }
        let frame: number | null = null;
        // Presentation observes the existing hit/windup clock; never schedules hits.
        if (unit.engaged) {
          if (unit.flash > 0) frame = 2;
          else if (unit.attackIn <= Math.max(.12, unit.profile.windup)) frame = unit.attackIn < .10 ? 1 : 0;
        }
        const pose = visualPose(unit.profile.weaponId, unit.profile.gripMode, this.battle.elapsed * 1000, frame, false, unit.profile.appearanceId);
        rig.root.setPosition(unit.x, 280 + offset);
        rig.setPose(unit.profile.weaponId, unit.profile.gripMode, pose, friendly ? 'right' : 'left', unit.shieldHp ?? 0, unit.side, unit.profile.appearanceId);
      } else {
      g.lineStyle(2, color).strokeEllipse(unit.x, 282 + offset, 30, 8);
      g.fillStyle(unit.flash > 0 ? 0xffefc6 : color);
      switch (unit.kind) {
        case 'sword': g.fillRoundedRect(unit.x - 10, 246 + bob, 20, 30, 3); break;
        case 'axe': g.fillPoints([{ x: unit.x, y: 241 + bob }, { x: unit.x + 11, y: 258 + offset }, { x: unit.x, y: 277 + offset }, { x: unit.x - 11, y: 258 + offset }], true); break;
        case 'shield': g.fillCircle(unit.x, 259 + bob, 12); break;
        case 'gladiator': g.fillTriangle(unit.x, 244 + bob, unit.x - 10, 275 + offset, unit.x + 10, 275 + offset); break;
        case 'spear': g.fillRoundedRect(unit.x - 7, 246 + bob, 14, 30, 2); break;
        case 'hammer': g.fillRoundedRect(unit.x - 11, 246 + bob, 22, 30, 2); break;
      }
      g.fillStyle(0xe9f3dd).fillCircle(unit.x, 239 + bob, 7);
      g.lineStyle(unit.flash > 0 ? 4 : 2, 0xf8dfaa);
      if (unit.profile) {
        // Five family placeholders share the same combat model; no source passive is implied.
        const family = unit.profile.family;
        const reach = unit.flash > 0 ? unit.attackRange : Math.min(unit.attackRange, 24);
        const tipX = unit.x + direction * reach;
        const thrust = family === 'polearm' || family === 'one_hand_pierce';
        g.lineStyle(family === 'two_hand_heavy' ? 5 : 2, 0xf8dfaa);
        g.lineBetween(unit.x + direction * 7, 257 + bob, tipX, (thrust ? 253 : 231) + bob);
        if (family === 'one_hand_blunt') g.fillStyle(0xd6c9a8).fillRect(tipX - 7, 227 + bob, 14, 10);
        if (family === 'polearm') g.fillStyle(0xf8dfaa).fillTriangle(tipX, 253 + bob, tipX - direction * 8, 249 + bob, tipX - direction * 8, 257 + bob);
        if ((unit.shieldHp ?? 0) > 0) g.fillStyle(0x94cbee).fillRoundedRect(unit.x - direction * 13 - 5, 248 + bob, 10, 23, 3);
      } else if (unit.kind === 'spear') {
        const tipX = unit.x + direction * (unit.attackRange - 6);
        g.lineBetween(unit.x + direction * 7, 257 + bob, tipX, 245 + bob);
        g.fillStyle(0xf8dfaa).fillTriangle(tipX, 245 + bob, tipX - direction * 8, 241 + bob, tipX - direction * 8, 249 + bob);
      } else g.lineBetween(unit.x + direction * 8, 257 + bob, unit.x + direction * (unit.flash > 0 ? 31 : 19), 233 + bob);
      if (unit.kind === 'axe') g.fillStyle(color).fillRect(unit.x + direction * 19 - 6, 232 + bob, 12, 9);
      if (unit.kind === 'hammer') {
        g.fillStyle(0xd6c9a8).fillRect(unit.x + direction * 19 - 9, 228 + bob, 18, 12);
        if (unit.flash > 0) g.lineStyle(2, color, 0.6).strokeCircle(unit.x + direction * unit.attackRange, 261 + offset, 14);
      }
      if (unit.kind === 'shield') g.fillStyle(0xc1cbb2).fillRoundedRect(unit.x + direction * 13 - 5, 248 + bob, 10, 23, 3);
      if (unit.kind === 'gladiator') g.lineBetween(unit.x - direction * 8, 257 + bob, unit.x - direction * 19, 237 + bob);
      }
      let label = this.unitLabels.get(unit.id);
      if (!label) {
        label = this.add.text(0, 0, '', { fontFamily: 'system-ui, sans-serif', fontSize: '11px', fontStyle: 'bold', color: friendly ? '#9eefd6' : '#ffc0a9', backgroundColor: '#071115', padding: { left: 3, right: 3, top: 2, bottom: 2 } }).setOrigin(0.5, 0).setDepth(2);
        this.unitLabels.set(unit.id, label);
      }
      label.setVisible(false);
    }
    this.paintLabels();
    const labels = { ready: 'CHỜ LỆNH TRIỆU HỒI', running: '', won: 'THẮNG — GIỮ VỮNG CHIẾN TUYẾN', lost: 'THUA — THỬ MỘT NHỊP TRIỆU HỒI KHÁC' };
    this.message.setText(labels[this.battle.phase]);
    this.game.canvas.dataset.rigs = JSON.stringify([...this.visualRigs].map(([id, rig]) => ({ id, ...rig.inspect() })));
    this.game.canvas.dataset.rigCount = String(this.visualRigs.size);
    this.game.canvas.dataset.unitCount = String(this.battle.units.length);
    this.game.canvas.dataset.textureCount = String(this.textures.getTextureKeys().length);
    this.game.canvas.dataset.displayObjects = String(this.children.length);
  }

  private paintLabels(): void {
    // HUD grouping only. A group reports SUM(body HP) and SUM(barrier HP), never a new combat unit.
    // Group within a bounded screen span; preserve the row of surviving leaders to avoid shuffling.
    const { left, top, zoom } = this.viewport, width = this.scale.width;
    const groups: (typeof this.battle.units)[] = [];
    for (const side of ['friendly', 'enemy'] as const) {
      const units = this.battle.units.filter(u => u.side === side && (u.x - left) * zoom >= -12 && (u.x - left) * zoom <= width + 12)
        .sort((a, b) => a.x - b.x || a.id - b.id);
      let group: typeof units = [];
      for (const unit of units) {
        if (group.length && (unit.x - group[0].x) * zoom > 64) { groups.push(group); group = []; }
        group.push(unit);
      }
      if (group.length) groups.push(group);
    }
    const occupied: { row: number; min: number; max: number }[] = [], readings = [];
    groups.sort((a, b) => Math.min(...a.map(u => u.id)) - Math.min(...b.map(u => u.id)));
    for (const group of groups) {
      const id = Math.min(...group.map(u => u.id)), leader = group.find(u => u.id === id)!, label = this.unitLabels.get(id)!;
      const friendly = leader.side === 'friendly', color = friendly ? 0x76dec3 : 0xf09b84;
      const marks = new Set(group.map(u => u.profile?.mark ?? TEMP_R1D_UNITS[u.kind].mark));
      const fallback = group.some(u => !u.profile || !hasWeaponVisual(u.profile.weaponId));
      const text = `${friendly ? 'TA' : 'BOT'}${marks.size === 1 ? '·' + [...marks][0] : ''}${group.length > 1 ? ' ×' + group.length : ''}${fallback ? ' ◇' : ''}`;
      label.setText(text).setScale(1 / zoom).setColor(friendly ? '#9eefd6' : '#ffc0a9');
      const half = label.width / 2, worldX = group.reduce((sum, u) => sum + u.x, 0) / group.length;
      const x = Phaser.Math.Clamp((worldX - left) * zoom, half + 4, width - half - 4);
      const free = (row: number) => !occupied.some(r => r.row === row && x + half + 5 > r.min && x - half - 5 < r.max);
      let row = this.labelRows.get(id) ?? (friendly ? 0 : 1);
      if (!free(row)) { row = 0; while (!free(row)) row++; }
      this.labelRows.set(id, row); occupied.push({ row, min: x - half, max: x + half });
      const y = Phaser.Math.Clamp(this.scale.height - 280, 16, 100) + row * 31, lx = left + x / zoom, ly = top + y / zoom;
      label.setPosition(lx, ly).setVisible(true);
      const hp = group.reduce((sum, u) => sum + u.hp, 0), maxHp = group.reduce((sum, u) => sum + u.maxHp, 0);
      const shieldHp = group.reduce((sum, u) => sum + (u.shieldHp ?? 0), 0), maxShield = group.reduce((sum, u) => sum + (u.profile?.shieldHp ?? 0), 0);
      const barWidth = label.width, barY = ly + (label.height + 2) / zoom, g = this.drawing;
      g.lineStyle(1 / zoom, color, .25).lineBetween(lx, barY + 7 / zoom, worldX, 222 + DRAW_Y[leader.kind]);
      g.fillStyle(0x071115).fillRect(lx - half / zoom, barY, barWidth / zoom, 4 / zoom);
      g.fillStyle(color).fillRect(lx - half / zoom, barY, barWidth / zoom * hp / maxHp, 4 / zoom);
      if (maxShield > 0) {
        g.fillStyle(0x071115).fillRect(lx - half / zoom, barY + 5 / zoom, barWidth / zoom, 3 / zoom);
        g.fillStyle(0x94cbee).fillRect(lx - half / zoom, barY + 5 / zoom, barWidth / zoom * shieldHp / maxShield, 3 / zoom);
      }
      readings.push({ id, side: leader.side, members: group.map(u => u.id), text, row, x: x - half, y, width: barWidth, height: label.height + 10, hp, maxHp, shieldHp, maxShield });
    }
    this.game.canvas.dataset.labels = JSON.stringify(readings);
  }

  private positionCamera(): void {
    const camera = this.cameras.main;
    const mobile = this.scale.width < 700;
    const zoom = this.view === 'overview' ? Math.min(this.scale.width / DEMO.width, this.scale.height / DEMO.height) : mobile ? 1.5 : 1.15;
    camera.setZoom(zoom);
    let x: number = DEMO.width / 2;
    if (this.view === 'friendly') x = DEMO.playerBaseX + 65;
    else if (this.view === 'enemy') x = DEMO.enemyBaseX - 65;
    else if (this.view === 'follow') {
      const allies = this.battle.units.filter(unit => unit.side === 'friendly');
      const enemies = this.battle.units.filter(unit => unit.side === 'enemy');
      const front = allies.length ? Math.max(...allies.map(unit => unit.x)) : undefined;
      const threat = enemies.length ? Math.min(...enemies.map(unit => unit.x)) : undefined;
      if (front !== undefined && threat !== undefined && threat - front < 210) x = (front + threat) / 2;
      else x = front ?? threat ?? x;
    }
    const half = this.scale.width / zoom / 2;
    if (half < DEMO.width / 2) x = Phaser.Math.Clamp(x, half, DEMO.width - half);
    const y = this.view === 'overview' ? DEMO.height / 2 : 230;
    camera.centerOn(x, y);
    this.viewport = { left: x - this.scale.width / zoom / 2, top: y - this.scale.height / zoom / 2, zoom };
    this.game.canvas.dataset.cameraView = this.view;
    this.game.canvas.dataset.cameraZoom = String(zoom);
  }

  private base(x: number, color: number, health: number): void {
    const g = this.drawing;
    g.fillStyle(0x071115, 0.5).fillEllipse(x, 283, 125, 18);
    g.fillStyle(0x294039).fillRect(x - 42, 206, 84, 72);
    g.fillStyle(color).fillRect(x - 46, 200, 92, 9);
    for (const offset of [-42, -14, 14]) g.fillRect(x + offset, 185, 16, 22);
    g.fillStyle(0x0b171b).fillRoundedRect(x - 12, 242, 24, 36, 10);
    g.lineStyle(2, color).lineBetween(x, 145, x, 190);
    g.fillStyle(color).fillTriangle(x, 145, x + 32, 153, x, 164);
    g.fillStyle(0x071115).fillRect(x - 44, 297, 88, 6);
    g.fillStyle(color).fillRect(x - 44, 297, 88 * health, 6);
  }
}
