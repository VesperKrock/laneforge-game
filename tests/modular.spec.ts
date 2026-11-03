import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { Battle, DEFAULT_LOADOUT, TEMP_R1D_UNITS } from '../src/game/Battle';
import type { Side, Unit, UnitKind } from '../src/game/Battle';
import { ACTIVE_WEAPONS, WEAPON_CATALOG, compileCombatBehavior, SINGLE_TARGET } from '../src/game/WeaponCatalog';
import { compileBuild, validateBuild, TEMP_R2A_CORE } from '../src/game/UnitBuild';
import type { UnitBuild } from '../src/game/UnitBuild';

function build(weapon = 'axe', shield = false): UnitBuild {
  return { coreId: 'infantry_demo', equipment: { mainHand: weapon,
    offHand: shield ? { kind: 'shield', shieldId: 'demo_shield' } : { kind: 'empty' } } };
}
function legacy(kind: UnitKind, side: Side, id: number, x: number): Unit {
  const p = TEMP_R1D_UNITS[kind];
  return { id, kind, side, x, hp: p.hp, maxHp: p.hp, damage: p.damage, speed: p.speed,
    attackInterval: p.attackInterval, attackRange: p.attackRange, attackIn: 0, engaged: false, flash: 0 };
}
function custom(weapon = 'axe', shield = false, side: Side = 'friendly'): Unit {
  const b = new Battle();
  expect(b.setCustomBuild(0, build(weapon, shield))).toBe(true); b.start();
  expect(b.summon(side, 0)).toBe(true);
  return b.units[0];
}
function arena(...units: Unit[]): Battle {
  const b = new Battle(); b.start(); b.units = units; b.cooldowns.enemy.fill(9999); return b;
}
const frames = [[.01], [1 / 60], [1 / 30], [.05], [.013, .027, .041], [.2]];

test('R2B catalog: all 43 source rows stay intact; 15 R2A, eight R2B, 20 catalog-only', () => {
  expect(WEAPON_CATALOG).toHaveLength(43);
  expect(WEAPON_CATALOG.map(w => w.sourceIndex)).toEqual(Array.from({ length: 43 }, (_, i) => i + 1));
  expect(new Set(WEAPON_CATALOG.map(w => w.id)).size).toBe(43);
  const original = ['spear','estoc','ji','stiletto','club','mace','war_hammer','arming_sword','sabre','katana_taichi','battle_axe','axe','bardiche','longsword','greatsword'];
  const added = ['pike','trident','morning_star','two_hand_mace','scimitar','falchion','short_sword','nodachi'];
  expect(WEAPON_CATALOG.filter(w => w.implementationStatus === 'active_r2a').map(w => w.id)).toEqual(original);
  expect(WEAPON_CATALOG.filter(w => w.implementationStatus === 'active_r2b').map(w => w.id)).toEqual(added);
  expect(WEAPON_CATALOG.filter(w => w.implementationStatus === 'catalog_only')).toHaveLength(20);
  expect(ACTIVE_WEAPONS.map(w => w.id)).toEqual(WEAPON_CATALOG.filter(w => w.implementationStatus !== 'catalog_only').map(w => w.id));
  const names = ['Spear – Thương','Lance – Kỵ thương','Pike – Trường thương','Javelin – Lao phóng','Estoc - Liễu kiếm','Ji - Kích','Đinh Ba','Lao móc','Stiletto - Dao đục','Club – Chùy gỗ','Mace – Chùy chiến','Morning Star - Chùy sao','War Hammer – Búa chiến','Pollaxe','Bec de Corbin','Flail- Chùy xích','Côn nhị khúc','Trường côn-Côn','Búa chiến cán dài','Chùy 2 tay','Arming Sword','Sabre – Kiếm cong','Scimitar','Falchion- - Đao','Katana-Taichi','Đoản kiếm','Machete','Rìu chiến- Battle Axe','Rìu','Mâu','Rìu cán dài-Bardiche','Longsword','Greatsword','Đại đao  ','Nodachi / Ōdachi','Cung','Nỏ','Quyền trượng','Đũa phép','Bùa chú/ Vật tổ','Cầu phép','Tinh Linh','Sách phép'];
  expect(WEAPON_CATALOG.map(w => w.sourceName)).toEqual(names);
  const groups: [number[], string | null][] = [
    [[1,2,3,4,6,7,8,15,18,19,30,31], 'Vũ khí cán dài (hai tay)'],
    [[5,9,10,11,12,13,14,21,22,23,24,25,26,27,28,29], 'Vũ khí 1 tay'],
    [[16,17], 'Vũ khí xích'], [[20,32,33,34,35], 'Vũ khí 2 tay'], [[36,37], 'Cung 2 tay'],
    [[38,39,40,41,42,43], null],
  ];
  for (const [indices, group] of groups) for (const i of indices) expect(WEAPON_CATALOG[i - 1].sourceAnimationGroup).toBe(group);
  expect(WEAPON_CATALOG[13]).toMatchObject({ sourceDamageCategory: 'Đập/đâm', reviewStatus: 'OPEN_REVIEW' });
  expect(WEAPON_CATALOG[24]).toMatchObject({ sourceAnimationGroup: 'Vũ khí 1 tay', reviewStatus: 'OPEN_REVIEW' });
  for (const w of WEAPON_CATALOG) {
    expect(w.sourceNote.length).toBeGreaterThan(5);
    expect(w.proposedFamily).toBe(w.animationFamily);
    if (w.implementationStatus === 'catalog_only') expect(validateBuild(build(w.id)).valid).toBe(false);
  }
  // Source-only golden digest includes every original damage category, animation group and note.
  expect(createHash('sha256').update(JSON.stringify(WEAPON_CATALOG.map(w => [w.sourceIndex, w.sourceName, w.sourceDamageCategory, w.sourceAnimationGroup, w.sourceNote]))).digest('hex')).toBe('d9276dd5707e94721c7e4ba12ed8fa7bdbc313250092a8dc71b82c76a640647c');
});

