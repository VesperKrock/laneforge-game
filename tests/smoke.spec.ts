import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import assert from 'node:assert/strict';
import { Battle, DEMO, DEFAULT_LOADOUT, TEMP_R1D_UNITS, TEMP_R1C, TEMP_R1D, UNIT_KINDS } from '../src/game/Battle';
import type { Unit, UnitKind, Side } from '../src/game/Battle';

function advance(battle: Battle, seconds: number, dt = 0.01): void {
  for (let left = seconds; left > 1e-9; left -= dt) battle.step(Math.min(dt, left));
}

function unit(kind: UnitKind, side: Side, id: number, x: number): Unit {
  const p = TEMP_R1D_UNITS[kind];
  return { id, kind, side, x, hp: p.hp, maxHp: p.hp, damage: p.damage, speed: p.speed,
    attackInterval: p.attackInterval, attackRange: p.attackRange, attackIn: 0, engaged: false, flash: 0 };
}

function arena(...units: Unit[]): Battle {
  const battle = new Battle(); battle.start();
  battle.units = units;
  // Isolate combat fixtures from AI, without adding a production test mode.
  battle.cooldowns.enemy.fill(9999);
  return battle;
}

test('model: five unique unchanged profiles and identical paid summons on both sides', () => {
  expect(DEMO.baseHp).toBe(240);
  expect(UNIT_KINDS).toEqual(['sword','axe','shield','gladiator','spear','hammer']);
  expect(DEFAULT_LOADOUT).toEqual(['sword', 'axe', 'shield', 'gladiator', 'spear']);
  expect(new Set(DEFAULT_LOADOUT).size).toBe(5);
  for (const field of ['hp', 'damage', 'speed', 'attackInterval'] as const)
    expect(new Set(DEFAULT_LOADOUT.map(kind => TEMP_R1D_UNITS[kind][field])).size).toBe(5);
  for (const side of ['friendly', 'enemy'] as const) DEFAULT_LOADOUT.forEach((kind, slot) => {
    const battle = new Battle(); battle.start();
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
    expect(battle.units).toEqual([]); // No free wave at t=0.
    expect(battle.summon(side, slot)).toBe(true);
    const p = TEMP_R1D_UNITS[kind];
    expect(battle.units[0]).toMatchObject({side, kind, hp:p.hp, maxHp:p.hp, damage:p.damage, speed:p.speed, attackInterval:p.attackInterval, attackRange:p.attackRange});
    expect(battle.gold[side]).toBe(100-p.cost);
    expect(battle.cooldowns[side][slot]).toBe(p.cooldown);
    const other = side === 'friendly' ? 'enemy' : 'friendly';
    expect(battle.gold[other]).toBe(100);
    expect(battle.cooldowns[other]).toEqual([0,0,0,0,0]);
  });
});

test('model: shared validation rejects invalid phase, slot, funds, CD and unsafe spawn without any side effects', () => {
  for (const side of ['friendly', 'enemy'] as const) {
    const battle = new Battle();
    const reject = (slot: number, requestedSide: Side = side) => {
      const before=JSON.stringify(battle);
      expect(battle.canSummon(requestedSide,slot)).toBe(false);
      expect(battle.summon(requestedSide,slot)).toBe(false);
      expect(JSON.stringify(battle)).toBe(before);
    };
    reject(0);
    battle.start();
    for (const slot of [-1,5,1.5,NaN,Infinity]) reject(slot);
    reject(0,'invalid' as Side);
    expect(battle.summon(side,0)).toBe(true);
    expect(battle.summon(side,4)).toBe(true); // Same-side overlap never blocks spawn.
    expect(battle.gold[side]).toBe(45);
    expect(battle.units[0].x).toBe(battle.units[1].x);
    reject(0); reject(4);
    battle.gold[side]=39;
    reject(2);
    battle.gold[side]=100;
    const opponent=side==='friendly'?'enemy':'friendly';
    const spawn=side==='friendly'?124:836;
    battle.units=[unit('shield',opponent,100,spawn+(side==='friendly'?-1:1))];
    reject(2);
    battle.units=[];
    battle.phase='won'; reject(1);
    battle.phase='lost'; reject(1);
  }
});

test('model: both economies have equal income/caps and independent cooldown arrays', () => {
  const battle=new Battle(); battle.start();
  expect(battle.gold).toEqual({friendly:100,enemy:100});
  expect(battle.cooldowns.friendly).not.toBe(battle.cooldowns.enemy);
  battle.summon('friendly',0); battle.summon('enemy',0);
  advance(battle,0.25);
  expect(battle.gold.friendly).toBeCloseTo(76.25);
  expect(battle.gold.enemy).toBeCloseTo(76.25);
  expect(battle.cooldowns.friendly[0]).toBeCloseTo(1.75);
  expect(battle.cooldowns.enemy[0]).toBeCloseTo(1.75);
  battle.cooldowns.friendly[1]=3;
  expect(battle.cooldowns.enemy[1]).toBe(0);
  battle.gold={friendly:124.9,enemy:124.9};
  battle.step(0.05);
  expect(battle.gold).toEqual({friendly:125,enemy:125});
});

test('model: controlled no-spending income is equal each step, including the cap', () => {
  const battle=new Battle();battle.start();let attempts=0;
  // Refuse all spending in this fixture, without changing production Gold/CD updates or AI policy.
  battle.summon=()=>{attempts++;return false;};
  const observations=[];
  for(let second=0;second<=8;second++){
    const expected=Math.min(125,100+5*second);
    expect(battle.gold.friendly).toBeCloseTo(expected,8);
    expect(battle.gold.enemy).toBeCloseTo(expected,8);
    observations.push({second,player:+battle.gold.friendly.toFixed(2),bot:+battle.gold.enemy.toFixed(2)});
    if(second<8)for(let frame=0;frame<100;frame++){
      battle.step(0.01);
      expect(battle.gold.friendly).toBe(battle.gold.enemy);
    }
  }
  expect(attempts).toBeGreaterThan(0);expect(battle.units).toEqual([]);
  expect(battle.cooldowns.friendly).toEqual(battle.cooldowns.enemy);
  console.log(JSON.stringify({audit:'no spending',observations}));
});

test('model: lower Bot balance is fully explained by paid summons before either pool hits cap', () => {
  const battle=new Battle();battle.start();let spent=0;
  const summon=battle.summon.bind(battle);
  battle.summon=(side,slot)=>{
    const accepted=summon(side,slot);
    if(accepted&&side==='enemy')spent+=TEMP_R1D_UNITS[DEFAULT_LOADOUT[slot]].cost;
    return accepted;
  };
  advance(battle,4);
  expect(spent).toBeGreaterThan(0);
  expect(battle.gold.friendly).toBeCloseTo(120,8);
  expect(battle.gold.enemy).toBeCloseTo(120-spent,8);
  expect(battle.gold.friendly-battle.gold.enemy).toBeCloseTo(spent,8);
  console.log(JSON.stringify({audit:'equal 20 income, Bot spending',player:+battle.gold.friendly.toFixed(2),bot:+battle.gold.enemy.toFixed(2),botSpent:spent}));
});

