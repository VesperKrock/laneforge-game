import Phaser from 'phaser';
import { CHARACTER_VISUALS } from './CharacterVisual';
import { DEFAULT_APPEARANCE } from './Appearance';
import type { AppearanceId } from './Appearance';
import swordSource from '../assets/visuals/ShortSword1.png?url';
import axeSource from '../assets/visuals/Axe1.png?url';
import spearSource from '../assets/visuals/Spear1.png?url';
import hammerSource from '../assets/visuals/elemental_hammer_1.png?url';
import estocSource from '../assets/visuals/Blades1.png?url';
import jiSource from '../assets/visuals/Spear2.png?url';
import stilettoSource from '../assets/visuals/Blades7.png?url';
import clubSource from '../assets/visuals/elemental_mace_1.png?url';
import maceSource from '../assets/visuals/Scepter10.png?url';
import armingSource from '../assets/visuals/ShortSword4.png?url';
import sabreSource from '../assets/visuals/ExSword2.png?url';
import katanaSource from '../assets/visuals/Katana4.png?url';
import battleAxeSource from '../assets/visuals/Axe4.png?url';
import longswordSource from '../assets/visuals/Greatsword10.png?url';
import greatswordSource from '../assets/visuals/Greatsword3.png?url';
import pikeSource from '../assets/visuals/Lance6.png?url';
import tridentSource from '../assets/visuals/Spear9.png?url';
import morningStarSource from '../assets/visuals/elemental_mace_10.png?url';
import twoHandMaceSource from '../assets/visuals/elemental_mace_5.png?url';
import scimitarSource from '../assets/visuals/ExSword4.png?url';
import falchionSource from '../assets/visuals/ExSword6.png?url';
import nodachiSource from '../assets/visuals/Katana6.png?url';

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
type Rectangle = readonly [number, number, number, number];
type ActorMotion = 'swing' | 'thrust' | 'brace';
interface WeaponVisualInput {
  name: string; group: string; source: string; scale: number;
  thumbnail: Rectangle;
  idle: VisualPose; attack: readonly VisualPose[]; frameMs: readonly number[];
  motion?: ActorMotion; uniqueFrames?: number;
  twoHand?: { idle: VisualPose; attack: readonly VisualPose[] };
}
interface WeaponVisualDefinition extends WeaponVisualInput {
  frames: readonly Rectangle[]; nativeFacing: 'left';
  layers: Readonly<{ oneHand: number; twoHand: number }>;
  preserveReviewedDefault: boolean;
}
const slash = (p: Point, first: Point, angles: readonly number[]): VisualPose[] =>
  [12, 13, 14].map((actor, i) => ({ actor, weapon: i, hand: i ? [13, 50] : [21, 46], pivot: i ? p : first, angle: angles[i] }));
const REVIEWED_VISUALS: Record<string, WeaponVisualInput> = {
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
    ], frameMs: [120, 100, 160], motion: 'thrust', uniqueFrames: 2 },
  war_hammer: { name: 'Búa chiến', group: 'Búa', source: hammerSource, scale: .75, thumbnail: [198, 9, 50, 53],
    idle: { actor: 0, weapon: 2, hand: [21, 46], pivot: [46, 52], angle: 0 },
    attack: slash([46, 52], [54, 22], [180, -25, -50]), frameMs: [300, 130, 240] },
};
// Braced two-hand Axe: close grip on its short shaft, both wrists in front of the chest.
// The actor holds a braced pose; the three real weapon frames supply the stroke/arc.
const AXE_TWO_HAND_IDLE: VisualPose = { actor: 0, weapon: 2, hand: [21, 46], pivot: [40, 47], support: [47, 54], angle: -30, scale: 1.5 };
const AXE_TWO_HAND_ATTACK: readonly VisualPose[] = [
  { actor: 12, weapon: 0, hand: [21, 46], pivot: [62, 33], support: [55, 26], angle: 150, scale: 1.5, bodyOffset: [1, 0] },
  { ...AXE_TWO_HAND_IDLE, actor: 12, weapon: 1, bodyOffset: [-2, 0] },
  { ...AXE_TWO_HAND_IDLE, actor: 12, weapon: 2, bodyOffset: [-1, 0] },
];
REVIEWED_VISUALS.axe.twoHand = { idle: AXE_TWO_HAND_IDLE, attack: AXE_TWO_HAND_ATTACK };