test('R2A validator: malformed/unsupported builds and slots are rejected before economy or loadout changes', () => {
  const invalid: unknown[] = [null, undefined, {}, [], 'axe', { ...build(), coreId: 'titan' },
    { ...build(), armor: 'demo' }, { coreId: 'infantry_demo', equipment: null },
    { coreId: 'infantry_demo', equipment: { mainHand: null, offHand: { kind: 'empty' } } },
    { coreId: 'infantry_demo', equipment: { mainHand: 'missing', offHand: { kind: 'empty' } } },
    { coreId: 'infantry_demo', equipment: { mainHand: 'axe', offHand: { kind: 'weapon', weaponId: 'sabre' } } },
    { coreId: 'infantry_demo', equipment: { mainHand: 'axe', offHand: { kind: 'shield', shieldId: 'other' } } },
    { coreId: 'infantry_demo', equipment: { mainHand: 'axe', offHand: { kind: 'empty', damage: 999 } } },
    { coreId: 'infantry_demo', equipment: { mainHand: 'axe', offHand: null } },
    build('greatsword', true), build('spear', true), build('ji', true), build('longsword', true), build('bardiche', true),
  ];
  const b = new Battle(); expect(b.setCustomBuild(2, build())).toBe(true);
  const before = JSON.stringify(b);
  for (const item of invalid) {
    const validation = validateBuild(item);
    expect(validation.valid).toBe(false); expect(validation.errors.length).toBeGreaterThan(0);
    expect(() => compileBuild(item as UnitBuild)).toThrow(RangeError);
    expect(b.setCustomBuild(0, item)).toBe(false); expect(JSON.stringify(b)).toBe(before);
  }
  for (const slot of [-1, 5, .5, NaN, Infinity]) { expect(b.setCustomBuild(slot, build())).toBe(false); expect(JSON.stringify(b)).toBe(before); }
  b.start(); const running = JSON.stringify(b);
  expect(b.setCustomBuild(1, build('club'))).toBe(false); expect(b.clearCustomBuild()).toBe(false);
  expect(JSON.stringify(b)).toBe(running);
});

test('R2A compiler: pure immutable snapshots and component-only grip rounding, no legacy mutation', () => {
  const originals = JSON.stringify([WEAPON_CATALOG, ACTIVE_WEAPONS, TEMP_R1D_UNITS]);
  const input = build(); const p = compileBuild(input);
  expect(compileBuild(input)).toEqual(p);
  expect(p).toMatchObject({ hp: 60, shieldHp: 0, damagePhysicalCore: 0, damagePhysicalWeaponBase: 26,
    damagePhysicalWeapon: 34, weaponBonus: 8, damage: 34, attackInterval: 1.2, windup: .6, cost: 35, gripMode: 'two_hand_grip' });
  expect(compileBuild(build('axe', true))).toMatchObject({ hp: 60, shieldHp: 30, damage: 26, weaponBonus: 0, cost: 45, gripMode: 'one_hand', attackInterval: 1.2 });
  expect(compileBuild(build('stiletto'))).toMatchObject({ damage: 7, weaponBonus: 0, gripMode: 'one_hand' });
  expect(compileBuild(build('greatsword'))).toMatchObject({ damage: 34, weaponBonus: 0, gripMode: 'fixed_two_hand', cost: 45 });
  expect(Math.ceil(60 / 26)).toBe(3); expect(Math.ceil(60 / 34)).toBe(2);
  for (const value of [p, p.build, p.build.equipment, p.build.equipment.offHand, WEAPON_CATALOG, ...WEAPON_CATALOG, ACTIVE_WEAPONS, ...ACTIVE_WEAPONS]) expect(Object.isFrozen(value)).toBe(true);
  (input.equipment as { mainHand: string }).mainHand = 'club';
  expect(p.weaponId).toBe('axe'); expect(p.build.equipment.mainHand).toBe('axe');
  expect(JSON.stringify([WEAPON_CATALOG, ACTIVE_WEAPONS, TEMP_R1D_UNITS])).toBe(originals);
  expect(TEMP_R2A_CORE.damagePhysical).toBe(0);
});

test('R2B behavior metadata is closed, immutable and present only on explicit weapons', () => {
  expect(compileBuild(build('spear')).behavior).toMatchObject({kind:'support_retreat',retreatSpeed:48,kiteDistance:52});
  expect(compileBuild(build('war_hammer')).behavior).toMatchObject({kind:'splash',damage:10,radius:40});
  for (const weapon of ACTIVE_WEAPONS.filter(w => !['spear','war_hammer'].includes(w.id))) {
    expect(compileBuild(build(weapon.id)).behavior).toBe(SINGLE_TARGET);
  }
  for (const value of [null,{}, {kind:'splash',damage:10,radius:NaN},
    {kind:'splash',damage:10,radius:40.001}, {kind:'splash',damage:10,radius:40,bonus:1},
    {kind:'support_retreat',retreatSpeed:999,kiteDistance:52,supportOffset:30,nearbyMelee:96},
    Object.create({kind:'single_target'}), {get kind(){return 'single_target';}}]) {
    expect(() => compileCombatBehavior(value)).toThrow(RangeError);
  }
  const mutable = {kind:'splash',damage:10,radius:40};
  const compiled = compileCombatBehavior(mutable);
  mutable.radius = 100;
  expect(compiled).toMatchObject({kind:'splash',damage:10,radius:40});
  expect(Object.isFrozen(compiled)).toBe(true);
  expect(Object.isFrozen(compileBuild(build('war_hammer')).behavior)).toBe(true);
  expect(compileBuild(build('axe')).damage).toBe(34);
  expect(compileBuild(build('axe',true)).damage).toBe(26);
});

test('R2B provisional grip and price rules apply to all eight additions without passive bleed', () => {
  const added = WEAPON_CATALOG.filter(w => w.implementationStatus === 'active_r2b');
  expect(added).toHaveLength(8);
  for (const row of added) {
    const weapon = ACTIVE_WEAPONS.find(w => w.id === row.id)!;
    const bare = compileBuild(build(row.id));
    expect(bare.cost).toBe(weapon.cost + TEMP_R2A_CORE.cost);
    expect(bare.cooldown).toBe(weapon.cooldown);
    expect(bare.attackRange).toBe(weapon.attackRange);
    expect(bare.behavior).toBe(SINGLE_TARGET);
    if (weapon.gripClass === 'one_hand') {
      const shield = compileBuild(build(row.id,true));
      expect(shield.shieldHp).toBe(30);
      expect(shield.cost).toBe(bare.cost+10);
      expect(shield.damage).toBe(weapon.damagePhysicalWeapon);
      expect(bare.damage).toBe(Math.round(weapon.damagePhysicalWeapon*(weapon.canTwoHandGrip?1.3:1)));
    } else {
      expect(validateBuild(build(row.id,true)).valid).toBe(false);
      expect(bare.damage).toBe(weapon.damagePhysicalWeapon);
      expect(bare.gripMode).toBe('fixed_two_hand');
    }
  }
  expect(compileBuild(build('falchion')).damage).toBe(26);
  expect(compileBuild(build('falchion',true)).damage).toBe(20);
});