test('model: same-tick lethal opponents both hit regardless of ID or array order', () => {
  for(const swapIds of [false,true])for(const reverse of [false,true]){
    const player=unit('sword','friendly',swapIds?200:100,466);
    const bot=unit('sword','enemy',swapIds?100:200,494);
    player.hp=bot.hp=player.damage;
    const battle=arena(...(reverse?[bot,player]:[player,bot]));
    battle.step(0.02);
    expect([player.hp,bot.hp]).toEqual([0,0]);
    expect(battle.units).toEqual([]);
    expect(battle.phase).toBe('running'); // Losing all troops alone does not end the match.
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
});

test('model: mirrored formation/targeting/combat ignores side and iteration order', () => {
  const flip=(u:Unit):Unit=>({...u,side:u.side==='friendly'?'enemy':'friendly',x:DEMO.width-u.x});
  const players=UNIT_KINDS.map((kind,i)=>unit(kind,'friendly',100+i,410-i*12));
  const setup=[...players,...players.map(u=>({...flip(u),id:u.id+10}))];
  const a=arena(...setup.map(u=>({...u})));
  const b=arena(...setup.map(flip).reverse());
  for(const battle of [a,b])battle.cooldowns.friendly.fill(9999);
  for(let frame=0;frame<250;frame++){
    a.step(0.02);b.step(0.02);
    expect(a.playerHp).toBe(b.enemyHp);expect(a.enemyHp).toBe(b.playerHp);
    expect(a.gold.friendly).toBe(b.gold.enemy);expect(a.gold.enemy).toBe(b.gold.friendly);
    expect(a.units.map(u=>u.id).sort()).toEqual(b.units.map(u=>u.id).sort());
    for(const u of a.units){
      const other=b.units.find(v=>v.id===u.id)!;
      expect(u.x+other.x).toBeCloseTo(DEMO.width,8);
      expect(u.hp).toBe(other.hp);expect(u.attackIn).toBeCloseTo(other.attackIn,8);
    }
  }
});

test('model: a Bot summon and matching Player input start moving next step with equal CD/Gold', () => {
  const battle=new Battle();battle.start();advance(battle,0.75);
  expect(battle.units).toHaveLength(1);
  const bot=battle.units[0];expect(bot.kind).toBe('shield');expect(bot.x).toBe(836);
  expect(battle.summon('friendly',2)).toBe(true);
  const player=battle.units.find(u=>u.side==='friendly')!;
  expect(player.x+bot.x).toBe(DEMO.width);
  expect(player.attackIn).toBe(bot.attackIn);
  expect(battle.cooldowns.friendly).toEqual(battle.cooldowns.enemy);
  expect(battle.gold.friendly).toBeCloseTo(battle.gold.enemy,8);
  battle.step(0.02);
  expect(player.x+bot.x).toBeCloseTo(DEMO.width,8);
  expect(battle.cooldowns.friendly).toEqual(battle.cooldowns.enemy);
});

test('model: impossible crossed armies or destroyed bases raise an invariant error, never a winner', () => {
  for(const reverse of [false,true]){
    // This was the old double-base fixture: the armies have already passed through each other.
    const player=unit('sword','friendly',reverse?200:100,DEMO.enemyBaseX-28);
    const bot=unit('sword','enemy',reverse?100:200,DEMO.playerBaseX+28);
    const battle=arena(...(reverse?[bot,player]:[player,bot]));
    const before=JSON.stringify(battle);
    expect(()=>battle.step(0.02)).toThrow('opposing units crossed');
    expect(JSON.stringify(battle)).toBe(before);
    expect(battle.phase).toBe('running');expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
  const corrupted=new Battle();corrupted.start();corrupted.playerHp=corrupted.enemyHp=0;
  const before=JSON.stringify(corrupted);
  expect(()=>corrupted.step(0.02)).toThrow('both bases destroyed');
  expect(JSON.stringify(corrupted)).toBe(before);expect(corrupted.phase).toBe('running');
  for(const x of [DEMO.playerBaseX,DEMO.enemyBaseX+1,NaN]){
    const outside=arena(unit('sword','friendly',100,x));
    expect(()=>outside.step(0.02)).toThrow('unit outside lane');
    expect(outside.hits).toBe(0);expect([outside.playerHp,outside.enemyHp]).toEqual([240,240]);
  }
});

test('model: five paired paid deployments meet and mutually die before damaging either base', () => {
  for(let slot=0;slot<DEFAULT_LOADOUT.length;slot++){
    const battle=new Battle();battle.start();
    expect(battle.summon('friendly',slot)).toBe(true);expect(battle.summon('enemy',slot)).toBe(true);
    // Control future input only; keep actual profiles, spawn, economy and combat unchanged.
    battle.summon=()=>false;
    for(let frame=0;frame<1000&&battle.units.length;frame++){
      battle.step(0.05);
      assert.equal(battle.playerHp,240);assert.equal(battle.enemyHp,240);
      const player=battle.units.find(u=>u.side==='friendly'),bot=battle.units.find(u=>u.side==='enemy');
      if(player&&bot)assert.ok(player.x<=bot.x);
    }
    expect(battle.units).toEqual([]);expect(battle.phase).toBe('running');
  }
});

test('playtest: valid seeded inputs preserve lane order and block base hits through a living opponent', () => {
  let states=0,matches=0,baseDamageSteps=0,maxSeconds=0;
  const outcomes:Record<string,number>={};
  const ordered=(battle:Battle)=>{
    let front=-Infinity,rear=Infinity;
    for(const u of battle.units){
      if(u.hp<=0)continue;
      assert.ok(u.x>=124-1e-7&&u.x<=836+1e-7,'Unit escaped the spawn-bounded lane');
      if(u.side==='friendly')front=Math.max(front,u.x);else rear=Math.min(rear,u.x);
    }
    assert.ok(front<=rear+1e-7,'Opposing troops crossed');
    assert.ok(!(battle.playerHp<=0&&battle.enemyHp<=0),'Both bases destroyed');states++;
  };
  for(const omitted of UNIT_KINDS)for(const dt of [1/20,1/30,1/60,1/100,0.2])for(let seed=1;seed<=20;seed++){
    let state=seed>>>0;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const battle=new Battle();battle.setLoadout(UNIT_KINDS.filter(kind=>kind!==omitted));battle.start();let next=0;ordered(battle);
    for(let frame=0;frame<Math.ceil(360/Math.min(dt,0.05))&&battle.phase==='running';frame++){
      if(battle.elapsed+1e-7>=next){
        battle.summon('friendly',Math.floor(random()*5));ordered(battle);
        next+=0.06+random()*0.45;
      }
      const playerHp=battle.playerHp,enemyHp=battle.enemyHp;
      const hadPlayer=battle.units.some(u=>u.hp>0&&u.side==='friendly');
      const hadBot=battle.units.some(u=>u.hp>0&&u.side==='enemy');
      battle.step(dt);ordered(battle);
      if(battle.playerHp!==playerHp||battle.enemyHp!==enemyHp){
        assert.ok(!(hadPlayer&&hadBot),'A base was hit through a living opposing army');baseDamageSteps++;
      }
    }
    expect(battle.phase).not.toBe('running');
    outcomes[battle.phase]=(outcomes[battle.phase]??0)+1;matches++;maxSeconds=Math.max(maxSeconds,battle.elapsed);
  }
  console.log(JSON.stringify({audit:'valid lane invariant',matches,states,baseDamageSteps,outcomes,maxSeconds:+maxSeconds.toFixed(2),decks:6,seeds:'1..20',frameSteps:[1/20,1/30,1/60,1/100,0.2]}));
});

test('model: reversed enemy arrays and equal-distance ties select the nearest lowest ID', () => {
  for (const reverse of [false, true]) {
    const ally = unit('sword', 'friendly', 100, 300);
    const near = unit('shield', 'enemy', 20, 328);
    const tied = unit('shield', 'enemy', 30, 328);
    const far = unit('shield', 'enemy', 10, 390);
    const dead = unit('shield', 'enemy', 1, 310);
    const friend = unit('shield', 'friendly', 90, 270);
    const units = [ally, far, tied, near, dead, friend];
    for (const u of units) { u.speed = 0; if (u !== ally) u.attackIn = 999; }
    dead.hp = 0;
    const battle = arena(...(reverse ? units.reverse() : units));
    battle.step(0.01);
    expect(near.hp).toBe(near.maxHp - ally.damage);
    for (const untouched of [tied, far, friend]) expect(untouched.hp).toBe(untouched.maxHp);
    expect(battle.enemyHp).toBe(DEMO.baseHp);
    expect(battle.units).not.toContain(dead);
  }
});

test('model: an in-range enemy blocks base damage for the entire attack step', () => {
  const ally = unit('spear', 'friendly', 100, 600);
  ally.speed = 0;
  const battle = arena(ally);
  battle.step(0.01);
  expect(battle.enemyHp).toBe(DEMO.baseHp);
  ally.x = DEMO.enemyBaseX - ally.attackRange;
  const blocker = unit('shield', 'enemy', 200, DEMO.enemyBaseX - DEMO.spawnOffset);
  blocker.speed = 0; blocker.attackIn = 999; blocker.hp = 1;
  battle.units = [ally, blocker];
  battle.step(0.01);
  expect(blocker.hp).toBe(0);
  expect(battle.units).not.toContain(blocker);
  expect(battle.enemyHp).toBe(DEMO.baseHp);
  ally.speed=TEMP_R1D_UNITS.spear.speed; // Resume approach after the blocker dies; kiting may have moved us back.
  advance(battle, 0.91);
  expect(battle.enemyHp).toBe(DEMO.baseHp - ally.damage);
});

test('model: spear supports a shield at 58 distance; melee cannot, and damage is single-target', () => {
  for (const side of ['friendly', 'enemy'] as const) {
    const direction = side === 'friendly' ? 1 : -1;
    for (const kind of ['spear', 'sword'] as const) {
      const tank = unit('shield', side, 100, 400);
      const support = unit(kind, side, 101, 400 - direction * TEMP_R1D.supportOffset);
      const target = unit('shield', side === 'friendly' ? 'enemy' : 'friendly', 200, 400 + direction * 28);
      const farther = { ...target, id: 201, x: target.x + direction * 24 };
      for (const u of [tank, support, target, farther]) { u.speed = 0; if (u !== support) u.attackIn = 999; }
      const battle = arena(farther, support, target, tank);
      battle.step(0.01);
      expect(target.hp).toBe(target.maxHp - (kind === 'spear' ? support.damage : 0));
      expect(farther.hp).toBe(farther.maxHp);
      expect(Math.abs(tank.x - support.x)).toBe(TEMP_R1D.supportOffset);
    }
  }
  const spear = unit('spear', 'friendly', 100, 300);
  const target = unit('shield', 'enemy', 200, 359);
  spear.speed = target.speed = 0; target.attackIn = 999;
  arena(spear, target).step(0.01);
  expect(target.hp).toBe(target.maxHp); // 59 > 58.
});

test('model: attack cadence carries frame fractions consistently at 20, 60 and 100 FPS', () => {
  for (const kind of ['sword', 'gladiator', 'spear'] as const) {
    const hits: number[] = [];
    for (const dt of [1 / 20, 1 / 60, 1 / 100]) {
      const ally = unit(kind, 'friendly', 100, 300);
      const target = unit('shield', 'enemy', 200, 328);
      ally.speed = target.speed = 0;
      target.hp = target.maxHp = 100000;
      target.attackIn = 999;
      const battle = arena(ally, target);
      advance(battle, 3.2, dt);
      hits.push((target.maxHp - target.hp) / ally.damage);
    }
    expect(new Set(hits).size).toBe(1);
    expect(hits[0]).toBe(Math.ceil(3.2 / TEMP_R1D_UNITS[kind].attackInterval));
  }
});



test('model: overlapping melee including an axe hit while their shield is alive, on either side', () => {
  for (const side of ['friendly','enemy'] as const) {
    const d=side==='friendly'?1:-1;
    const shield=unit('shield',side,100,400);
    const axe=unit('axe',side,101,400);
    const sword=unit('sword',side,102,400);
    const target=unit('shield',side==='friendly'?'enemy':'friendly',200,400+d*28);
    target.hp=target.maxHp=1000; target.attackIn=999;
    for (const u of [shield,axe,sword,target]) u.speed=0;
    const battle=arena(shield,axe,sword,target); battle.step(0.01);
    expect(target.hp).toBe(1000-shield.damage-sword.damage);
    advance(battle,0.6);
    expect(target.hp).toBe(1000-shield.damage-sword.damage-axe.damage);
    expect(shield.hp).toBe(shield.maxHp);
    expect(axe.x).toBe(shield.x);
  }
});

test('model: faster melee can pass allied melee instead of retaining a mandatory gap', () => {
  for (const side of ['friendly','enemy'] as const) {
    const d=side==='friendly'?1:-1;
    const shield=unit('shield',side,100,side==='friendly'?300:600);
    const fast=unit('gladiator',side,101,shield.x-d*24);
    const initial=shield.x;
    const battle=arena(shield,fast); advance(battle,1);
    expect((fast.x-shield.x)*d).toBeGreaterThan(0);
    expect((shield.x-initial)*d).toBeCloseTo(shield.speed);
  }
});

test('model: overlapping spears support melee at offset 30 and both hit a single nearest enemy', () => {
  for (const side of ['friendly','enemy'] as const) {
    const d=side==='friendly'?1:-1;
    const shield=unit('shield',side,100,400);
    const a=unit('spear',side,101,400-d*TEMP_R1D.supportOffset);
    const b={...a,id:102};
    const target=unit('shield',side==='friendly'?'enemy':'friendly',200,400+d*28);
    const far={...target,id:201,x:target.x+d*10};
    for (const u of [shield,a,b,target,far]) {u.speed=0;if(u!==a&&u!==b)u.attackIn=999;}
    const battle=arena(shield,a,b,target,far); battle.step(0.01);
    expect(a.x).toBe(b.x);
    expect((shield.x-a.x)*d).toBe(TEMP_R1D.supportOffset);
    expect(target.hp).toBe(target.maxHp-a.damage-b.damage);
    expect(far.hp).toBe(far.maxHp);
  }
});

test('model: spear-only advances and attacks; arriving melee restores rear support smoothly', () => {
  for (const side of ['friendly','enemy'] as const) {
    const d=side==='friendly'?1:-1;
    const spear=unit('spear',side,100,side==='friendly'?300:600);
    const target=unit('shield',side==='friendly'?'enemy':'friendly',200,spear.x+d*180);
    target.speed=0; target.attackIn=999; target.hp=target.maxHp=100000;
    const battle=arena(spear,target);
    const start=spear.x; advance(battle,2);
    expect((spear.x-start)*d).toBeGreaterThan(0);
    expect(target.hp).toBeLessThan(target.maxHp);
    const melee=unit('shield',side,101,spear.x-d*50);
    battle.units.push(melee);
    for(let i=0;i<125;i++){
      const previous=spear.x; battle.step(0.02);
      expect(Math.abs(spear.x-previous)).toBeLessThanOrEqual(spear.speed*0.02+1e-7);
    }
    // The support offset is a minimum; a spear already in range can stop earlier.
    expect((melee.x-spear.x)*d).toBeGreaterThanOrEqual(TEMP_R1D.supportOffset-1e-7);
    expect((melee.x-spear.x)*d).toBeLessThanOrEqual(spear.attackRange-melee.attackRange+1e-7);
    expect((target.x-melee.x)*d).toBeGreaterThanOrEqual(melee.attackRange-1e-7);
  }
});

test('model: opposing blockers prevent either team from walking through to damage the base', () => {
  for (const side of ['friendly','enemy'] as const) {
    const d=side==='friendly'?1:-1;
    const front=unit('axe',side,100,side==='friendly'?600:360);
    const support=unit('spear',side,101,front.x-d*24);
    const blocker=unit('shield',side==='friendly'?'enemy':'friendly',200,front.x+d*60);
    blocker.speed=0;blocker.attackIn=999;blocker.hp=blocker.maxHp=100000;
    const battle=arena(front,support,blocker); advance(battle,5);
    expect((blocker.x-front.x)*d).toBeGreaterThanOrEqual(front.attackRange-1e-7);
    expect((blocker.x-support.x)*d).toBeGreaterThan(0);
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
});

test('model: summons can overlap at the gate and defend in front of a base attacker', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1;
    const base=side==='friendly'?DEMO.playerBaseX:DEMO.enemyBaseX;
    const attacker=unit('shield',side==='friendly'?'enemy':'friendly',100,base+d*28);
    const battle=arena(attacker);
    battle.cooldowns[side].fill(0);
    expect(battle.summon(side,2)).toBe(true);
    expect(battle.summon(side,1)).toBe(true);
    const spawned=battle.units.filter(u=>u.side===side);
    expect(spawned).toHaveLength(2);
    expect(spawned[0].x).toBe(spawned[1].x);
    expect((attacker.x-spawned[0].x)*d).toBeGreaterThan(0);
    battle.step(0.01);
    expect(attacker.hp).toBeLessThan(attacker.maxHp);
  }
});

test('model: bot reacts to missing frontline, durable contact, support opportunity and cheap emergency', () => {
  const scenarios=[
    {own:[] as Unit[],foes:[] as Unit[],gold:100,expected:'shield'},
    {own:[unit('shield','enemy',100,500)],foes:[unit('shield','friendly',200,472)],gold:100,expected:'axe'},
    {own:[unit('shield','enemy',100,500)],foes:[unit('sword','friendly',200,472)],gold:100,expected:'spear'},
    {own:[] as Unit[],foes:[unit('axe','friendly',200,750)],gold:20,expected:'gladiator'},
    {own:[unit('shield','enemy',100,600)],foes:[unit('sword','friendly',200,400)],gold:100,expected:'sword'},
  ];
  for(const scenario of scenarios){
    const battle=new Battle(); battle.start();
    battle.units=[...scenario.own,...scenario.foes];
    for(const u of battle.units){u.speed=0;u.attackIn=999;}
    battle.gold.enemy=scenario.gold;
    advance(battle,TEMP_R1C.botDecisionSeconds);
    expect(DEFAULT_LOADOUT[battle.botChoice!.slot]).toBe(scenario.expected);
    const spawned=battle.units.find(u=>u.id<100)!;
    expect(spawned.kind).toBe(scenario.expected);
    expect(battle.cooldowns.enemy[battle.botChoice!.slot]).toBeGreaterThan(0);
    expect(battle.gold.enemy).toBeCloseTo(scenario.gold+5*0.75-TEMP_R1D_UNITS[spawned.kind].cost);
  }
});

test('model: bot waits with no funds/CD or when an unopposed raiding frontline needs no spending', () => {
  for(const mode of ['funds','cooldowns','raid','reserve']){
    const battle=new Battle();battle.start();
    if(mode==='funds')battle.gold.enemy=0;
    if(mode==='cooldowns')battle.cooldowns.enemy.fill(99);
    if(mode==='raid')battle.units=[unit('shield','enemy',100,450)];
    if(mode==='reserve'){
      battle.units=[unit('shield','enemy',100,500),unit('sword','friendly',200,472)];
      for(const u of battle.units){u.speed=0;u.attackIn=999;}
      battle.gold.enemy=20; // Can afford Gladiator, but safely saves for useful support.
    }
    const initial=battle.units.length;advance(battle,0.75);
    expect(battle.botChoice).toBeUndefined();
    expect(battle.units).toHaveLength(initial);
  }
});

test('model: game over freezes both economies and AI; restart resets field, decisions and cadence', () => {
  const attacker=unit('sword','friendly',100,DEMO.enemyBaseX-28);
  const battle=arena(attacker);
  battle.enemyHp=1;battle.step(0.01);
  expect(battle.phase).toBe('won');
  const frozen=JSON.stringify(battle);
  advance(battle,30);
  expect(battle.summon('enemy',0)).toBe(false);
  expect(battle.summon('friendly',0)).toBe(false);
  expect(JSON.stringify(battle)).toBe(frozen);
  battle.start();
  expect(battle.gold).toEqual({friendly:100,enemy:100});
  expect(battle.cooldowns).toEqual({friendly:[0,0,0,0,0],enemy:[0,0,0,0,0]});
  expect([battle.playerHp,battle.enemyHp,battle.elapsed,battle.hits]).toEqual([240,240,0,0]);
  expect(battle.units).toEqual([]);
  expect(battle.botChoice).toBeUndefined();
  advance(battle,0.74);expect(battle.units).toEqual([]);
  advance(battle,0.01);expect(battle.units).toHaveLength(1);
  const foe=battle.units[0];foe.x=DEMO.playerBaseX+28;
  battle.playerHp=1;battle.step(0.01);
  expect(battle.phase).toBe('lost');
  const lost=JSON.stringify(battle);advance(battle,30);
  expect(JSON.stringify(battle)).toBe(lost);
});

test('model: invalid delta is inert and a long background interval never catches up bot/income/combat', () => {
  const battle=new Battle();battle.start();
  const before=JSON.stringify(battle);
  for(const dt of [0,-1,NaN,Infinity])battle.step(dt);
  expect(JSON.stringify(battle)).toBe(before);
  battle.step(600);
  expect(battle.elapsed).toBe(0.05);
  expect(battle.gold.friendly).toBeCloseTo(100.25);
  expect(battle.gold.enemy).toBeCloseTo(100.25);
  expect(battle.units).toEqual([]);
});

test('playtest: paid bot continues past 18 seconds; deterministic strategies include victory and defeat', () => {
  const cases=[
    {name:'none',order:[],expected:'lost'},
    {name:'single sword',order:[0],limit:1,expected:'lost'},
    {name:'sword reinforcements',order:[0],expected:'lost'},
    {name:'shield-spear mixed',order:[2,4,1,0,3],expected:'won'},
    {name:'axe-spear mixed',order:[1,4,0,3,2],expected:'lost'},
    {name:'shield-axe mixed',order:[2,1,3,0,4],expected:'lost'},
    {name:'shield-sword mixed',order:[2,0,4,3,1],expected:'lost'},
    {name:'spear only',order:[4],expected:'lost'},
    {name:'shield-axe-spear mixed',order:[2,1,4,0,3],expected:'won'},
    {name:'spear-first mixed',order:[4,3,2,0,1],expected:'won'},
    {name:'hammer only',deck:['sword','axe','shield','spear','hammer'] as UnitKind[],order:[4],expected:'lost'},
    {name:'hammer mixed',deck:['sword','axe','shield','spear','hammer'] as UnitKind[],order:[2,4,3,0,1],expected:'won'},
  ];
  for(const scenario of cases){
    const battle=new Battle();if(scenario.deck)battle.setLoadout(scenario.deck);battle.start();
    let cursor=0,spent=0,botSpent=0,nextInput=0;
    const botActions:{kind:UnitKind;at:number}[]=[];
    const summon=battle.summon.bind(battle);
    battle.summon=(side,slot)=>{
      const before=battle.gold[side];
      const eligible=battle.canSummon(side,slot);
      const result=summon(side,slot);
      assert.equal(result,eligible);
      if(result&&side==='enemy'){
        const kind=battle.loadout[slot],p=TEMP_R1D_UNITS[kind];
        assert.ok(Math.abs(battle.gold.enemy-(before-p.cost))<1e-7);
        assert.equal(battle.cooldowns.enemy[slot],p.cooldown);
        botSpent+=p.cost;botActions.push({kind,at:battle.elapsed});
      }
      return result;
    };
    for(let frame=0;frame<6000&&battle.phase==='running';frame++){
      assert.ok(battle.playerHp>0&&battle.enemyHp>0,'Running match has a destroyed base');
      if(battle.elapsed+1e-7>=nextInput){
        const slot=scenario.order[cursor%scenario.order.length];
        if(slot!==undefined&&cursor<(scenario.limit??Infinity)&&battle.summon('friendly',slot)){
          cursor++;spent+=TEMP_R1D_UNITS[battle.loadout[slot]].cost;
        }
        nextInput+=0.1;
      }
      const previousGold=battle.gold.enemy,previousSpent=botSpent;
      battle.step(0.02);
      const expectedGold=Math.min(125,previousGold+0.1)-(botSpent-previousSpent);
      assert.ok(Math.abs(battle.gold.enemy-expectedGold)<1e-7,'Bot budget ledger mismatch');
      assert.ok(battle.gold.enemy>=0);
      assert.ok(battle.cooldowns.enemy.every(cd=>cd>=0));
    }
    expect(battle.phase).toBe(scenario.expected);
    expect(scenario.expected==='won'?battle.enemyHp:battle.playerHp).toBe(0);
    expect(scenario.expected==='won'?battle.playerHp:battle.enemyHp).toBeGreaterThan(0);
    const finished=JSON.stringify(battle);advance(battle,2);
    expect(JSON.stringify(battle)).toBe(finished);
    expect(new Set(botActions.map(a=>a.kind)).size).toBeGreaterThanOrEqual(3);
    if(scenario.name==='hammer mixed'){
      expect(botActions.some(a=>a.at>18)).toBe(true);
      expect(botActions.some(a=>a.kind==='hammer')).toBe(true);
    }
    console.log(JSON.stringify({strategy:scenario.name,result:battle.phase,seconds:+battle.elapsed.toFixed(2),playerHp:battle.playerHp,enemyHp:battle.enemyHp,summons:cursor,spent,botSummons:botActions.length,botSpent,botKinds:[...new Set(botActions.map(a=>a.kind))],lastBotAt:+botActions.at(-1)!.at.toFixed(2)}));
  }
});

test('playtest: a valid mixed strategy can win with 100ms inputs at 20, 30 and 60 FPS',()=>{
  for(const dt of [1/20,1/30,1/60]){
    const battle=new Battle();battle.start();const order=[2,4,1,0,3];let cursor=0,nextInput=0;
    while(battle.phase==='running'&&battle.elapsed<90){
      if(battle.elapsed+1e-7>=nextInput){
        if(battle.summon('friendly',order[cursor%order.length]))cursor++;
        nextInput+=0.1;
      }
      battle.step(dt);
    }
    expect(battle.phase).toBe('won');
    expect(battle.botChoice!.at).toBeGreaterThan(18);
  }
});

test('model: Axe windup starts on contact, repeats at 1.2s, and never banks during travel or chase', () => {
  for (const dt of [0.05,1/60,0.01]) {
    const axe=unit('axe','friendly',100,300),target=unit('shield','enemy',200,700);
    target.speed=0;target.attackIn=999;target.hp=target.maxHp=100000;
    const battle=arena(axe,target);advance(battle,2,dt);
    expect(axe.engaged).toBe(false);expect(target.hp).toBe(100000);
    target.x=axe.x+28;axe.speed=0;
    battle.step(dt);const contact=battle.elapsed;
    expect(target.hp).toBe(100000);
    const times:number[]=[];
    for(let frame=0;frame<Math.ceil(3.1/dt);frame++){
      const hp=target.hp;battle.step(dt);
      if(target.hp<hp)times.push(battle.elapsed);
    }
    expect(times).toHaveLength(3);
    expect(times[0]-contact).toBeGreaterThanOrEqual(0.6-1e-7);
    expect(times[0]-contact).toBeLessThanOrEqual(0.6+dt+1e-7);
    for(let i=1;i<times.length;i++)expect(times[i]-times[i-1]).toBeCloseTo(1.2,6);
    // A different victim already in range inherits the current interval.
    target.hp=0;const next={...target,id:201,hp:100000,maxHp:100000};battle.units.push(next);
    battle.step(dt);expect(next.hp).toBe(100000);
    // After a long chase, a fresh windup is required; no ready attack is banked.
    next.x=axe.x+80;advance(battle,2,dt);expect(axe.engaged).toBe(false);
    next.x=axe.x+28;battle.step(dt);const recontact=battle.elapsed;
    while(battle.elapsed-recontact<0.6-dt-1e-7){battle.step(dt);expect(next.hp).toBe(100000);}
    while(next.hp===100000)battle.step(dt);
    expect(battle.elapsed-recontact).toBeGreaterThanOrEqual(0.6-1e-7);
    expect(battle.elapsed-recontact).toBeLessThanOrEqual(0.6+dt+1e-7);
  }
});

test('model: Axe handoff preserves partial windup and repeat timer, including ready on switch', () => {
  for(const side of ['friendly','enemy'] as const)for(const switchAt of [0.31,0.60,0.91]){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly';
    const axe=unit('axe',side,100,480),old=unit('shield',opponent,200,480+d*28);
    const next={...old,id:201,hp:10000,maxHp:10000};
    for(const u of [axe,old,next]){u.speed=0;if(u!==axe)u.attackIn=999;}
    const battle=arena(next,axe,old);advance(battle,switchAt);
    const remaining=axe.attackIn;old.hp=0;
    battle.step(0.01);
    expect(axe.attackIn).toBeCloseTo(remaining-0.01+(switchAt===0.60?1.2:0),8);
    if(switchAt===0.60)expect(next.hp).toBe(10000-26);
    else expect(next.hp).toBe(10000);
    while(next.hp===10000&&battle.elapsed<3)battle.step(0.01);
    expect(battle.elapsed).toBeCloseTo(switchAt<0.61?0.61:1.81,8);
  }
});

test('model: Axe brief disengagement cannot create two actual hits less than 1.2s apart', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly';
    const axe=unit('axe',side,100,480),target=unit('shield',opponent,200,480+d*28);
    axe.speed=target.speed=0;target.attackIn=999;target.hp=target.maxHp=10000;
    const battle=arena(axe,target);advance(battle,0.61);expect(target.hp).toBe(9974);
    const first=battle.elapsed;target.x=480+d*80;battle.step(0.01);
    target.x=480+d*28;battle.step(0.01);const recontact=battle.elapsed;
    while(target.hp===9974&&battle.elapsed<3)battle.step(0.01);
    expect(battle.elapsed-first).toBeGreaterThanOrEqual(1.2-1e-7);
    expect(battle.elapsed-recontact).toBeGreaterThanOrEqual(0.6-1e-7);
  }
});

