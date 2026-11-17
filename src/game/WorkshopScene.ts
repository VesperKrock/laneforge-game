import Phaser from 'phaser';
import { hasWeaponVisual, preloadWeaponVisuals, registerVisualFrames, WeaponRig, previewAttackFrame, visualPose } from './WeaponVisual';
import type { VisualGrip } from './WeaponVisual';
import { DEFAULT_APPEARANCE } from './Appearance';
import type { AppearanceId } from './Appearance';

export class WorkshopScene extends Phaser.Scene {
  private rig?: WeaponRig;
  private fallback?: Phaser.GameObjects.Text;
  private current = { weaponId: 'axe', gripMode: 'two_hand_grip' as VisualGrip, shieldHp: 0, appearanceId: DEFAULT_APPEARANCE };
  private attackStarted: number | null = null;
  private facing: 'left' | 'right' = 'right';
  private still = false;
  constructor() { super('workshop-preview'); }
  setProfile(profile: { weaponId: string; gripMode: VisualGrip; shieldHp: number; appearanceId: AppearanceId }): void { this.current = profile; this.attackStarted = null; }
  attack(): void { if (hasWeaponVisual(this.current.weaponId)) this.attackStarted = this.time.now; }
  flip(): void { this.facing = this.facing === 'right' ? 'left' : 'right'; }
  setStill(still: boolean): void { this.still = still; }
  preload(): void { preloadWeaponVisuals(this); }
  create(): void {
    registerVisualFrames(this);
    const g = this.add.graphics();
    g.fillStyle(0x050f13, .5).fillEllipse(180, 225, 156, 22);
    g.lineStyle(1, 0xbba36d, .45).strokeEllipse(180, 223, 168, 24);
    this.rig = new WeaponRig(this, 180, 222, 2.7);
    this.fallback = this.add.text(180, 126, 'CHƯA CÓ SPRITE\nDùng hình học trong trận', {
      fontFamily: 'system-ui', fontSize: '16px', color: '#e0c58f', align: 'center', lineSpacing: 10,
    }).setOrigin(.5);
  }
  update(time: number): void {
    if (!this.rig || !this.fallback || document.hidden) return;
    const { weaponId, gripMode, shieldHp, appearanceId } = this.current;
    const mapped = hasWeaponVisual(weaponId);
    this.rig.root.setVisible(mapped); this.fallback.setVisible(!mapped);
    const canvas = this.game.canvas;
    canvas.dataset.visualId = weaponId;
    canvas.dataset.appearanceId = appearanceId;
    canvas.dataset.fallback = String(!mapped);
    if (!mapped) { canvas.dataset.visual = ''; return; }
    let frame: number | null = null;
    if (this.attackStarted !== null) { frame = previewAttackFrame(weaponId, time - this.attackStarted); if (frame === null) this.attackStarted = null; }
    const pose = visualPose(weaponId, gripMode, time, frame, this.still, appearanceId);
    const offset = pose.bodyOffset ?? [0, 0];
    this.rig.root.setPosition(180 + offset[0] * (this.facing === 'left' ? 2.7 : -2.7), 222 + offset[1]);
    this.rig.setPose(weaponId, gripMode, pose, this.facing, shieldHp, undefined, appearanceId);
    canvas.dataset.visual = JSON.stringify(this.rig.inspect());
  }
}