test('R2B custom Spear retreats at 52, attacks at 58, supports an ally and stops at its own gate', () => {
  for (const side of ['friendly','enemy'] as const) {
    const d = side === 'friendly' ? 1 : -1;
    const foeSide = side === 'friendly' ? 'enemy' : 'friendly';
    const spear = custom('spear',false,side); spear.id=100; spear.x=480;
    const foe = legacy('shield',foeSide,200,480+d*120); foe.speed=0; foe.attackIn=999;
    const battle=arena(spear,foe);
    battle.step(.05); expect((spear.x-480)*d).toBeCloseTo(85*.05,8);
    spear.x=480; foe.x=480+d*58;
    battle.step(.05); expect(spear.x).toBe(480);
    foe.x=480+d*52.001; battle.step(.05); expect(spear.x).toBe(480);
    foe.x=480+d*52; battle.step(.05); expect((480-spear.x)*d).toBeCloseTo(2.4,8);
    foe.x=spear.x+d*58; spear.attackIn=0; spear.engaged=true; battle.step(.01);
    expect(foe.hp).toBe(140);
    const ally=legacy('shield',side,101,spear.x+d*30); ally.speed=0; ally.attackIn=999;
    battle.units.push(ally); foe.x=ally.x+d*28; const before=spear.x;
    battle.step(.05); expect(spear.x).toBeCloseTo(before,8);
    expect(ally.hp).toBe(150);
    battle.units=[spear,foe]; spear.x=side==='friendly'?124:836; foe.x=spear.x+d*52;
    battle.step(.05); expect(spear.x).toBe(side==='friendly'?124:836);
  }
});

test('R2B custom Spear contact windup and repeat cooldown survive a brief target handoff', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opposite=side==='friendly'?'enemy':'friendly';
    const spear=custom('spear',false,side);spear.id=100;spear.x=480;spear.speed=0;
    const foe=legacy('shield',opposite,200,480+d*58);foe.speed=0;foe.attackIn=999;
    const battle=arena(spear,foe);
    for(let i=0;i<15;i++)battle.step(.01);
    expect(foe.hp).toBe(150);
    battle.step(.01);expect(foe.hp).toBe(140);
    foe.x=480+d*59;battle.step(.01);expect(foe.hp).toBe(140);
    foe.x=480+d*58;
    for(let i=0;i<88;i++)battle.step(.01);
    expect(foe.hp).toBe(140);
    battle.step(.01);expect(foe.hp).toBe(130);
  }
});

test('R2B custom Spear can be caught by a pursuing Gladiator; movement and hits mirror with uneven steps', () => {
  for (const schedule of [[.01],[.013,.027,.041],[.05]]) {
    let reference: unknown;
    for (const side of ['friendly','enemy'] as const) for (const reverse of [false,true]) {
      const d=side==='friendly'?1:-1;
      const spear=custom('spear',false,side); spear.id=100; spear.x=480-d*70;
      const pursuer=legacy('gladiator',side==='friendly'?'enemy':'friendly',200,480+d*70);
      const battle=arena(...(reverse?[pursuer,spear]:[spear,pursuer]));
      let retreats=0, fired=false, firstHitX:number|undefined;
      for(let i=0;i<3000&&spear.hp>0&&pursuer.hp>0;i++){
        const previous=spear.x, foeHp=pursuer.hp, hp=spear.hp;
        const dt=schedule[i%schedule.length]; battle.step(dt);
        const retreat=(previous-spear.x)*d;
        if(retreat>1e-7){retreats++;expect(retreat).toBeLessThanOrEqual(48*Math.min(dt,.05)+1e-7);if(pursuer.hp<foeHp)fired=true;}
        if(spear.hp<hp&&firstHitX===undefined)firstHitX=(spear.x-480)*d;
      }
      expect(retreats).toBeGreaterThan(0); expect(fired).toBe(true);
      expect(firstHitX).toBeDefined(); expect(spear.hp).toBeLessThan(60);
      expect(spear.hp===0||pursuer.hp===0).toBe(true);
      const result=[spear.hp,pursuer.hp,+battle.elapsed.toFixed(6),+firstHitX!.toFixed(6)];
      if(!reference) reference=result; else expect(result).toEqual(reference);
    }
  }
});