test('model: Spear formation retreat stops at 30 and ignores distant allies when no threat is present', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1;
    const spear=unit('spear',side,100,480),front=unit('shield',side,101,480);
    front.speed=0;const battle=arena(spear,front);
    battle.step(0.05);expect((480-spear.x)*d).toBeCloseTo(48*0.05,8);
    advance(battle,1);expect((front.x-spear.x)*d).toBeCloseTo(30,8);
    const stopped=spear.x;advance(battle,1);expect(spear.x).toBeCloseTo(stopped,8);
    battle.units=[spear];front.x=spear.x-d*150;battle.units.push(front);
    const before=spear.x;battle.step(0.05);expect((spear.x-before)*d).toBeCloseTo(85*0.05,8);
  }
});

test('model: solo Spear kites and fires at 48; all four melee pursuers hit before the lane boundary', () => {
  for(const kind of ['gladiator','sword','axe','shield'] as const)for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1;
    const spear=unit('spear',side,100,480-d*70);
    const foe=unit(kind,side==='friendly'?'enemy':'friendly',200,480+d*70);
    const battle=arena(spear,foe);let retreats=0,firedWhileRetreating=false,firstHitX:number|undefined;
    for(let f=0;f<3000&&spear.hp>0&&foe.hp>0;f++){
      const previous=spear.x,foeHp=foe.hp,hp=spear.hp;battle.step(0.01);
      const backward=(previous-spear.x)*d;
      if(backward>1e-7){retreats++;expect(backward).toBeLessThanOrEqual(48*0.01+1e-7);if(foe.hp<foeHp)firedWhileRetreating=true;}
      if(spear.hp<hp&&firstHitX===undefined)firstHitX=spear.x;
    }
    expect(retreats).toBeGreaterThan(0);expect(firedWhileRetreating).toBe(true);
    expect(spear.hp).toBeLessThan(spear.maxHp);
    expect(firstHitX).toBeDefined();expect((firstHitX!-(side==='friendly'?124:836))*d).toBeGreaterThan(20);
    expect(spear.hp===0||foe.hp===0).toBe(true);
    console.log(JSON.stringify({chase:kind,side,firstHitX:+firstHitX!.toFixed(2),seconds:+battle.elapsed.toFixed(2),spearHp:spear.hp,foeHp:foe.hp}));
  }
});

