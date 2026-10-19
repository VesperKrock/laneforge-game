import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import assert from 'node:assert/strict';
import { Battle, DEMO, TEMP_R1B_SLOTS, TEMP_R1B_UNITS, TEMP_R1C } from '../src/game/Battle';
import type { Unit, UnitKind, Side } from '../src/game/Battle';

function advance(battle: Battle, seconds: number, dt = 0.01): void {
  for (let left = seconds; left > 1e-9; left -= dt) battle.step(Math.min(dt, left));
}

function unit(kind: UnitKind, side: Side, id: number, x: number): Unit {
  const p = TEMP_R1B_UNITS[kind];
  return { id, kind, side, x, hp: p.hp, maxHp: p.hp, damage: p.damage, speed: p.speed,
    attackInterval: p.attackInterval, attackRange: p.attackRange, attackIn: 0, flash: 0 };
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
  expect(TEMP_R1B_SLOTS).toEqual(['sword', 'axe', 'shield', 'gladiator', 'spear']);
  expect(new Set(TEMP_R1B_SLOTS).size).toBe(5);
  for (const field of ['hp', 'damage', 'speed', 'attackInterval'] as const)
    expect(new Set(Object.values(TEMP_R1B_UNITS).map(p => p[field])).size).toBe(5);
  for (const side of ['friendly', 'enemy'] as const) TEMP_R1B_SLOTS.forEach((kind, slot) => {
    const battle = new Battle(); battle.start();
    expect([battle.playerHp,battle.enemyHp]).toEqual([240,240]);
    expect(battle.units).toEqual([]); // No free wave at t=0.
    expect(battle.summon(side, slot)).toBe(true);
    const p = TEMP_R1B_UNITS[kind];
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
    if(accepted&&side==='enemy')spent+=TEMP_R1B_UNITS[TEMP_R1B_SLOTS[slot]].cost;
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
  const players=TEMP_R1B_SLOTS.map((kind,i)=>unit(kind,'friendly',100+i,410-i*12));
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
  for(let slot=0;slot<TEMP_R1B_SLOTS.length;slot++){
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
  for(const dt of [1/20,1/30,1/60,1/100,0.2])for(let seed=1;seed<=60;seed++){
    let state=seed>>>0;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const battle=new Battle();battle.start();let next=0;ordered(battle);
    for(let frame=0;frame<Math.ceil(180/Math.min(dt,0.05))&&battle.phase==='running';frame++){
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
  console.log(JSON.stringify({audit:'valid lane invariant',matches,states,baseDamageSteps,outcomes,maxSeconds:+maxSeconds.toFixed(2),seeds:'1..60',frameSteps:[1/20,1/30,1/60,1/100,0.2]}));
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
  advance(battle, 0.91);
  expect(battle.enemyHp).toBe(DEMO.baseHp - ally.damage);
});

test('model: spear supports a shield at 52 distance; melee cannot, and damage is single-target', () => {
  for (const side of ['friendly', 'enemy'] as const) {
    const direction = side === 'friendly' ? 1 : -1;
    for (const kind of ['spear', 'sword'] as const) {
      const tank = unit('shield', side, 100, 400);
      const support = unit(kind, side, 101, 400 - direction * TEMP_R1C.supportOffset);
      const target = unit('shield', side === 'friendly' ? 'enemy' : 'friendly', 200, 400 + direction * 28);
      const farther = { ...target, id: 201, x: target.x + direction * 24 };
      for (const u of [tank, support, target, farther]) { u.speed = 0; if (u !== support) u.attackIn = 999; }
      const battle = arena(farther, support, target, tank);
      battle.step(0.01);
      expect(target.hp).toBe(target.maxHp - (kind === 'spear' ? support.damage : 0));
      expect(farther.hp).toBe(farther.maxHp);
      expect(Math.abs(tank.x - support.x)).toBe(TEMP_R1C.supportOffset);
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
    expect(hits[0]).toBe(Math.ceil(3.2 / TEMP_R1B_UNITS[kind].attackInterval));
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
    expect(target.hp).toBe(1000-shield.damage-axe.damage-sword.damage);
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

test('model: overlapping spears support melee at offset 24 and both hit a single nearest enemy', () => {
  for (const side of ['friendly','enemy'] as const) {
    const d=side==='friendly'?1:-1;
    const shield=unit('shield',side,100,400);
    const a=unit('spear',side,101,400-d*TEMP_R1C.supportOffset);
    const b={...a,id:102};
    const target=unit('shield',side==='friendly'?'enemy':'friendly',200,400+d*28);
    const far={...target,id:201,x:target.x+d*10};
    for (const u of [shield,a,b,target,far]) {u.speed=0;if(u!==a&&u!==b)u.attackIn=999;}
    const battle=arena(shield,a,b,target,far); battle.step(0.01);
    expect(a.x).toBe(b.x);
    expect((shield.x-a.x)*d).toBe(TEMP_R1C.supportOffset);
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
    expect((melee.x-spear.x)*d).toBeGreaterThanOrEqual(TEMP_R1C.supportOffset-1e-7);
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
    expect(TEMP_R1B_SLOTS[battle.botChoice!.slot]).toBe(scenario.expected);
    const spawned=battle.units.find(u=>u.id<100)!;
    expect(spawned.kind).toBe(scenario.expected);
    expect(battle.cooldowns.enemy[battle.botChoice!.slot]).toBeGreaterThan(0);
    expect(battle.gold.enemy).toBeCloseTo(scenario.gold+5*0.75-TEMP_R1B_UNITS[spawned.kind].cost);
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
    {name:'axe-spear mixed',order:[1,4,0,3,2],expected:'won'},
    {name:'long mixed win',order:[2,1,3,0,4],expected:'won'},
    {name:'long mixed defeat',order:[2,0,4,3,1],expected:'lost'},
    {name:'spear only',order:[4],expected:'lost'},
  ];
  for(const scenario of cases){
    const battle=new Battle();battle.start();
    let cursor=0,spent=0,botSpent=0,nextInput=0;
    const botActions:{kind:UnitKind;at:number}[]=[];
    const summon=battle.summon.bind(battle);
    battle.summon=(side,slot)=>{
      const before=battle.gold[side];
      const eligible=battle.canSummon(side,slot);
      const result=summon(side,slot);
      assert.equal(result,eligible);
      if(result&&side==='enemy'){
        const kind=TEMP_R1B_SLOTS[slot],p=TEMP_R1B_UNITS[kind];
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
          cursor++;spent+=TEMP_R1B_UNITS[TEMP_R1B_SLOTS[slot]].cost;
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
    if(scenario.name==='axe-spear mixed')expect(botActions.some(a=>a.at>18)).toBe(true);
    console.log(JSON.stringify({strategy:scenario.name,result:battle.phase,seconds:+battle.elapsed.toFixed(2),playerHp:battle.playerHp,enemyHp:battle.enemyHp,summons:cursor,spent,botSummons:botActions.length,botSpent,botKinds:[...new Set(botActions.map(a=>a.kind))],lastBotAt:+botActions.at(-1)!.at.toFixed(2)}));
  }
});

test('playtest: a valid mixed strategy can win with 100ms inputs at 20, 30 and 60 FPS',()=>{
  for(const dt of [1/20,1/30,1/60]){
    const battle=new Battle();battle.start();const order=[1,4,0,3,2];let cursor=0,nextInput=0;
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
  await expect(page.locator('.build-tag')).toContainText('R1C');
  await expect(page.locator('#player-hp')).toHaveText('240 / 240');
  await expect(page.locator('#enemy-hp')).toHaveText('240 / 240');
  await expect(player).toHaveCount(5);await expect(bot).toHaveCount(5);
  await expect(page.locator('#gold')).toHaveText('100');
  await expect(page.locator('#bot-gold')).toHaveText('100');
  for(let i=0;i<5;i++){
    await expect(player.nth(i)).toHaveAttribute('data-unit-type',TEMP_R1B_SLOTS[i]);
    await expect(bot.nth(i)).toHaveAttribute('data-unit-type',TEMP_R1B_SLOTS[i]);
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
    expect(balance).toBeGreaterThanOrEqual(100-TEMP_R1B_UNITS[TEMP_R1B_SLOTS[i]].cost);
    expect(balance).toBeLessThan(104-TEMP_R1B_UNITS[TEMP_R1B_SLOTS[i]].cost);
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

test('production subpath: mixed formation fights a continuing bot, wins and resets both sides',async({page})=>{
  test.setTimeout(90000);
  const errors=observe(page);await page.goto('./');
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  await page.locator('#start').click();
  const order=[1,4,0,3,2];let cursor=0,captured=false;
  const started=Date.now();
  while(await page.locator('#battle-status').getAttribute('data-phase')==='running'&&Date.now()-started<75000){
    const clicked=await page.locator('#player-slots .slot').nth(order[cursor%order.length])
      .evaluate(button=>{const b=button as HTMLButtonElement;if(b.disabled)return false;b.click();return true;});
    if(clicked)cursor++;
    if(!captured&&Date.now()-started>8000){
      await page.screenshot({path:'test-results/r1c-formation.png',fullPage:true});captured=true;
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
  await page.screenshot({path:'test-results/r1c-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