test('R2B custom Hammer windup, uncapped splash, boundary, dead/ally/base exclusion and barrier mirror', () => {
  for (const count of [1,2,3,4,7]) for (const side of ['friendly','enemy'] as const) for (const reverse of [false,true]) {
    const d=side==='friendly'?1:-1, opposite=side==='friendly'?'enemy':'friendly';
    const hammer=custom('war_hammer',false,side); hammer.id=100; hammer.x=480; hammer.speed=0;
    const primary=legacy('shield',opposite,200,480+d*28); primary.speed=0; primary.attackIn=999;
    const secondaries=Array.from({length:count-1},(_,i)=>{const u=legacy('shield',opposite,201+i,primary.x+d*10);u.speed=0;u.attackIn=999;return u;});
    const edge=legacy('shield',opposite,300,primary.x+d*40); edge.speed=0;edge.attackIn=999;
    const outside=legacy('shield',opposite,301,primary.x+d*40.001); outside.speed=0;outside.attackIn=999;
    const dead=legacy('shield',opposite,302,primary.x+d*10);dead.hp=0;
    const ally=legacy('shield',side,303,480);ally.speed=0;ally.attackIn=999;
    const units=[hammer,primary,...secondaries,edge,outside,dead,ally];
    const battle=arena(...(reverse?units.reverse():units));
    for(let i=0;i<90;i++)battle.step(.01);
    expect(primary.hp).toBe(150); expect(secondaries.every(u=>u.hp===150)).toBe(true);
    battle.step(.01);
    expect(primary.hp).toBe(124);
    expect(secondaries.every(u=>u.hp===140)).toBe(true);
    expect([edge.hp,outside.hp,dead.hp,ally.hp]).toEqual([140,150,0,150]);
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
  const hammer=custom('war_hammer');hammer.id=100;hammer.x=466;hammer.speed=0;
  const primary=custom('axe',true,'enemy');primary.id=200;primary.x=494;primary.speed=0;primary.attackIn=999;
  const splash=custom('axe',true,'enemy');splash.id=201;splash.x=504;splash.speed=0;splash.attackIn=999;
  const battle=arena(hammer,primary,splash);
  for(let i=0;i<91;i++)battle.step(.01);
  expect([primary.shieldHp,primary.hp,splash.shieldHp,splash.hp]).toEqual([4,60,20,60]);
  battle.units=[hammer];hammer.engaged=false;hammer.attackIn=0;hammer.x=822;
  for(let i=0;i<180;i++)battle.step(.01);
  expect(battle.enemyHp).toBe(214);
});

test('R2B custom Hammer simultaneous mutual lethal keeps both splash snapshots across side, ID and order', () => {
  for (const mirror of [false,true]) for (const swap of [false,true]) for (const reverse of [false,true]) {
    const left=custom('war_hammer');left.id=swap?200:100;left.x=466;left.hp=26;left.speed=0;left.engaged=true;left.attackIn=0;
    const right=custom('war_hammer',false,'enemy');right.id=swap?100:200;right.x=494;right.hp=26;right.speed=0;right.engaged=true;right.attackIn=0;
    const ally=legacy('shield','friendly',301,455);ally.speed=0;ally.attackIn=999;
    const foe=legacy('shield','enemy',302,505);foe.speed=0;foe.attackIn=999;
    const units=[left,right,ally,foe];
    if(mirror) for(const unit of units){unit.x=960-unit.x;unit.side=unit.side==='friendly'?'enemy':'friendly';}
    const battle=arena(...(reverse?units.reverse():units));battle.step(.01);
    expect([left.hp,right.hp,ally.hp,foe.hp]).toEqual([0,0,140,140]);
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
});

test('R2A slots: exactly one custom replacement, same paid profile on both sides, CD/funds/gates/restart/setup', () => {
  const b = new Battle(); b.setCustomBuild(2, build('axe', true)); b.setCustomBuild(0, build('axe', true));
  expect(b.customSlot?.slot).toBe(0); expect(b.getSlotProfile(2)).toEqual(TEMP_R1D_UNITS.shield);
  expect(b.loadout).toEqual(DEFAULT_LOADOUT); b.start();
  for (const side of ['friendly', 'enemy'] as const) {
    expect(b.summon(side, 0)).toBe(true); expect(b.gold[side]).toBe(55); expect(b.cooldowns[side][0]).toBe(3.2);
    expect(b.units.at(-1)).toMatchObject({ side, hp: 60, maxHp: 60, shieldHp: 30, damage: 26 });
    const before = JSON.stringify(b); expect(b.summon(side, 0)).toBe(false); expect(JSON.stringify(b)).toBe(before);
    b.cooldowns[side][0] = 0; b.gold[side] = 44; const low = JSON.stringify(b);
    expect(b.summon(side, 0)).toBe(false); expect(JSON.stringify(b)).toBe(low);
  }
  expect(b.units[0].profile).toEqual(b.units[1].profile);
  b.start(); expect(b.customSlot?.profile.weaponId).toBe('axe'); expect(b.units).toEqual([]);
  b.units = [legacy('sword', 'enemy', 100, 123)];
  expect(b.summon('friendly', 0)).toBe(false); expect(b.gold.friendly).toBe(100);
  b.prepare(); expect(b.setCustomBuild(4, build('greatsword'))).toBe(true);
  expect(b.getSlotProfile(0)).toEqual(TEMP_R1D_UNITS.sword);
  expect(b.clearCustomBuild()).toBe(true); expect(b.customSlot).toBeUndefined();
  for (let i = 0; i < 5; i++) expect(b.getSlotProfile(i)).toEqual(TEMP_R1D_UNITS[DEFAULT_LOADOUT[i]]);
});

test('R2A barrier: absorbs before body, spills over, stays broken; primary and uncapped R1D AOE are symmetric', () => {
  for (const mirror of [false, true]) for (const reverse of [false, true]) {
    const a = legacy('hammer', 'friendly', 100, 466);
    const target = custom('stiletto', true, 'enemy'); target.id = 200; target.x = 494;
    const splash = custom('stiletto', true, 'enemy'); splash.id = 300; splash.x = 510;
    const refs = [a, target, splash];
    if (mirror) for (const u of refs) { u.x = 960 - u.x; u.side = u.side === 'friendly' ? 'enemy' : 'friendly'; }
    a.speed = 0; a.engaged = true;
    target.speed = splash.speed = 0; target.attackIn = splash.attackIn = 999;
    const b = arena(...(reverse ? [...refs].reverse() : refs));
    b.step(.01); expect([target.shieldHp,target.hp,splash.shieldHp,splash.hp]).toEqual([4,60,20,60]);
    a.attackIn = 0; b.step(.01); expect([target.shieldHp,target.hp,splash.shieldHp,splash.hp]).toEqual([0,38,10,60]);
    a.attackIn = 0; b.step(.01); expect([target.shieldHp,target.hp,splash.shieldHp,splash.hp]).toEqual([0,12,0,60]);
    a.attackIn = 0; b.step(.01); expect([target.shieldHp,target.hp,splash.shieldHp,splash.hp]).toEqual([0,0,0,50]);
    expect(target.maxHp).toBe(60); expect(splash.maxHp).toBe(60);
  }
});

test('R2B combat: real axe hit threshold, fixed greatsword and explicit custom hammer AOE', async () => {
  const rows = [];
  for (const [weapon, shield] of [['axe', true], ['axe', false], ['greatsword', false]] as const) {
    const a = custom(weapon, shield); a.id = 100; a.x = 466;
    const target = legacy('sword', 'enemy', 200, 494); target.speed = 0; target.attackIn = 999;
    const b = arena(a, target); const hits: number[] = [];
    while (target.hp > 0 && b.elapsed < 10) { const hp = target.hp; b.step(.01); if (hp !== target.hp) hits.push(+b.elapsed.toFixed(2)); }
    expect(hits).toHaveLength(shield ? 3 : 2);
    for (let i = 1; i < hits.length; i++) expect(hits[i] - hits[i - 1]).toBeGreaterThanOrEqual(a.attackInterval - 1e-7);
    rows.push({ weapon, shield, damage: a.damage, hits, targetHp: target.hp, bodyHp: a.hp, shieldHp: a.shieldHp });
  }
  const hammer = custom('war_hammer'); hammer.x = 466;
  const targets = [legacy('sword', 'enemy', 200, 494), legacy('sword', 'enemy', 300, 500)];
  for (const u of targets) { u.speed = 0; u.attackIn = 999; }
  const b = arena(hammer, ...targets);
  while (b.elapsed < 1) b.step(.01);
  expect(targets.map(u => u.hp)).toEqual([34, 50]);
  await test.info().attach('axe-shield-two-hand-greatsword-hits', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
});

test('R2A comparison: axe shield / axe two-hand / greatsword real duels mirror across IDs, arrays and six frame schedules', async () => {
  const builds = [['axe',true],['axe',false],['greatsword',false]] as const;
  const rows = [];
  for (let left = 0; left < 3; left++) for (let right = left + 1; right < 3; right++) for (const dt of frames) {
    let reference: unknown;
    for (const mirror of [false,true]) for (const swap of [false,true]) for (const reverse of [false,true]) {
      const a = custom(builds[left][0], builds[left][1]); const z = custom(builds[right][0], builds[right][1], 'enemy');
      a.id = swap ? 200 : 100; z.id = swap ? 100 : 200; a.x = 466; z.x = 494;
      if (mirror) for (const u of [a,z]) { u.x = 960-u.x; u.side = u.side === 'friendly' ? 'enemy' : 'friendly'; }
      const b = arena(...(reverse ? [z,a] : [a,z])); const trace = [];
      for (let f = 0; a.hp > 0 && z.hp > 0 && f < 2000; f++) {
        const hp = [a.hp,a.shieldHp,z.hp,z.shieldHp]; b.step(dt[f % dt.length]);
        if (JSON.stringify(hp) !== JSON.stringify([a.hp,a.shieldHp,z.hp,z.shieldHp])) trace.push([+b.elapsed.toFixed(6),a.hp,a.shieldHp,z.hp,z.shieldHp]);
      }
      const result = { hp: [a.hp,z.hp], shieldHp: [a.shieldHp,z.shieldHp], seconds: +b.elapsed.toFixed(6), trace };
      expect(a.hp === 0 || z.hp === 0).toBe(true);
      if (!reference) { reference = result; rows.push({ left: builds[left], right: builds[right], dt, ...result }); }
      else expect(result).toEqual(reference);
    }
  }
  await test.info().attach('three-build-duels', { body: JSON.stringify(rows,null,2), contentType:'application/json' });
});

test('R2B representative new-weapon pairwise duels mirror across side, ID, array and uneven delta', async () => {
  const pairs = [['pike','spear'],['trident','ji'],['morning_star','mace'],['scimitar','sabre'],
    ['falchion','axe'],['short_sword','stiletto'],['two_hand_mace','greatsword'],['nodachi','longsword']] as const;
  const rows=[];
  for(const [first,second] of pairs)for(const schedule of [[.01],[.013,.027,.041]]){
    let reference:unknown;
    for(const mirror of [false,true])for(const swap of [false,true])for(const reverse of [false,true]){
      const a=custom(first);const z=custom(second,false,'enemy');
      a.id=swap?200:100;z.id=swap?100:200;
      const distance=Math.min(a.attackRange,z.attackRange);
      a.x=480-distance/2;z.x=480+distance/2;
      if(mirror)for(const u of [a,z]){u.x=960-u.x;u.side=u.side==='friendly'?'enemy':'friendly';}
      const battle=arena(...(reverse?[z,a]:[a,z]));
      for(let i=0;i<5000&&a.hp>0&&z.hp>0;i++)battle.step(schedule[i%schedule.length]);
      expect(a.hp===0||z.hp===0).toBe(true);
      expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
      const result={hp:[a.hp,z.hp],seconds:+battle.elapsed.toFixed(6)};
      if(!reference){reference=result;rows.push({first,second,schedule,...result});}
      else expect(result).toEqual(reference);
    }
  }
  await test.info().attach('r2b-pairwise-duels',{body:JSON.stringify(rows,null,2),contentType:'application/json'});
});

for (const weapon of ACTIVE_WEAPONS) test(`R2A model ${weapon.id}: finite compile, paid mirror summons, simultaneous replies, ID/order/dt symmetry and completed real matches`, async () => {
  const variants = weapon.gripClass === 'one_hand' ? [false, true] : [false];
  let combinations = 0;
  for (const shield of variants) {
    const p = compileBuild(build(weapon.id, shield));
    for (const value of [p.hp,p.shieldHp,p.damage,p.speed,p.attackInterval,p.windup,p.attackRange,p.cost,p.cooldown]) expect(Number.isFinite(value)).toBe(true);
    for (const dt of frames) {
      let reference: unknown;
      for (const mirror of [false, true]) for (const swap of [false, true]) for (const reverse of [false, true]) {
        const a = custom(weapon.id, shield); const z = custom(weapon.id, shield, 'enemy');
        a.id = swap ? 200 : 100; z.id = swap ? 100 : 200;
        a.x = 480 - p.attackRange / 2; z.x = 480 + p.attackRange / 2;
        if (mirror) for (const u of [a,z]) { u.x = 960 - u.x; u.side = u.side === 'friendly' ? 'enemy' : 'friendly'; }
        const b = arena(...(reverse ? [z,a] : [a,z])); const trace = [];
        for (let f = 0; a.hp > 0 && f < 2000; f++) {
          const hp = a.hp, barrier = a.shieldHp;
          b.step(dt[f % dt.length]);
          assert.equal(a.hp, z.hp); assert.equal(a.shieldHp, z.shieldHp);
          assert.ok(Math.abs(a.x + z.x - 960) < 1e-8);
          if (a.hp !== hp || a.shieldHp !== barrier) trace.push([+b.elapsed.toFixed(8), a.hp, a.shieldHp]);
        }
        expect(a.hp).toBe(0); expect(z.hp).toBe(0); expect(b.phase).toBe('running');
        expect([b.playerHp,b.enemyHp]).toEqual([240,240]);
        if (!reference) reference = trace; else expect(trace).toEqual(reference);
        combinations++;
      }
    }
  }
  const outcomes = [];
  for (const strategy of ['single', 'mixed'] as const) {
    const b = new Battle(); b.setCustomBuild(1, build(weapon.id)); b.start();
    let cursor = 0, next = 0;
    const order = [2,4,1,0,3];
    for (let f = 0; b.phase === 'running' && f < 18000; f++) {
      if (strategy === 'single' && f === 0) expect(b.summon('friendly', 1)).toBe(true);
      if (strategy === 'mixed' && b.elapsed >= next) { if (b.summon('friendly', order[cursor % 5])) cursor++; next += .1; }
      b.step(.02);
      assert.ok(b.units.every(u => Number.isFinite(u.hp + u.x + u.damage + (u.shieldHp ?? 0))));
    }
    expect(['won','lost']).toContain(b.phase);
    expect(b.playerHp === 0 && b.enemyHp === 0).toBe(false);
    outcomes.push({ strategy, result: b.phase, seconds: +b.elapsed.toFixed(2), hp: [b.playerHp,b.enemyHp], playerSpawns: strategy === 'single' ? 1 : cursor, botChoice: b.botChoice });
  }
  await test.info().attach(`model-${weapon.id}`, { body: JSON.stringify({ combinations, outcomes }, null, 2), contentType: 'application/json' });
});

test('R2A mixed frontlines: all custom families respect blockers, no crossing/base shortcut, and support beside legacy spear', () => {
  for (const weapon of ACTIVE_WEAPONS) for (const mirror of [false,true]) {
    const a = custom(weapon.id); a.id = 100; a.x = 780;
    const ally = legacy('spear','friendly',101,750);
    const blocker = custom('axe',true,'enemy'); blocker.id = 200; blocker.x = 808;
    if (mirror) for (const u of [a,ally,blocker]) { u.x = 960 - u.x; u.side = u.side === 'friendly' ? 'enemy' : 'friendly'; }
    const b = arena(a,ally,blocker); const home = mirror ? 'playerHp' : 'enemyHp';
    for (let f = 0; blocker.hp > 0 && a.hp > 0 && f < 1000; f++) {
      b.step(.01); expect(b[home]).toBe(240);
      const friendly = b.units.filter(u => u.side === 'friendly'), enemy = b.units.filter(u => u.side === 'enemy');
      if (friendly.length && enemy.length) expect(Math.max(...friendly.map(u => u.x))).toBeLessThanOrEqual(Math.min(...enemy.map(u => u.x)) + 1e-7);
    }
  }
});

test('R2A compatibility: default R1D battle traces match the preflight source golden digest', () => {
  const hash = createHash('sha256');
  const orders = [[0], [2,4,1,0,3], [], [2,4,3,0,1]];
  for (let scenario = 0; scenario < orders.length; scenario++) {
    const b = new Battle(); if (scenario === 3) b.setLoadout(['sword','axe','shield','spear','hammer']);
    b.start(); let cursor = 0;
    for (let f = 0; f < 5000 && b.phase === 'running'; f++) {
      if (f % 5 === 0 && orders[scenario].length && b.summon('friendly', orders[scenario][cursor % orders[scenario].length])) cursor++;
      b.step(.02); hash.update(JSON.stringify(b));
    }
  }
  expect(hash.digest('hex')).toBe('9306f6dc4c6e5ee39645ea463e3cbf108f6bb9353a484fb08a6e4c8234c84b85');
});

function observe(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => errors.push(r.url()));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:4173/') && !r.url().startsWith('data:')) errors.push('External request'); });
  return errors;
}

test('R2A.1: the R1D strategy outcome depends on input schedule, with unchanged real economy and combat', async () => {
  const cases = [{ gap: .1, phase: 'won', digest: '274af461da88d87c96054cebe8b56cb7ee5544f2258250fe1364a29b700fcb86' },
    { gap: .2, phase: 'lost', digest: '869e942c182d6f38264bd37147f99909e2ad0d514125cf5579bf2f1f3a5746b7' }];
  const rows = [];
  for (const scenario of cases) {
    const b = new Battle(); b.setLoadout(['sword','axe','shield','spear','hammer']); b.start();
    const order = [2,3,4,0,1], hash = createHash('sha256'); let cursor = 0, next = 0;
    while (b.phase === 'running' && b.elapsed < 180) {
      if (b.elapsed + 1e-9 >= next) { if (b.summon('friendly', order[cursor % 5])) cursor++; next += scenario.gap; }
      b.step(.01); hash.update(JSON.stringify(b));
    }
    expect(b.phase).toBe(scenario.phase);
    // Goldens come from the preserved public R1D source, not a new balance rule.
    expect(hash.digest('hex')).toBe(scenario.digest);
    rows.push({ inputSeconds:scenario.gap, dt:.01, phase:b.phase, elapsed:b.elapsed, hp:[b.playerHp,b.enemyHp], purchases:cursor });
  }
  await test.info().attach('r2a1-schedule-regression', { body:JSON.stringify(rows,null,2),contentType:'application/json' });
});

test('R2A.1: real browser combat and paid input remain deterministic across host delays with a controlled RAF clock', async ({ page }) => {
  test.setTimeout(120000);
  const errors = observe(page);
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
  await page.goto('./'); await expect(page.locator('#battlefield canvas')).toBeVisible();
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z')); await page.clock.runFor(1000);
  await page.locator('#armory-choices [data-kind="gladiator"]').click();
  await page.locator('#armory-choices [data-kind="hammer"]').click();
  await page.locator('#start').click();
  const order = [2,3,4,0,1], purchases: number[] = []; let ticks = 0, hostDelays = 0;
  while (await page.locator('#battle-status').getAttribute('data-phase') === 'running' && ticks < 105000) {
    if (ticks % 10000 === 0) {
      const before = await page.locator('#battle-status, #gold, #bot-gold, #player-hp, #enemy-hp, #hits, #allies').allTextContents();
      await new Promise(resolve => setTimeout(resolve, 125)); // Host time only; no game state is written.
      expect(await page.locator('#battle-status, #gold, #bot-gold, #player-hp, #enemy-hp, #hits, #allies').allTextContents()).toEqual(before);
      hostDelays++;
    }
    const slot = order[purchases.length % 5];
    const result = await page.locator('#player-slots .slot').nth(slot).evaluate(node => {
      const button = node as HTMLButtonElement, before = Number(document.querySelector('#gold')!.textContent);
      if (button.disabled) return {clicked:false,paid:0};
      button.click(); return {clicked:true,paid:before - Number(document.querySelector('#gold')!.textContent)};
    });
    if (result.clicked) { expect(result.paid).toBe([25,35,40,30,45][slot]); purchases.push(slot); }
    await page.clock.runFor(100); ticks += 100;
  }
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase','won');
  await expect(page.locator('#enemy-hp')).toHaveText('0 / 240');
  expect(Number(await page.locator('#hits').textContent())).toBeGreaterThan(0);
  expect(purchases).toEqual([2,3,4,0,1,2,3,4,0,1]); expect(hostDelays).toBeGreaterThan(0);
  for (const button of await page.locator('.slot').all()) await expect(button).toBeDisabled();
  await page.locator('#start').click();
  await expect(page.locator('#gold')).toHaveText('100'); await expect(page.locator('#bot-gold')).toHaveText('100');
  await expect(page.locator('#player-hp')).toHaveText('240 / 240'); await expect(page.locator('#enemy-hp')).toHaveText('240 / 240');
  await expect(page.locator('#allies')).toHaveText('0'); await expect(page.locator('#hits')).toHaveText('0');
  await expect(page.locator('#bot-choice')).toHaveText('Bot chưa triệu hồi.');
  for (let i=0;i<5;i++) {
    await expect(page.locator('#player-slots .slot').nth(i)).toHaveAttribute('data-state','ready');
    await expect(page.locator('#bot-slots .slot').nth(i)).toHaveAttribute('data-state','ready');
    await expect(page.locator('#bot-slots .slot').nth(i)).toBeDisabled();
  }
  await expect(page.locator('#player-slots .slot').nth(4)).toHaveAttribute('data-unit-type','hammer');
  await expect(page.locator('#bot-slots .slot').nth(4)).toHaveAttribute('data-unit-type','hammer');
  expect(errors).toEqual([]);
  await test.info().attach('r2a1-clock-host-delay', { body:JSON.stringify({ticks,hostDelays,purchases}),contentType:'application/json' });
});

test.describe('R2A production workshop', () => {
  test.use({ hasTouch: true });
  test('R2B mobile grouped select, special previews, draft/apply/replay/setup and keyboard/touch', async ({ page }) => {
    const errors=observe(page);await page.setViewportSize({width:390,height:844});await page.goto('./');
    await page.locator('#workshop summary').focus();await page.keyboard.press('Enter');
    await expect(page.locator('#custom-weapon optgroup')).toHaveCount(5);
    await expect(page.locator('#custom-weapon option')).toHaveCount(23);
    await page.locator('#custom-weapon').selectOption('spear');
    await expect(page.locator('#custom-behavior')).toContainText('Tự lùi 48/s');
    await expect(page.locator('#custom-stats')).toContainText('Tầm 58');
    await page.locator('#custom-weapon').selectOption('war_hammer');
    await expect(page.locator('#custom-behavior')).toContainText('AOE +10 trong 40');
    await page.locator('#custom-weapon').selectOption('falchion');
    await expect(page.locator('#custom-behavior')).toContainText('Đơn mục tiêu');
    await expect(page.locator('#custom-stats')).toContainText('Damage mỗi hit 26');
    await page.locator('#custom-offhand').selectOption('shield');
    await expect(page.locator('#custom-stats')).toContainText('Damage mỗi hit 20');
    await page.locator('#custom-slot').selectOption('3');
    await expect(page.locator('#player-slots .slot').nth(3)).toHaveAttribute('data-unit-type','gladiator');
    await page.locator('#apply-custom').tap();
    for(const side of ['player','bot']) await expect(page.locator(`#${side}-slots .slot`).nth(3)).toHaveAttribute('data-unit-type','custom:falchion:30');
    await page.locator('#start').tap();
    await expect(page.locator('#custom-weapon')).toBeDisabled();
    await page.locator('#start').tap();
    await expect(page.locator('#player-slots .slot').nth(3)).toHaveAttribute('data-unit-type','custom:falchion:30');
    await page.locator('#setup').tap();
    await expect(page.locator('#custom-weapon')).toHaveValue('falchion');
    await expect(page.locator('#custom-offhand')).toHaveValue('shield');
    await expect(page.locator('#custom-slot')).toHaveValue('3');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
  test('desktop: a greatsword custom formation beats the live Bot and preserves its build on replay', async ({ page }) => {
    test.setTimeout(100000);
    const errors = observe(page); await page.goto('./');
    await page.locator('#workshop summary').click();
    await page.locator('#custom-slot').selectOption('1'); await page.locator('#custom-weapon').selectOption('greatsword');
    await page.locator('#apply-custom').click(); await page.locator('#start').click();
    let cursor = 0, captured = false; const order = [2,4,1,0,3]; const started = Date.now();
    while (await page.locator('#battle-status').getAttribute('data-phase') === 'running' && Date.now()-started < 85000) {
      const clicked = await page.locator('#player-slots .slot').nth(order[cursor % 5]).evaluate(node => {
        const b = node as HTMLButtonElement; if (b.disabled) return false; b.click(); return true;
      });
      if (clicked) cursor++;
      if (!captured && Date.now()-started > 8000) { await page.screenshot({path:'test-results/r2a-desktop-battle.png',fullPage:true}); captured = true; }
      await page.waitForTimeout(100);
    }
    await expect(page.locator('#battle-status')).toHaveAttribute('data-phase','won');
    await page.screenshot({path:'test-results/r2a-desktop-win.png',fullPage:true});
    await page.locator('#start').click();
    await expect(page.locator('#summon-2')).toHaveAttribute('data-unit-type','custom:greatsword:0');
    await expect(page.locator('#gold')).toHaveText('100'); await expect(page.locator('#bot-gold')).toHaveText('100');
    await expect(page.locator('#player-hp')).toHaveText('240 / 240');
    expect(errors).toEqual([]);
  });
  for (const [i, weapon] of ACTIVE_WEAPONS.entries()) test(`UI ${weapon.id}: one replacement, real summon/CD/gold, symmetric Bot slot and completed match`, async ({ page }) => {
    const errors = observe(page); await page.goto('./');
    await expect(page.locator('#workshop')).not.toHaveAttribute('open');
    await page.locator('#workshop summary').click();
    await expect(page.locator('#custom-weapon option')).toHaveCount(23);
    const slot = i % 5;
    await page.locator('#custom-slot').selectOption(String(slot));
    await page.locator('#custom-weapon').selectOption(weapon.id);
    const shield = weapon.id === 'axe';
    if (shield) await page.locator('#custom-offhand').selectOption('shield');
    const p = compileBuild(build(weapon.id, shield));
    if (weapon.gripClass !== 'one_hand') {
      await expect(page.locator('#custom-offhand option[value="shield"]')).toHaveJSProperty('disabled', true);
      await expect(page.locator('#grip-note')).toContainText('Vũ khí hai tay cố định');
    }
    await expect(page.locator('#custom-stats')).toContainText(`Damage mỗi hit ${p.damage}`);
    await page.locator('#apply-custom').click();
    for (const side of ['player','bot']) {
      const slots = page.locator(`#${side}-slots .slot`); await expect(slots).toHaveCount(5);
      await expect(slots.nth(slot)).toHaveAttribute('data-unit-type', `custom:${weapon.id}:${p.shieldHp}`);
      for (let j = 0; j < 5; j++) if (j !== slot) await expect(slots.nth(j)).toHaveAttribute('data-unit-type', DEFAULT_LOADOUT[j]);
    }
    await page.locator('#start').click();
    await expect(page.locator('#workshop-controls')).toHaveJSProperty('disabled', true);
    await expect(page.locator('#custom-weapon')).toBeDisabled();
    await expect(page.locator('#apply-custom')).toBeDisabled();
    const button = page.locator('#player-slots .slot').nth(slot);
    // Observe both sides of this native click in the same event task, excluding income between browser round trips.
    await button.evaluate(node => {
      const b = node as HTMLButtonElement;
      b.addEventListener('click', () => { b.dataset.paidBefore = document.querySelector('#gold')!.textContent!; }, {capture:true,once:true});
      b.addEventListener('click', () => { b.dataset.paidAfter = document.querySelector('#gold')!.textContent!; }, {once:true});
    });
    await button.click(); await expect(page.locator('#allies')).toHaveText('1');
    await expect(button).toHaveAttribute('data-state','cooling');
    const paid = await button.evaluate(node => Number((node as HTMLElement).dataset.paidBefore) - Number((node as HTMLElement).dataset.paidAfter));
    expect(paid).toBe(p.cost);
    await button.dispatchEvent('click'); await expect(page.locator('#allies')).toHaveText('1');
    await expect(page.locator('#battle-status')).toHaveAttribute('data-phase','lost',{timeout:35000});
    expect(Number(await page.locator('#hits').textContent())).toBeGreaterThan(0);
    await page.locator('#start').click();
    await expect(button).toHaveAttribute('data-unit-type',`custom:${weapon.id}:${p.shieldHp}`);
    await page.locator('#setup').click(); await expect(page.locator('#workshop-controls')).toHaveJSProperty('disabled', false);
    await expect(page.locator('#custom-weapon')).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test('mobile 390x844: keyboard/touch grip preview, shield lock, moving custom slot, restart and restore presets', async ({ page }) => {
    const errors = observe(page); await page.setViewportSize({width:390,height:844}); await page.goto('./');
    await page.locator('#workshop summary').focus(); await page.keyboard.press('Enter');
    await page.locator('#custom-weapon').selectOption('axe');
    await expect(page.locator('#custom-stats')).toContainText('Damage mỗi hit 34');
    await expect(page.locator('#grip-note')).toContainText('Cầm hai tay (+30%');
    await page.locator('#custom-offhand').selectOption('shield');
    await expect(page.locator('#custom-stats')).toContainText('HP thân 60 / HP Khiên 30');
    await expect(page.locator('#custom-stats')).toContainText('Damage mỗi hit 26');
    await page.locator('#apply-custom').tap();
    await page.locator('#custom-slot').selectOption('4'); await page.locator('#apply-custom').focus(); await page.keyboard.press('Space');
    await expect(page.locator('#summon')).toHaveAttribute('data-unit-type','sword');
    await expect(page.locator('#summon-5')).toHaveAttribute('data-unit-type','custom:axe:30');
    await page.screenshot({path:'test-results/r2a-workshop-mobile-shield.png',fullPage:true});
    await page.locator('#custom-weapon').selectOption('greatsword');
    await expect(page.locator('#custom-offhand')).toHaveValue('empty');
    await expect(page.locator('#custom-offhand option[value="shield"]')).toHaveJSProperty('disabled', true);
    await page.locator('#apply-custom').tap();
    await page.screenshot({path:'test-results/r2a-workshop-mobile-greatsword.png',fullPage:true});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#start').tap(); await page.locator('#summon-5').tap();
    await expect(page.locator('#allies')).toHaveText('1');
    await page.screenshot({path:'test-results/r2a-battle-mobile.png',fullPage:true});
    await page.locator('#start').tap();
    await expect(page.locator('#summon-5')).toHaveAttribute('data-unit-type','custom:greatsword:0');
    await page.locator('#setup').tap(); await page.locator('#clear-custom').tap();
    for (const side of ['player','bot']) expect(await page.locator(`#${side}-slots .slot`).evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.unitType))).toEqual(DEFAULT_LOADOUT);
    expect(errors).toEqual([]);
  });
});