test('model: Warhammer delayed spatial AOE hits every eligible unit in clusters of 1, 2, 3, 4 and 7', () => {
  for(const count of [1,2,3,4,7])for(const reverse of [false,true])for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly';
    const hammer=unit('hammer',side,100,480);
    const primary=unit('shield',opponent,200,480+d*28);
    const secondary=Array.from({length:count-1},(_,i)=>({...primary,id:201+i,x:primary.x+d*10}));
    const dead={...primary,id:1,hp:0},ally=unit('shield',side,99,480);
    const units=[hammer,primary,...secondary,dead,ally];
    for(const u of units){u.speed=0;if(u!==hammer)u.attackIn=999;}
    const battle=arena(...(reverse?units.reverse():units));battle.step(0.01);
    advance(battle,0.89);expect(primary.hp).toBe(150);
    advance(battle,0.01);expect(primary.hp).toBe(124);
    expect(secondary.every(u=>u.hp===140)).toBe(true);
    expect(ally.hp).toBe(150);expect(dead.hp).toBe(0);
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
    advance(battle,1.79);expect(primary.hp).toBe(124);
    advance(battle,0.01);expect(primary.hp).toBe(98);
    expect(secondary.every(u=>u.hp===130)).toBe(true);
  }
});

test('model: Warhammer splash includes distance 40, excludes 40.001, and cannot splash a base', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly';
    const hammer=unit('hammer',side,100,480),primary=unit('shield',opponent,200,480+d*28);
    const edge={...primary,id:201,x:primary.x+d*40},outside={...primary,id:202,x:primary.x+d*40.001};
    for(const u of [hammer,primary,edge,outside]){u.speed=0;if(u!==hammer)u.attackIn=999;}
    const battle=arena(hammer,primary,edge,outside);advance(battle,0.91);
    expect([primary.hp,edge.hp,outside.hp]).toEqual([124,140,150]);
    const base=side==='friendly'?DEMO.enemyBaseX:DEMO.playerBaseX;
    hammer.x=base-d*28;hammer.engaged=false;hammer.attackIn=0;
    primary.x=base-d*14;primary.hp=150;battle.units=[hammer,primary];
    advance(battle,0.91);expect(primary.hp).toBe(124);
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
    battle.units=[hammer];advance(battle,1.8);
    expect(side==='friendly'?battle.enemyHp:battle.playerHp).toBe(214); // base primary only
  }
});

