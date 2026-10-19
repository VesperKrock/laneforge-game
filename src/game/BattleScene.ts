import Phaser from 'phaser';
import { Battle, DEMO } from './Battle';

export class BattleScene extends Phaser.Scene {
  private readonly battle: Battle;
  private readonly onUpdate: () => void;
  private drawing!: Phaser.GameObjects.Graphics;
  private message!: Phaser.GameObjects.Text;

  constructor(battle: Battle, onUpdate: () => void) {
    super('battle');
    this.battle = battle;
    this.onUpdate = onUpdate;
  }

  create(): void {
    this.drawing = this.add.graphics();
    this.message = this.add.text(DEMO.width / 2, 90, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '22px', color: '#d9e5de', align: 'center',
    }).setOrigin(0.5);
    this.paint();
  }

  update(_time: number, delta: number): void {
    this.battle.step(delta / 1000);
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
    this.base(DEMO.playerBaseX, 0x69ceb5, this.battle.playerHp / DEMO.playerBaseHp);
    this.base(DEMO.enemyBaseX, 0xe88a72, this.battle.enemyHp / DEMO.enemyBaseHp);

    for (const unit of this.battle.units) {
      const friendly = unit.side === 'friendly';
      const color = friendly ? 0x76dec3 : 0xf09b84;
      const direction = friendly ? 1 : -1;
      const bob = Math.sin(this.battle.elapsed * 10 + unit.id) * 1.5;
      g.fillStyle(0x060e10, 0.5).fillEllipse(unit.x, 280, 30, 8);
      g.fillStyle(unit.flash > 0 ? 0xffefc6 : color);
      if (friendly) g.fillRoundedRect(unit.x - 10, 246 + bob, 20, 30, 3);
      else g.fillTriangle(unit.x, 244 + bob, unit.x - 13, 275, unit.x + 13, 275);
      g.fillStyle(0xe9f3dd).fillCircle(unit.x, 239 + bob, 7);
      g.lineStyle(unit.flash > 0 ? 4 : 2, 0xf8dfaa);
      g.lineBetween(unit.x + direction * 8, 257 + bob, unit.x + direction * (unit.flash > 0 ? 31 : 19), 233 + bob);
      g.fillStyle(0x071115).fillRect(unit.x - 15, 218, 30, 4);
      g.fillStyle(color).fillRect(unit.x - 15, 218, 30 * unit.hp / unit.maxHp, 4);
    }
    const labels = { ready: 'CHỜ LỆNH TRIỆU HỒI', running: '', won: 'THẮNG — GIỮ VỮNG CHIẾN TUYẾN', lost: 'THUA — THỬ MỘT NHỊP TRIỆU HỒI KHÁC' };
    this.message.setText(labels[this.battle.phase]);
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
