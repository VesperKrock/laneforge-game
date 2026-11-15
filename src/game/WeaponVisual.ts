import Phaser from 'phaser';
import actorSource from '../assets/visuals/Actor1_1.png?url';
import swordSource from '../assets/visuals/ShortSword1.png?url';
import axeSource from '../assets/visuals/Axe1.png?url';
import spearSource from '../assets/visuals/Spear1.png?url';
import hammerSource from '../assets/visuals/elemental_hammer_1.png?url';

// Ported from the reviewed R2W0 visual registry. All coordinates are source pixels.
// No compiler, damage, attack interval, range or combat behavior belongs in this module.
type Point = readonly [number, number];
export type VisualGrip = 'one_hand' | 'two_hand_grip' | 'fixed_two_hand';
export interface VisualPose {
  actor: number; weapon: number; hand: Point; pivot: Point; angle: number;
  support?: Point; // Second grip point, in WEAPON frame coordinates, not actor coordinates.
  bodyOffset?: Point;
  scale?: number;
}
interface WeaponVisualDefinition {
  name: string; group: string; source: string; scale: number;
  thumbnail: readonly [number, number, number, number];
  idle: VisualPose; attack: readonly VisualPose[]; frameMs: readonly number[];
}
const slash = (p: Point, first: Point, angles: readonly number[]): VisualPose[] =>
  [12, 13, 14].map((actor, i) => ({ actor, weapon: i, hand: i ? [13, 50] : [21, 46], pivot: i ? p : first, angle: angles[i] }));