test('model: all six five-kind decks are valid, shared by both sides; invalid/mid-match changes are inert', () => {
  for(const omitted of UNIT_KINDS){
    const battle=new Battle(),deck=UNIT_KINDS.filter(kind=>kind!==omitted);
    expect(battle.setLoadout(deck)).toBe(true);expect(battle.loadout).toEqual(deck);
    deck.pop();expect(battle.loadout).toHaveLength(5); // caller cannot mutate the chosen deck
    const before=JSON.stringify(battle);
    for(const invalid of [[],UNIT_KINDS,['axe','axe','shield','spear','hammer'],['bad','axe','shield','spear','hammer']]){
      expect(battle.setLoadout(invalid as UnitKind[])).toBe(false);expect(JSON.stringify(battle)).toBe(before);
    }
    battle.start();const locked=JSON.stringify(battle);
    expect(battle.setLoadout(DEFAULT_LOADOUT)).toBe(false);expect(JSON.stringify(battle)).toBe(locked);
    for(let slot=0;slot<5;slot++)for(const side of ['friendly','enemy'] as const){
      battle.gold[side]=100;battle.cooldowns[side].fill(0);
      expect(battle.summon(side,slot)).toBe(true);
      const kind=battle.loadout[slot],p=TEMP_R1D_UNITS[kind];
      expect(battle.units.at(-1)).toMatchObject({kind,side,hp:p.hp,damage:p.damage});
      expect(battle.gold[side]).toBe(100-p.cost);expect(battle.cooldowns[side][slot]).toBe(p.cooldown);
    }
    const chosen=[...battle.loadout];battle.start();expect(battle.loadout).toEqual(chosen);
    battle.prepare();expect(battle.phase).toBe('ready');expect(battle.units).toEqual([]);
    expect(battle.gold).toEqual({friendly:100,enemy:100});expect(battle.loadout).toEqual(chosen);
  }
});