// Audited source rectangles: all 22 selected files are 288x64, three 96x64 cells.
// Frame identity is separate from actor pose/timing. Hold frames remain holds.
const FRAMES: readonly Rectangle[] = [[0, 0, 96, 64], [96, 0, 96, 64], [192, 0, 96, 64]];
function slashing(name: string, group: string, source: string, pivot: Point, first: Point, scale: number, thumbnail: Rectangle, twoHand = false): WeaponVisualInput {
  const result: WeaponVisualInput = { name, group, source, scale, thumbnail,
    idle: { actor: 0, weapon: 2, hand: [21,46], pivot, angle: 0 },
    attack: slash(pivot, first, [180,-25,-50]), frameMs: [180,110,170], motion: 'swing', uniqueFrames: 3 };
  if (twoHand) {
    // Two measured points along this weapon's hilt/shaft; actor wrists set the transform.
    const idle: VisualPose = { actor: 0, weapon: 2, hand: [21,46], pivot: [pivot[0]-4,pivot[1]-4], support: [pivot[0]+3,pivot[1]+3], angle: 0 };
    result.twoHand = { idle, attack: [
      { actor: 12, weapon: 0, hand: [21,46], pivot: [first[0]+4,first[1]+4], support: [first[0]-3,first[1]-3], angle: 180, bodyOffset: [1,0] },
      { ...idle, actor: 12, weapon: 1, bodyOffset: [-2,0] },
      { ...idle, actor: 12, weapon: 2, bodyOffset: [-1,0] },
    ] };
  }
  return result;
}
function thrusting(name: string, source: string, pivot: Point, first: Point, scale: number, thumbnail: Rectangle, polearm = false, uniqueFrames = 2): WeaponVisualInput {
  const idle: VisualPose = { actor: 0, weapon: 2, hand: [21,46], pivot, angle: 0,
    ...(polearm ? {support: [pivot[0]+14.56,pivot[1]] as Point} : {}) };
  return { name, group: polearm ? 'Giáo' : 'Kiếm đâm', source, scale, thumbnail, idle, motion: 'thrust', uniqueFrames,
    attack: [0,1,2].map(i=>({ actor: 3+i, weapon:i, hand:i?[8,43]:[19,43], pivot:i?pivot:first, angle:0,
      ...(polearm ? { support: [i ? pivot[0]+30.27 : first[0]+12, pivot[1]] as Point } : {}),
    })), frameMs:[130,110,160] };
}
const R2W3_VISUALS: Record<string, WeaponVisualInput> = {
  estoc: thrusting('Liễu kiếm',estocSource,[40,42],[62,42],1.15,[199,32,37,19]),
  stiletto: thrusting('Dao đục',stilettoSource,[38,42],[60,42],.95,[207,40,34,6]),
  ji: thrusting('Kích',jiSource,[35,42],[65,42],1,[193,35,67,25],true,3),
  pike: thrusting('Trường thương',pikeSource,[35,42],[65,42],1,[192,38,68,14],true),
  trident: thrusting('Đinh ba',tridentSource,[35,42],[65,42],1,[193,35,67,15],true),
  club: slashing('Chùy gỗ','Chùy',clubSource,[47,51],[61,26],.9,[208,23,35,35]),
  mace: slashing('Chùy chiến','Chùy',maceSource,[45,51],[57,27],1,[215,30,28,28]),
  morning_star: slashing('Chùy sao','Chùy',morningStarSource,[45,52],[61,25],.85,[202,17,41,41]),
  arming_sword: slashing('Kiếm một tay','Kiếm',armingSource,[44,51],[57,27],1,[213,28,29,29],true),
  sabre: slashing('Kiếm cong','Kiếm',sabreSource,[44,51],[61,25],1,[221,22,21,35]),
  scimitar: slashing('Loan đao','Kiếm',scimitarSource,[45,52],[60,24],1,[221,22,22,36]),
  falchion: slashing('Đao bản rộng','Kiếm',falchionSource,[46,53],[59,23],1,[219,19,25,40],true),
  katana_taichi: slashing('Katana / Taichi','Kiếm',katanaSource,[41,48],[66,27],1.1,[215,29,24,25],true),
  battle_axe: slashing('Rìu chiến','Rìu',battleAxeSource,[48,53],[54,24],1,[206,28,42,33],true),
  longsword: slashing('Trường kiếm','Kiếm hai tay',longswordSource,[45,52],[56,26],1,[206,21,37,37],true),
  greatsword: slashing('Đại kiếm','Kiếm hai tay',greatswordSource,[45,52],[56,26],1,[206,21,37,37],true),
  two_hand_mace: slashing('Chùy hai tay','Chùy',twoHandMaceSource,[45,52],[61,25],1,[213,24,30,34],true),
  nodachi: slashing('Trường đao','Kiếm hai tay',nodachiSource,[43,50],[64,25],1,[206,20,36,37],true),
};
// Deep-freeze visual data so lab/debug consumers cannot mutate the live registry.
function freezeVisual<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeVisual(child);
    Object.freeze(value);
  }
  return value;
}
export const WEAPON_VISUALS: Readonly<Record<string, WeaponVisualDefinition>> = freezeVisual(Object.fromEntries(
  Object.entries({...REVIEWED_VISUALS,...R2W3_VISUALS}).map(([id,v])=>[id, {
    motion:'swing', uniqueFrames:3, ...v, frames:FRAMES, nativeFacing:'left', layers:{oneHand:1,twoHand:2},
    preserveReviewedDefault:Object.hasOwn(REVIEWED_VISUALS,id),
  }]),
));
export const hasWeaponVisual = (id: string): boolean => Object.hasOwn(WEAPON_VISUALS, id);
export function visualPose(id: string, grip: VisualGrip, time: number, attackFrame: number | null = null, still = false, appearanceId: AppearanceId = DEFAULT_APPEARANCE): VisualPose {
  const v = WEAPON_VISUALS[id];
  const character = CHARACTER_VISUALS[appearanceId];
  const twoHand = grip !== 'one_hand' ? v.twoHand : undefined;
  const step = still ? 0 : Math.floor(time / 190) % 4;
  const idle = twoHand?.idle ?? v.idle;
  const base = attackFrame === null ? { ...idle, actor: character.idle[step], hand: character.anchors[character.idle[step]].main }
    : { ...(twoHand?.attack ?? v.attack)[attackFrame], actor: character[twoHand ? 'brace' : v.motion ?? 'swing'][attackFrame] };
  if (appearanceId === DEFAULT_APPEARANCE && v.preserveReviewedDefault) return base;
  const anchor = character.anchors[base.actor];
  const pose: VisualPose = { ...base, hand: anchor.main };
  if (pose.support) {
    const ax = anchor.support[0] - anchor.main[0], ay = anchor.support[1] - anchor.main[1];
    const wx = pose.support[0] - pose.pivot[0], wy = pose.support[1] - pose.pivot[1];
    pose.angle = (Math.atan2(ay, ax) - Math.atan2(wy, wx)) * 180 / Math.PI;
    pose.scale = Math.hypot(ax, ay) / Math.hypot(wx, wy);
  }
  return pose;
}
export function previewAttackFrame(id: string, elapsed: number): number | null {
  let end = 0;
  for (const [i, duration] of WEAPON_VISUALS[id].frameMs.entries()) { end += duration; if (elapsed < end) return i; }
  return null;
}
export function preloadWeaponVisuals(scene: Phaser.Scene): void {
  // Direct same-origin image loading avoids per-load Blob URLs and shares the browser cache.
  scene.load.imageLoadType = 'HTMLImageElement';
  for (const c of Object.values(CHARACTER_VISUALS)) if (!scene.textures.exists(c.texture)) scene.load.image(c.texture, c.source);
  for (const [id, v] of Object.entries(WEAPON_VISUALS)) if (!scene.textures.exists(`lf-${id}`)) scene.load.image(`lf-${id}`, v.source);
}
export function registerVisualFrames(scene: Phaser.Scene): void {
  for (const c of Object.values(CHARACTER_VISUALS)) {
    const actor = scene.textures.get(c.texture);
    if (!actor.has('a0')) {
      const [w, h] = c.frame, [cols, rows] = c.layout;
      for (let i = 0; i < cols * rows; i++) actor.add(`a${i}`, 0, (i % cols) * w, Math.floor(i / cols) * h, w, h);
      actor.add('grip', 0, ...c.gripRectangle);
    }
  }
  for (const id of Object.keys(WEAPON_VISUALS)) {
    const texture = scene.textures.get(`lf-${id}`);
    for (const [i,rect] of WEAPON_VISUALS[id].frames.entries()) if (!texture.has(`w${i}`)) texture.add(`w${i}`, 0, ...rect);
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
  private appearanceId: AppearanceId = DEFAULT_APPEARANCE;
  constructor(scene: Phaser.Scene, x: number, y: number, private readonly size = 1) {
    this.root = scene.add.container(x, y);
    this.team = scene.add.graphics();
    this.actor = scene.add.image(-32, -64, 'lf-actor', 'a0').setOrigin(0);
    this.weapon = scene.add.image(0, 0, 'lf-axe', 'w2');
    this.mainHand = scene.add.image(0, 0, 'lf-actor', 'grip').setScale(.72).setVisible(false);
    this.supportHand = scene.add.image(0, 0, 'lf-actor', 'grip').setScale(.72).setVisible(false);
    this.shield = scene.add.graphics();
    const shieldOutline = [{ x: -8, y: -10 }, { x: 8, y: -10 }, { x: 7, y: 3 }, { x: 0, y: 11 }, { x: -7, y: 3 }];
    this.shield.fillStyle(0x233a4d).fillPoints(shieldOutline, true);
    this.shield.fillStyle(0x426681).fillTriangle(0, -9, 7, -9, 0, 9);
    this.shield.lineStyle(1.5, 0xa3d5ef).strokePoints(shieldOutline, true);
    this.shield.fillStyle(0xe0c78f).fillCircle(0, 0, 2.5);
    this.root.add([this.team, this.weapon, this.actor, this.mainHand, this.supportHand, this.shield]);
  }
  setPose(id: string, grip: VisualGrip, pose: VisualPose, facing: 'left' | 'right', shieldHp = 0, side?: 'friendly' | 'enemy', appearanceId: AppearanceId = DEFAULT_APPEARANCE): void {
    const v = WEAPON_VISUALS[id];
    const c = CHARACTER_VISUALS[appearanceId];
    this.appearanceId = appearanceId;
    const scale = pose.scale ?? v.scale;
    this.weaponId = id; this.pose = pose; this.grip = grip; this.facing = facing;
    this.root.setScale(facing === c.nativeFacing ? this.size : -this.size, this.size);
    this.actor.setTexture(c.texture, `a${pose.actor}`).setPosition(-c.origin[0] + c.offset[0], -c.origin[1] + c.offset[1]).setScale(c.scale);
    this.mainHand.setTexture(c.texture, 'grip').setScale(c.gripScale);
    this.supportHand.setTexture(c.texture, 'grip').setScale(c.gripScale);
    const x = pose.hand[0] - c.origin[0], y = pose.hand[1] - c.origin[1];
    const frame = v.frames[pose.weapon];
    this.weapon.setTexture(`lf-${id}`, `w${pose.weapon}`).setOrigin(pose.pivot[0] / frame[2], pose.pivot[1] / frame[3])
      .setPosition(x, y).setScale(scale).setAngle(pose.angle);
    const twoHand = Boolean(pose.support);
    // For two hands the shaft crosses IN FRONT of the coat, with both real glove crops over it.
    this.root.moveTo(this.weapon, twoHand ? v.layers.twoHand : v.layers.oneHand);
    this.mainHand.setPosition(x, y).setVisible(twoHand);
    if (pose.support) {
      const angle = pose.angle * Math.PI / 180, dx = (pose.support[0] - pose.pivot[0]) * scale, dy = (pose.support[1] - pose.pivot[1]) * scale;
      this.supportHand.setPosition(x + dx * Math.cos(angle) - dy * Math.sin(angle), y + dx * Math.sin(angle) + dy * Math.cos(angle));
    }
    this.supportHand.setVisible(twoHand);
    const support = c.anchors[pose.actor].support;
    this.shield.setPosition(support[0] - c.origin[0], support[1] - c.origin[1]);
    this.shield.setVisible(shieldHp > 0 && grip === 'one_hand' && !twoHand);
    this.team.clear();
    if (side) this.team.lineStyle(2, side === 'friendly' ? 0x76dec3 : 0xf09b84).strokeEllipse(0, 2, 40, 10);
  }
  inspect() {
    const p = this.pose!;
    const v = WEAPON_VISUALS[this.weaponId];
    const character = CHARACTER_VISUALS[this.appearanceId];
    const scale = p.scale ?? v.scale;
    let supportError = 0;
    if (p.support) {
      const angle = this.weapon.rotation, dx = (p.support[0] - p.pivot[0]) * scale, dy = (p.support[1] - p.pivot[1]) * scale;
      supportError = Math.hypot(this.supportHand.x - (this.weapon.x + dx * Math.cos(angle) - dy * Math.sin(angle)), this.supportHand.y - (this.weapon.y + dx * Math.sin(angle) + dy * Math.cos(angle)));
    }
    return { weaponId: this.weaponId, appearanceId: this.appearanceId, actorTexture: this.actor.texture.key,
      grip: this.grip, facing: this.facing, actorFrame: p.actor, weaponFrame: p.weapon,
      hands: p.support ? 2 : 1, shield: this.shield.visible,
      anchorError: Math.hypot(this.weapon.x - (p.hand[0] - character.origin[0]), this.weapon.y - (p.hand[1] - character.origin[1])), supportError,
      anatomicalSupportError: p.support ? Math.hypot(this.supportHand.x - (character.anchors[p.actor].support[0] - character.origin[0]), this.supportHand.y - (character.anchors[p.actor].support[1] - character.origin[1])) : 0 };
  }
  destroy(): void { this.root.destroy(true); }
}