export const WEAPON_VISUALS: Readonly<Record<string, WeaponVisualDefinition>> = Object.freeze({
  short_sword: { name: 'Đoản kiếm', group: 'Kiếm', source: swordSource, scale: .9, thumbnail: [215, 30, 28, 29],
    idle: { actor: 0, weapon: 2, hand: [21, 46], pivot: [45, 52], angle: 0 },
    attack: slash([45, 52], [57, 27], [180, -30, -55]), frameMs: [120, 100, 150] },
  axe: { name: 'Rìu', group: 'Rìu', source: axeSource, scale: 1, thumbnail: [213, 29, 32, 30],
    idle: { actor: 0, weapon: 2, hand: [21, 46], pivot: [44, 51], angle: 0 },
    attack: slash([44, 51], [58, 29], [180, -25, -50]), frameMs: [220, 120, 200] },
  spear: { name: 'Thương', group: 'Giáo', source: spearSource, scale: 1, thumbnail: [193, 36, 68, 13],
    // Both fists grip the shaft. Native actor's forward/rear hands are separate.
    idle: { actor: 0, weapon: 2, hand: [21, 46], pivot: [35, 42], support: [49.56, 42], angle: 15.95 },
    attack: [
      { actor: 3, weapon: 0, hand: [19, 43], pivot: [65, 42], support: [77, 42], angle: 0 },
      { actor: 4, weapon: 1, hand: [8, 43], pivot: [30, 42], support: [60.27, 42], angle: 7.59 },
      // Frames 1 and 2 are identical in this PNG. Recovery is a hold, not a fabricated frame.
      { actor: 5, weapon: 2, hand: [8, 43], pivot: [30, 42], support: [60.27, 42], angle: 7.59 },
    ], frameMs: [120, 100, 160] },
  war_hammer: { name: 'Búa chiến', group: 'Búa', source: hammerSource, scale: .75, thumbnail: [198, 9, 50, 53],
    idle: { actor: 0, weapon: 2, hand: [21, 46], pivot: [46, 52], angle: 0 },
    attack: slash([46, 52], [54, 22], [180, -25, -50]), frameMs: [300, 130, 240] },
});
// Braced two-hand Axe: close grip on its short shaft, both wrists in front of the chest.
// The actor holds a braced pose; the three real weapon frames supply the stroke/arc.
const AXE_TWO_HAND_IDLE: VisualPose = { actor: 0, weapon: 2, hand: [21, 46], pivot: [40, 47], support: [47, 54], angle: -30, scale: 1.5 };
const AXE_TWO_HAND_ATTACK: readonly VisualPose[] = [
  { actor: 12, weapon: 0, hand: [21, 46], pivot: [62, 33], support: [55, 26], angle: 150, scale: 1.5, bodyOffset: [1, 0] },
  { ...AXE_TWO_HAND_IDLE, actor: 12, weapon: 1, bodyOffset: [-2, 0] },
  { ...AXE_TWO_HAND_IDLE, actor: 12, weapon: 2, bodyOffset: [-1, 0] },
];
export const hasWeaponVisual = (id: string): boolean => Object.hasOwn(WEAPON_VISUALS, id);
export function visualPose(id: string, grip: VisualGrip, time: number, attackFrame: number | null = null, still = false): VisualPose {
  const v = WEAPON_VISUALS[id];
  const axeTwoHand = id === 'axe' && grip !== 'one_hand';
  if (attackFrame !== null) return (axeTwoHand ? AXE_TWO_HAND_ATTACK : v.attack)[attackFrame];
  const step = still ? 0 : Math.floor(time / 190) % 4;
  const offset = [0, 2, 3, 2][step];
  const idle = axeTwoHand ? AXE_TWO_HAND_IDLE : v.idle;
  return { ...idle, actor: [0, 1, 2, 1][step], hand: [idle.hand[0], idle.hand[1] + offset] };
}
export function previewAttackFrame(id: string, elapsed: number): number | null {
  let end = 0;
  for (const [i, duration] of WEAPON_VISUALS[id].frameMs.entries()) { end += duration; if (elapsed < end) return i; }
  return null;
}
export function preloadWeaponVisuals(scene: Phaser.Scene): void {
  // Direct same-origin image loading avoids per-load Blob URLs and shares the browser cache.
  scene.load.imageLoadType = 'HTMLImageElement';
  if (!scene.textures.exists('lf-actor')) scene.load.image('lf-actor', actorSource);
  for (const [id, v] of Object.entries(WEAPON_VISUALS)) if (!scene.textures.exists(`lf-${id}`)) scene.load.image(`lf-${id}`, v.source);
}
export function registerVisualFrames(scene: Phaser.Scene): void {
  const actor = scene.textures.get('lf-actor');
  if (!actor.has('a0')) {
    for (let i = 0; i < 54; i++) actor.add(`a${i}`, 0, (i % 9) * 64, Math.floor(i / 9) * 64, 64, 64);
    // Glove cutout from the actual thrust pose. Foreground patches close the grip over the shaft.
    actor.add('grip', 0, 256 + 3, 38, 10, 11);
  }
  for (const id of Object.keys(WEAPON_VISUALS)) {
    const texture = scene.textures.get(`lf-${id}`);
    for (let i = 0; i < 3; i++) if (!texture.has(`w${i}`)) texture.add(`w${i}`, 0, i * 96, 0, 96, 64);
  }
}
export class WeaponRig {
  readonly root: Phaser.GameObjects.Container;
  private readonly actor: Phaser.GameObjects.Image;
  private readonly weapon: Phaser.GameObjects.Image;
  private readonly mainHand: Phaser.GameObjects.Image;
  private readonly supportHand: Phaser.GameObjects.Image;
  private readonly shield: Phaser.GameObjects.Graphics;
  private readonly team: Phaser.GameObjects.Graphics;
  private pose?: VisualPose;
  private weaponId = '';
  private grip: VisualGrip = 'one_hand';
  private facing = 'right';
  constructor(scene: Phaser.Scene, x: number, y: number, private readonly size = 1) {
    this.root = scene.add.container(x, y);
    this.team = scene.add.graphics();
    this.actor = scene.add.image(-32, -64, 'lf-actor', 'a0').setOrigin(0);
    this.weapon = scene.add.image(0, 0, 'lf-axe', 'w2');
    this.mainHand = scene.add.image(0, 0, 'lf-actor', 'grip').setScale(.72).setVisible(false);
    this.supportHand = scene.add.image(0, 0, 'lf-actor', 'grip').setScale(.72).setVisible(false);
    this.shield = scene.add.graphics();
    this.shield.fillStyle(0x233a4d).fillRoundedRect(4, -26, 16, 23, 3);
    this.shield.lineStyle(1.5, 0xa3d5ef).strokeRoundedRect(4, -26, 16, 23, 3);
    this.shield.lineStyle(2, 0xe0c78f).lineBetween(12, -22, 12, -8);
    this.root.add([this.team, this.weapon, this.actor, this.mainHand, this.supportHand, this.shield]);
  }
  setPose(id: string, grip: VisualGrip, pose: VisualPose, facing: 'left' | 'right', shieldHp = 0, side?: 'friendly' | 'enemy'): void {
    const v = WEAPON_VISUALS[id];
    const scale = pose.scale ?? v.scale;
    this.weaponId = id; this.pose = pose; this.grip = grip; this.facing = facing;
    this.root.setScale(facing === 'left' ? this.size : -this.size, this.size);
    this.actor.setFrame(`a${pose.actor}`);
    const x = pose.hand[0] - 32, y = pose.hand[1] - 64;
    this.weapon.setTexture(`lf-${id}`, `w${pose.weapon}`).setOrigin(pose.pivot[0] / 96, pose.pivot[1] / 64)
      .setPosition(x, y).setScale(scale).setAngle(pose.angle);
    const twoHand = Boolean(pose.support);
    // For two hands the shaft crosses IN FRONT of the coat, with both real glove crops over it.
    this.root.moveTo(this.weapon, twoHand ? 2 : 1);
    this.mainHand.setPosition(x, y).setVisible(twoHand);
    if (pose.support) {
      const angle = pose.angle * Math.PI / 180, dx = (pose.support[0] - pose.pivot[0]) * scale, dy = (pose.support[1] - pose.pivot[1]) * scale;
      this.supportHand.setPosition(x + dx * Math.cos(angle) - dy * Math.sin(angle), y + dx * Math.sin(angle) + dy * Math.cos(angle));
    }
    this.supportHand.setVisible(twoHand);
    this.shield.setVisible(shieldHp > 0 && grip === 'one_hand' && !twoHand);
    this.team.clear();
    if (side) this.team.lineStyle(2, side === 'friendly' ? 0x76dec3 : 0xf09b84).strokeEllipse(0, 2, 40, 10);
  }
  inspect() {
    const p = this.pose!;
    const v = WEAPON_VISUALS[this.weaponId];
    const scale = p.scale ?? v.scale;
    let supportError = 0;
    if (p.support) {
      const angle = this.weapon.rotation, dx = (p.support[0] - p.pivot[0]) * scale, dy = (p.support[1] - p.pivot[1]) * scale;
      supportError = Math.hypot(this.supportHand.x - (this.weapon.x + dx * Math.cos(angle) - dy * Math.sin(angle)), this.supportHand.y - (this.weapon.y + dx * Math.sin(angle) + dy * Math.cos(angle)));
    }
    return { weaponId: this.weaponId, grip: this.grip, facing: this.facing, actorFrame: p.actor, weaponFrame: p.weapon,
      hands: p.support ? 2 : 1, shield: this.shield.visible,
      anchorError: Math.hypot(this.weapon.x - (p.hand[0] - 32), this.weapon.y - (p.hand[1] - 64)), supportError };
  }
  destroy(): void { this.root.destroy(true); }
}