test('model: Bot buys permitted Warhammer for clustered contact only, through the shared Gold/CD gate', () => {
  for(const cluster of [false,true])for(const equipped of [false,true]){
    const battle=new Battle();
    if(equipped)battle.setLoadout(['sword','axe','shield','spear','hammer']);
    battle.start();battle.units=[unit('shield','enemy',100,500),unit('sword','friendly',200,472)];
    if(cluster)battle.units.push(unit('sword','friendly',201,470));
    for(const u of battle.units){u.speed=0;u.attackIn=999;}
    advance(battle,0.75);const choice=battle.loadout[battle.botChoice!.slot];
    expect(choice==='hammer').toBe(cluster&&equipped);
    const p=TEMP_R1D_UNITS[choice];expect(battle.gold.enemy).toBeCloseTo(103.75-p.cost,8);
    expect(battle.cooldowns.enemy[battle.botChoice!.slot]).toBe(p.cooldown);
    const previous=JSON.stringify(battle);
    expect(battle.summon('enemy',battle.botChoice!.slot)).toBe(false);expect(JSON.stringify(battle)).toBe(previous);
  }
});

test('model: mirrored Warhammer loses solo to Axe, but helps Sword clear a protected dense group', () => {
  const fight=(left:UnitKind[],right:UnitKind[],mirror=false)=>{
    const line=[...left.map((k,i)=>unit(k,'friendly',100+i,466)),...right.map((k,i)=>unit(k,'enemy',200+i,494))];
    const battle=arena(...(mirror?line.map(u=>({...u,side:u.side==='friendly'?'enemy':'friendly',x:960-u.x} as Unit)).reverse():line));
    for(let frame=0;frame<3000&&battle.units.some(u=>u.side==='friendly')&&battle.units.some(u=>u.side==='enemy');frame++)battle.step(0.01);
    return {seconds:+battle.elapsed.toFixed(2),units:battle.units.map(u=>({kind:u.kind,hp:u.hp,side:mirror?(u.side==='friendly'?'enemy':'friendly'):u.side})).sort((a,b)=>a.kind.localeCompare(b.kind))};
  };
  for(const mirror of [false,true]){
    const solo=fight(['hammer'],['axe'],mirror);
    expect(solo).toEqual({seconds:3.01,units:[{kind:'axe',hp:36,side:'enemy'}]});
    for(const count of [2,3]){
      const swarmed=fight(['hammer'],Array(count).fill('gladiator'),mirror);
      expect(swarmed.units.every(u=>u.side==='enemy')).toBe(true);
      expect(swarmed.seconds).toBeLessThan(2);
    }
    const group=['gladiator','gladiator','gladiator'] as UnitKind[];
    const hammer=fight(['shield','sword','hammer'],group,mirror),axe=fight(['shield','sword','axe'],group,mirror);
    expect(hammer.seconds).toBe(2.71);expect(axe.seconds).toBe(3.01);
    expect(hammer.units.every(u=>u.side==='friendly')).toBe(true);
    expect(hammer.units.find(u=>u.kind==='hammer')!.hp).toBe(72);
  }
});

test('model: Spear yields to arriving Shield while Axe pursues, then protected Spear can attack', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1;
    const spear=unit('spear',side,100,480),shield=unit('shield',side,101,480-d*40);
    const axe=unit('axe',side==='friendly'?'enemy':'friendly',200,480+d*80);
    const battle=arena(spear,shield,axe);let retreats=0;
    for(let frame=0;frame<600&&spear.hp>0&&axe.hp>0;frame++){
      const previous=spear.x;battle.step(0.01);
      const backward=(previous-spear.x)*d;
      if(backward>1e-7){retreats++;expect(backward).toBeLessThanOrEqual(48*0.01+1e-7);}
    }
    expect(retreats).toBeGreaterThan(0);expect(axe.hp).toBeLessThan(axe.maxHp);
    expect(shield.hp).toBeLessThan(shield.maxHp);
    expect(spear.hp===0||axe.hp===0).toBe(true);
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
});

test('model: Axe rapid target changes and uneven frames never grant an early repeat', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly';
    const axe=unit('axe',side,100,480);axe.speed=0;
    let target=unit('shield',opponent,200,480+d*28);target.speed=0;target.attackIn=999;target.hp=10000;
    const battle=arena(axe,target),times:number[]=[];
    for(let frame=0;battle.elapsed<5;frame++){
      if(frame%3===0){target.hp=0;target={...target,id:201+frame,hp:10000};battle.units.push(target);}
      const hp=target.hp;battle.step([0.013,0.027,0.041][frame%3]);
      if(target.hp<hp)times.push(battle.elapsed);
    }
    expect(times).toHaveLength(4);
    expect(times[0]).toBeGreaterThanOrEqual(0.6);
    for(let i=1;i<times.length;i++){
      expect(times[i]-times[i-1]).toBeGreaterThanOrEqual(1.2-1e-7);
      expect(times[i]-times[i-1]).toBeLessThan(1.25);
    }
  }
});

test('model: same-step allied kill does not retroactively retarget an Axe swing', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly';
    const axe=unit('axe',side,100,480),sword=unit('sword',side,99,480);
    const old=unit('shield',opponent,200,480+d*28),next={...old,id:201};old.hp=1;
    // Both swings are already ready at this fixture boundary; normal startup is tested separately.
    for(const u of [axe,sword,old,next]){u.speed=0;u.engaged=true;u.attackIn=u===axe||u===sword?0:999;}
    const battle=arena(next,axe,old,sword);battle.step(0.01);
    expect(old.hp).toBe(0);expect(next.hp).toBe(150);expect(axe.attackIn).toBeCloseTo(1.2);
    battle.step(0.01);expect(next.hp).toBe(150);
  }
});

test('model: Spear kite clamps at its own gate and opposing Spears settle without endless direction changes', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly',gate=side==='friendly'?124:836;
    const spear=unit('spear',side,100,gate),foe=unit('shield',opponent,200,gate+d*28);
    const battle=arena(spear,foe);
    for(let frame=0;frame<100;frame++){battle.step(0.01);expect((spear.x-gate)*d).toBeGreaterThanOrEqual(-1e-7);}
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
  for(const dt of [0.05,1/60,0.01]){
    const a=unit('spear','friendly',100,455),b=unit('spear','enemy',200,505),battle=arena(a,b);
    let retreatFrames=0;
    while(a.hp>0&&b.hp>0&&battle.elapsed<8){
      const x=a.x;battle.step(dt);expect(a.x-x).toBeLessThanOrEqual(1e-7);
      if(x-a.x>1e-7)retreatFrames++;
    }
    expect(retreatFrames).toBeLessThan(5);expect([a.hp,b.hp]).toEqual([0,0]);
    expect(battle.phase).toBe('running');expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
});

test('model: Warhammer needs a live in-range primary before starting windup or dealing any splash', () => {
  for(const side of ['friendly','enemy'] as const){
    const d=side==='friendly'?1:-1,opponent=side==='friendly'?'enemy':'friendly';
    const hammer=unit('hammer',side,100,480),dead=unit('shield',opponent,200,480+d*28);
    const far={...dead,id:201,x:480+d*100};dead.hp=0;
    hammer.speed=far.speed=0;far.attackIn=999;
    const battle=arena(hammer,dead,far);advance(battle,3);
    expect(hammer.engaged).toBe(false);expect(far.hp).toBe(150);expect(hammer.flash).toBe(0);
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
    far.x=480+d*28;battle.step(0.01);advance(battle,0.89);expect(far.hp).toBe(150);
    advance(battle,0.01);expect(far.hp).toBe(124);
  }
});

test('model: simultaneous lethal Warhammer swings keep both uncapped AOE snapshots despite array or ID order', () => {
  for(const swapIds of [false,true])for(const reverse of [false,true]){
    const a=unit('hammer','friendly',swapIds?200:100,466),b=unit('hammer','enemy',swapIds?100:200,494);
    a.hp=b.hp=1;const left=unit('shield','friendly',300,456),right=unit('shield','enemy',400,504);
    left.hp=right.hp=10;
    const units=[a,b,left,right];for(const u of units){u.speed=0;u.engaged=true;u.attackIn=u===a||u===b?0:999;}
    const battle=arena(...(reverse?units.reverse():units));battle.step(0.01);
    expect([a.hp,b.hp,left.hp,right.hp]).toEqual([0,0,0,0]);expect(battle.units).toEqual([]);
    expect(battle.phase).toBe('running');expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
  }
});

function observe(page: Page): string[] {
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('requestfailed',request=>errors.push('Failed request: '+new URL(request.url()).pathname));
  page.on('response',response=>{if(response.status()>=400)errors.push('HTTP '+response.status()+': '+new URL(response.url()).pathname);});
  page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4173/')&&!request.url().startsWith('data:'))errors.push('Unexpected external request');});
  return errors;
}

test.use({hasTouch:true});

test('production UI: two real economies, five player slots, five read-only bot slots and observable bot choices',async({page})=>{
  const errors=observe(page);await page.goto('./');
  const player=page.locator('#player-slots .slot'),bot=page.locator('#bot-slots .slot');
  await expect(page.locator('.build-tag')).toContainText('R1D');
  await expect(page.locator('#player-hp')).toHaveText('240 / 240');
  await expect(page.locator('#enemy-hp')).toHaveText('240 / 240');
  await expect(player).toHaveCount(5);await expect(bot).toHaveCount(5);
  await expect(page.locator('#gold')).toHaveText('100');
  await expect(page.locator('#bot-gold')).toHaveText('100');
  for(let i=0;i<5;i++){
    await expect(player.nth(i)).toHaveAttribute('data-unit-type',DEFAULT_LOADOUT[i]);
    await expect(bot.nth(i)).toHaveAttribute('data-unit-type',DEFAULT_LOADOUT[i]);
    await expect(bot.nth(i)).toBeDisabled();
    await bot.nth(i).dispatchEvent('click');
  }
  await bot.nth(0).scrollIntoViewIfNeeded();
  const rect=(await bot.nth(0).boundingBox())!;
  await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.locator('body').evaluate(body=>{body.tabIndex=-1;body.focus();});
  await bot.nth(0).evaluate(button=>button.focus());
  await expect(bot.nth(0)).not.toBeFocused();
  await page.keyboard.press('Enter');await page.keyboard.press('Space');
  await expect(page.locator('#bot-gold')).toHaveText('100');
  await expect(page.locator('#allies')).toHaveText('0');
  for(let i=0;i<5;i++){
    await page.locator('#start').click();await player.nth(i).click();
    await expect(page.locator('#allies')).toHaveText('1');
    await expect(player.nth(i)).toHaveAttribute('data-state','cooling');
    const balance=Number(await page.locator('#gold').textContent());
    expect(balance).toBeGreaterThanOrEqual(100-TEMP_R1D_UNITS[DEFAULT_LOADOUT[i]].cost);
    expect(balance).toBeLessThan(104-TEMP_R1D_UNITS[DEFAULT_LOADOUT[i]].cost);
  }
  await page.locator('#start').click();await player.nth(0).click();await player.nth(4).click();
  await expect(page.locator('#allies')).toHaveText('2');
  await expect(player.nth(0)).toHaveAttribute('data-state','cooling');
  await expect(player.nth(4)).toHaveAttribute('data-state','cooling');
  await player.nth(0).dispatchEvent('click');
  await expect(page.locator('#allies')).toHaveText('2');
  expect(Number(await page.locator('#gold').textContent())).toBeGreaterThanOrEqual(45);
  expect(Number(await page.locator('#gold').textContent())).toBeLessThan(50);
  await expect(page.locator('#bot-choice')).toContainText('Bot:',{timeout:3000});
  await expect(page.locator('#bot-slots .slot[data-state="cooling"]')).not.toHaveCount(0);
  expect(Number(await page.locator('#bot-gold').textContent())).toBeLessThan(100);
  await expect(page.locator('#bot-slots .bot-chosen')).toHaveCount(1);
  for(let i=0;i<5;i++)await expect(bot.nth(i)).toBeDisabled();
  await page.locator('#start').click();
  for(const i of [2,1,0])await player.nth(i).click();
  await expect(player.nth(3)).toHaveAttribute('data-state','insufficient');
  await player.nth(3).dispatchEvent('click');await expect(page.locator('#allies')).toHaveText('3');
  expect(errors).toEqual([]);
});

test('production subpath: selected Warhammer formation fights a continuing bot, wins and preserves deck on restart',async({page})=>{
  test.setTimeout(120000);
  const errors=observe(page);await page.goto('./');
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  await page.locator('#armory-choices [data-kind="gladiator"]').click();
  await page.locator('#armory-choices [data-kind="hammer"]').click();
  await page.locator('#start').click();
  const order=[2,3,4,0,1];let cursor=0,captured=false;
  const started=Date.now();
  while(await page.locator('#battle-status').getAttribute('data-phase')==='running'&&Date.now()-started<105000){
    const clicked=await page.locator('#player-slots .slot').nth(order[cursor%order.length])
      .evaluate(button=>{const b=button as HTMLButtonElement;if(b.disabled)return false;b.click();return true;});
    if(clicked)cursor++;
    if(!captured&&Date.now()-started>8000){
      await page.screenshot({path:'test-results/r1d-formation.png',fullPage:true});captured=true;
    }
    await page.waitForTimeout(100);
  }
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase','won');
  await expect(page.locator('#enemy-hp')).toHaveText('0 / 240');
  expect(Number(await page.locator('#hits').textContent())).toBeGreaterThan(0);
  for(const button of await page.locator('.slot').all())await expect(button).toBeDisabled();
  await page.locator('#start').click();
  await expect(page.locator('#gold')).toHaveText('100');await expect(page.locator('#bot-gold')).toHaveText('100');
  await expect(page.locator('#player-hp')).toHaveText('240 / 240');await expect(page.locator('#enemy-hp')).toHaveText('240 / 240');
  await expect(page.locator('#allies')).toHaveText('0');await expect(page.locator('#hits')).toHaveText('0');
  await expect(page.locator('#bot-choice')).toHaveText('Bot ch\u01b0a tri\u1ec7u h\u1ed3i.');
  for(let i=0;i<5;i++){
    await expect(page.locator('#player-slots .slot').nth(i)).toHaveAttribute('data-state','ready');
    await expect(page.locator('#bot-slots .slot').nth(i)).toHaveAttribute('data-state','ready');
    await expect(page.locator('#bot-slots .slot').nth(i)).toBeDisabled();
  }
  await expect(page.locator('#player-slots .slot').nth(4)).toHaveAttribute('data-unit-type','hammer');
  await expect(page.locator('#bot-slots .slot').nth(4)).toHaveAttribute('data-unit-type','hammer');
  expect(errors).toEqual([]);
});

test('production: armory keyboard/touch selection enforces five unique units, locks combat and returns to setup',async({page})=>{
  const errors=observe(page);await page.setViewportSize({width:390,height:844});await page.goto('./');
  const choices=page.locator('#armory-choices button');
  const hammer=page.locator('#armory-choices [data-kind="hammer"]');
  const gladiator=page.locator('#armory-choices [data-kind="gladiator"]');
  await expect(choices).toHaveCount(6);await expect(page.locator('#armory-choices [aria-pressed="true"]')).toHaveCount(5);
  await expect(hammer).toContainText('45 Vàng');
  await expect(hammer).toBeDisabled();await gladiator.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#selection-count')).toContainText('4/5');await expect(page.locator('#start')).toBeDisabled();
  await page.locator('#start').dispatchEvent('click');
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase','ready');
  await expect(page.locator('#gold')).toHaveText('100');await expect(page.locator('#bot-gold')).toHaveText('100');
  await hammer.tap();await expect(page.locator('#selection-count')).toContainText('5/5');
  const expected=['sword','axe','shield','spear','hammer'];
  for(const side of ['player','bot'])expect(await page.locator(`#${side}-slots .slot`).evaluateAll(buttons=>buttons.map(b=>(b as HTMLElement).dataset.unitType))).toEqual(expected);
  for(const side of ['player','bot'])await expect(page.locator(`#${side}-slots .slot`).nth(4).locator('.slot-price')).toContainText('45 Vàng');
  await expect(page.locator('footer')).toContainText('26 sát thương chính');
  await page.locator('#start').tap();
  for(const button of await choices.all())await expect(button).toBeDisabled();
  await gladiator.dispatchEvent('click');await hammer.dispatchEvent('click');
  await expect(hammer).toHaveAttribute('aria-pressed','true');await expect(gladiator).toHaveAttribute('aria-pressed','false');
  await page.locator('#summon-5').tap();await expect(page.locator('#allies')).toHaveText('1');
  await expect(page.locator('#summon-5')).toHaveAttribute('data-state','cooling');
  expect(Number(await page.locator('#gold').textContent())).toBeGreaterThanOrEqual(55);
  expect(Number(await page.locator('#gold').textContent())).toBeLessThan(60);
  await page.locator('#start').tap();await expect(page.locator('#summon-5')).toHaveAttribute('data-unit-type','hammer');
  await page.locator('#setup').tap();await expect(page.locator('#battle-status')).toHaveAttribute('data-phase','ready');
  await expect(page.locator('#allies')).toHaveText('0');await expect(page.locator('#gold')).toHaveText('100');
  await hammer.tap();await gladiator.tap();
  expect(await page.locator('#player-slots .slot').evaluateAll(buttons=>buttons.map(b=>(b as HTMLElement).dataset.unitType))).toEqual(DEFAULT_LOADOUT);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/r1d-armory-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('production: idle defeat, restart and touch summon at 390x844 without overflow or runtime errors',async({page})=>{
  const errors=observe(page);await page.goto('./');await page.locator('#start').click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase','lost',{timeout:20000});
  await expect(page.locator('#player-hp')).toHaveText('0 / 240');
  await page.setViewportSize({width:390,height:844});await page.locator('#start').click();
  await page.locator('#summon-5').tap();
  await expect(page.locator('#allies')).toHaveText('1');
  await expect(page.locator('#summon-5')).toHaveAttribute('data-state','cooling');
  await expect(page.locator('#bot-choice')).toContainText('Bot:',{timeout:3000});
  const canvas=await page.locator('#battlefield canvas').boundingBox();
  expect(canvas?.width).toBeGreaterThan(300);expect(canvas?.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const button of await page.locator('#bot-slots .slot').all())await expect(button).toBeDisabled();
  await page.screenshot({path:'test-results/r1d-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
