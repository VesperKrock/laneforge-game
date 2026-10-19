import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Battle, DEMO, TEMP_R1B_SLOTS, TEMP_R1B_UNITS, TEMP_R1B_ENEMIES } from '../src/game/Battle';
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
  const battle = new Battle();
  battle.start();
  battle.units = units;
  return battle;
}

test('model: unique five-kind roster; both sides use the configured profiles', () => {
  expect(TEMP_R1B_SLOTS).toEqual(['sword', 'axe', 'shield', 'gladiator', 'spear']);
  expect(new Set(TEMP_R1B_SLOTS).size).toBe(5);
  const profiles = Object.values(TEMP_R1B_UNITS);
  for (const field of ['hp', 'damage', 'speed', 'attackInterval'] as const) {
    expect(new Set(profiles.map(p => p[field])).size).toBe(5);
    expect(profiles.every(p => p[field] > 0)).toBe(true);
  }
  TEMP_R1B_SLOTS.forEach((kind, slot) => {
    const battle = new Battle();
    battle.start();
    expect(battle.summon(slot)).toBe(true);
    const p = TEMP_R1B_UNITS[kind];
    expect(battle.units.find(u => u.side === 'friendly')).toMatchObject({
      kind, hp: p.hp, maxHp: p.hp, damage: p.damage, speed: p.speed,
      attackInterval: p.attackInterval, attackRange: p.attackRange,
    });
    expect(battle.gold).toBe(DEMO.initialGold - p.cost);
    expect(battle.cooldowns[slot]).toBe(p.cooldown);
    expect(battle.cooldowns.filter(cd => cd > 0)).toHaveLength(1);
  });
});

test('model: independent CD and exact Gold; every rejected summon is side-effect free', () => {
  const battle = new Battle();
  const reject = (slot: number) => {
    const before = JSON.stringify(battle);
    expect(battle.summon(slot)).toBe(false);
    expect(JSON.stringify(battle)).toBe(before);
  };
  reject(0);
  battle.start();
  expect(battle.summon(0)).toBe(true);
  expect(battle.gold).toBe(75);
  reject(4); // Gate occupied, while this slot has Gold and zero CD.
  advance(battle, 0.3);
  const gold = battle.gold;
  expect(battle.summon(4)).toBe(true);
  expect(battle.gold).toBe(gold - TEMP_R1B_UNITS.spear.cost);
  expect(battle.cooldowns[0]).toBeCloseTo(1.7);
  expect(battle.cooldowns[4]).toBe(2.8);
  reject(0); reject(4);
  for (const slot of [-1, 5, 1.5, NaN]) reject(slot);
  advance(battle, 0.5);
  battle.gold = TEMP_R1B_UNITS.shield.cost - 1;
  reject(2);
  advance(battle, 1.21);
  expect(battle.canSummon(0)).toBe(true);
  expect(battle.canSummon(4)).toBe(false);
  battle.phase = 'won';
  reject(1);
});

test('model: reversed enemy arrays and equal-distance ties select the nearest lowest ID', () => {
  for (const reverse of [false, true]) {
    const ally = unit('sword', 'friendly', 100, 300);
    const near = unit('shield', 'enemy', 20, 328);
    const tied = unit('shield', 'enemy', 30, 328);
    const far = unit('shield', 'enemy', 10, 390);
    const behind = unit('shield', 'enemy', 5, 290);
    const dead = unit('shield', 'enemy', 1, 310);
    const friend = unit('shield', 'friendly', 90, 270);
    const units = [ally, far, tied, near, behind, dead, friend];
    for (const u of units) { u.speed = 0; if (u !== ally) u.attackIn = 999; }
    dead.hp = 0;
    const battle = arena(...(reverse ? units.reverse() : units));
    battle.step(0.01);
    expect(near.hp).toBe(near.maxHp - ally.damage);
    for (const untouched of [tied, far, behind, friend]) expect(untouched.hp).toBe(untouched.maxHp);
    expect(battle.enemyHp).toBe(DEMO.enemyBaseHp);
    expect(battle.units).not.toContain(dead);
  }
});

test('model: no damage outside range or through blockers, and no backward/base-exterior targets', () => {
  const ally = unit('spear', 'friendly', 100, 600);
  ally.speed = 0;
  const battle = arena(ally);
  battle.step(0.01);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp);
  ally.x = DEMO.enemyBaseX - ally.attackRange;
  const blocker = unit('shield', 'enemy', 200, DEMO.enemyBaseX - 10);
  blocker.speed = 0; blocker.attackIn = 999; blocker.hp = 1;
  const behind = { ...blocker, id: 201, x: ally.x - 10, hp: 150 };
  const outside = { ...blocker, id: 202, x: DEMO.enemyBaseX + 1, hp: 150 };
  battle.units = [outside, ally, behind, blocker];
  battle.step(0.01);
  expect(blocker.hp).toBe(0);
  expect(battle.units).not.toContain(blocker);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp);
  advance(battle, 0.91);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp - ally.damage);
  expect(behind.hp).toBe(150);
  expect(outside.hp).toBe(150);
});

test('model: spear supports a shield at 52 distance; melee cannot, and damage is single-target', () => {
  for (const side of ['friendly', 'enemy'] as const) {
    const direction = side === 'friendly' ? 1 : -1;
    for (const kind of ['spear', 'sword'] as const) {
      const tank = unit('shield', side, 100, 400);
      const support = unit(kind, side, 101, 400 - direction * DEMO.minSpacing);
      const target = unit('shield', side === 'friendly' ? 'enemy' : 'friendly', 200, 400 + direction * 28);
      const farther = { ...target, id: 201, x: target.x + direction * 24 };
      for (const u of [tank, support, target, farther]) { u.speed = 0; if (u !== support) u.attackIn = 999; }
      const battle = arena(farther, support, target, tank);
      battle.step(0.01);
      expect(target.hp).toBe(target.maxHp - (kind === 'spear' ? support.damage : 0));
      expect(farther.hp).toBe(farther.maxHp);
      expect(Math.abs(tank.x - support.x)).toBe(DEMO.minSpacing);
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

test('model: same-side spacing prevents overtaking on both sides while preserving forward speed', () => {
  for (const side of ['friendly', 'enemy'] as const) {
    const direction = side === 'friendly' ? 1 : -1;
    const front = unit('shield', side, 100, side === 'friendly' ? 300 : 600);
    const rear = unit('gladiator', side, 101, front.x - direction * 24);
    const last = unit('spear', side, 102, front.x - direction * 48);
    const enemy = unit('shield', side === 'friendly' ? 'enemy' : 'friendly', 200, front.x + direction * 300);
    enemy.speed = 0; enemy.attackIn = 999;
    const battle = arena(last, enemy, rear, front);
    const initialX = front.x;
    for (let frame = 0; frame < 200; frame++) {
      battle.step(0.01);
      expect((front.x - rear.x) * direction).toBeGreaterThanOrEqual(24 - 1e-7);
      expect((rear.x - last.x) * direction).toBeGreaterThanOrEqual(24 - 1e-7);
    }
    expect((front.x - initialX) * direction).toBeCloseTo(front.speed * 2);
  }
});

test('model: full deployment gate is rejected safely and frees after combat; no spawn behind a base attacker', () => {
  const battle = new Battle();
  battle.start();
  const enemy = battle.units[0];
  enemy.x = DEMO.playerBaseX + enemy.attackRange;
  enemy.hp = 1;
  expect(battle.summon(2)).toBe(true);
  const tank = battle.units.find(u => u.side === 'friendly')!;
  expect(tank.x).toBeLessThan(enemy.x);
  const before = JSON.stringify(battle);
  expect(battle.summon(4)).toBe(false);
  expect(JSON.stringify(battle)).toBe(before);
  battle.step(0.01);
  expect(battle.units).not.toContain(enemy);
  advance(battle, 0.5);
  expect(battle.canSummon(4)).toBe(true);
  expect(battle.summon(4)).toBe(true);
  const spear = battle.units.find(u => u.kind === 'spear' && u.side === 'friendly')!;
  expect(tank.x - spear.x).toBeGreaterThanOrEqual(DEMO.minSpacing);
});

test('model: PvE entries appear in order once, share profiles, and replay after restart', () => {
  const battle = new Battle();
  const collect = () => {
    battle.start();
    battle.playerHp = 100000;
    const seen = new Map<number, { kind: UnitKind; at: number }>();
    for (let frame = 0; frame < 3000; frame++) {
      for (const u of battle.units.filter(u => u.side === 'enemy')) {
        if (!seen.has(u.id)) {
          const p = TEMP_R1B_UNITS[u.kind];
          expect(u).toMatchObject({ damage: p.damage, maxHp: p.hp, speed: p.speed, attackRange: p.attackRange, attackInterval: p.attackInterval });
          seen.set(u.id, { kind: u.kind, at: battle.elapsed });
        }
      }
      battle.step(0.01);
    }
    const entries = [...seen.values()];
    expect(entries.map(e => e.kind)).toEqual(TEMP_R1B_ENEMIES.map(e => e.kind));
    entries.forEach((entry, i) => {
      const scheduled = TEMP_R1B_ENEMIES[i];
      expect(entry.at + 1e-7).toBeGreaterThanOrEqual(scheduled.at);
      if (i === 0 || scheduled.at !== TEMP_R1B_ENEMIES[i - 1].at) expect(entry.at).toBeCloseTo(scheduled.at, 2);
      else expect(entry.at).toBeLessThan(scheduled.at + 1);
    });
    expect(entries[3].at).toBeGreaterThan(entries[2].at); // Paired support waits for physical space.
    return entries;
  };
  expect(collect()).toEqual(collect());
});

test('model: a blocked PvE entry waits instead of being skipped or duplicated', () => {
  const battle = new Battle();
  battle.start();
  const first = battle.units[0];
  first.speed = 0; first.attackIn = 999;
  advance(battle, 6);
  expect(battle.units).toHaveLength(1);
  first.x -= DEMO.minSpacing;
  battle.step(0.01);
  expect(battle.units.map(u => u.kind)).toEqual(['sword', 'shield']);
  first.hp = 0;
  const seen = new Map(battle.units.filter(u => u.hp > 0).map(u => [u.id, u.kind]));
  for (let frame = 0; frame < 100; frame++) {
    battle.step(0.01);
    for (const u of battle.units) seen.set(u.id, u.kind);
  }
  expect([...seen.values()]).toEqual(['shield', 'spear', 'gladiator']);
});

test('model: game over freezes units/waves/economy; restart clears all timing and cooldowns', () => {
  const ally = unit('sword', 'friendly', 100, DEMO.enemyBaseX - 28);
  const battle = arena(ally);
  battle.enemyHp = 1;
  battle.step(0.01);
  expect(battle.phase).toBe('won');
  expect(battle.enemyHp).toBe(0);
  const frozen = JSON.stringify(battle);
  battle.step(100);
  expect(battle.summon(4)).toBe(false);
  expect(JSON.stringify(battle)).toBe(frozen);
  battle.cooldowns.fill(10);
  battle.start();
  expect(battle.cooldowns).toEqual([0, 0, 0, 0, 0]);
  expect(battle.gold).toBe(DEMO.initialGold);
  expect([battle.playerHp, battle.enemyHp, battle.elapsed, battle.hits]).toEqual([80, 90, 0, 0]);
  expect(battle.units).toHaveLength(1);
  const enemy = battle.units[0];
  enemy.x = DEMO.playerBaseX + enemy.attackRange;
  battle.playerHp = 1;
  battle.step(0.01);
  expect(battle.phase).toBe('lost');
  expect(battle.playerHp).toBe(0);
  const lost = JSON.stringify(battle);
  advance(battle, 30);
  expect(JSON.stringify(battle)).toBe(lost);
});

test('model: invalid delta has no effect, hidden-tab delta is capped, and Gold respects its cap', () => {
  const battle = new Battle();
  battle.start();
  const before = JSON.stringify(battle);
  for (const dt of [0, -1, NaN, Infinity]) battle.step(dt);
  expect(JSON.stringify(battle)).toBe(before);
  battle.step(600);
  expect(battle.elapsed).toBe(0.05);
  expect(battle.gold).toBeCloseTo(DEMO.initialGold + DEMO.goldPerSecond * 0.05);
  advance(battle, 6);
  expect(battle.gold).toBe(DEMO.maxGold);
});

test('playtest simulations: no deployment and isolated spear lose; sustained rush and mixed reinforcements can win', () => {
  const cases = [
    { name: 'none', order: [], expected: 'lost' },
    { name: 'single sword', order: [0], limit: 1, expected: 'lost' },
    { name: 'sword reinforcements', order: [0], expected: 'won' },
    { name: 'shield-spear mixed', order: [2, 4, 1, 0, 3], expected: 'won' },
    { name: 'spear only', order: [4], expected: 'lost' },
  ];
  for (const scenario of cases) {
    const battle = new Battle(); battle.start();
    let cursor = 0; let spent = 0;
    for (let frame = 0; frame < 6000 && battle.phase === 'running'; frame++) {
      const slot = scenario.order[cursor % scenario.order.length];
      if (slot !== undefined && cursor < (scenario.limit ?? Infinity) && battle.canSummon(slot)) {
        battle.summon(slot); cursor += 1; spent += TEMP_R1B_UNITS[TEMP_R1B_SLOTS[slot]].cost;
      }
      battle.step(0.02);
    }
    console.log(JSON.stringify({ strategy: scenario.name, result: battle.phase, seconds: +battle.elapsed.toFixed(2), playerHp: battle.playerHp, enemyHp: battle.enemyHp, summons: cursor, spent }));
    expect(battle.phase).toBe(scenario.expected);
  }
});

function observe(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push('Failed request: ' + new URL(request.url()).pathname));
  page.on('response', response => { if (response.status() >= 400) errors.push('HTTP ' + response.status() + ': ' + new URL(response.url()).pathname); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173/') && !request.url().startsWith('data:')) errors.push('Unexpected external request'); });
  return errors;
}

test('production UI: five unique working slots, independent cooldowns and safe Gold/gate rejection', async ({ page }) => {
  const errors = observe(page);
  await page.goto('./');
  const slots = page.locator('.slots .slot');
  await expect(slots).toHaveCount(5);
  await expect(page.locator('.build-tag')).toContainText('R1B');
  expect(new Set(await slots.locator('.unit-symbol').allTextContents()).size).toBe(5);
  for (let i = 0; i < 5; i++) {
    await expect(slots.nth(i)).toHaveAttribute('data-unit-type', TEMP_R1B_SLOTS[i]);
    await expect(slots.nth(i)).toBeDisabled();
  }
  for (let i = 0; i < 5; i++) {
    await page.locator('#start').click();
    await slots.nth(i).click();
    await expect(page.locator('#allies')).toHaveText('1');
    await expect(slots.nth(i)).toHaveAttribute('data-state', 'cooling');
    const gold = Number(await page.locator('#gold').textContent());
    expect(gold).toBeGreaterThanOrEqual(100 - TEMP_R1B_UNITS[TEMP_R1B_SLOTS[i]].cost);
    expect(gold).toBeLessThan(104 - TEMP_R1B_UNITS[TEMP_R1B_SLOTS[i]].cost);
  }
  await page.locator('#start').click();
  await slots.nth(2).click();
  await expect(slots.nth(4)).toHaveAttribute('data-state', 'blocked');
  await slots.nth(4).dispatchEvent('click');
  await expect(page.locator('#allies')).toHaveText('1');
  await expect(slots.nth(4)).toBeEnabled({ timeout: 2000 });
  await page.locator('#start').click();
  await slots.nth(0).click();
  await expect(slots.nth(4)).toBeEnabled({ timeout: 2000 });
  await slots.nth(4).click();
  await expect(page.locator('#allies')).toHaveText('2');
  await expect(slots.nth(0)).toHaveAttribute('data-state', 'cooling');
  await expect(slots.nth(4)).toHaveAttribute('data-state', 'cooling');
  await slots.nth(0).dispatchEvent('click');
  await expect(page.locator('#allies')).toHaveText('2');
  expect(Number(await page.locator('#gold').textContent())).toBeGreaterThanOrEqual(45);
  expect(Number(await page.locator('#gold').textContent())).toBeLessThan(55);
  await page.locator('#start').click();
  for (const i of [2, 1, 0]) { await expect(slots.nth(i)).toBeEnabled(); await slots.nth(i).click(); }
  await expect(slots.nth(3)).toHaveAttribute('data-state', 'insufficient');
  await slots.nth(3).dispatchEvent('click');
  await expect(page.locator('#allies')).toHaveText('3');
  expect(errors).toEqual([]);
});

test('production subpath: mixed formation fights the full PvE script, wins and restarts', async ({ page }) => {
  test.setTimeout(90000);
  const errors = observe(page);
  await page.goto('./');
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  await page.locator('#start').click();
  const order = [2, 4, 1, 0, 3];
  let cursor = 0; let captured = false;
  const started = Date.now();
  while (await page.locator('#battle-status').getAttribute('data-phase') === 'running' && Date.now() - started < 75000) {
    const clicked = await page.locator('.slots .slot').nth(order[cursor % order.length])
      .evaluate(button => { const b = button as HTMLButtonElement; if (b.disabled) return false; b.click(); return true; });
    if (clicked) cursor += 1;
    if (!captured && Date.now() - started > 18000) {
      await page.screenshot({ path: 'test-results/r1b-formation.png', fullPage: true });
      captured = true;
    }
    await page.waitForTimeout(100);
  }
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'won');
  await expect(page.locator('#enemy-hp')).toHaveText('0 / 90');
  expect(Number(await page.locator('#hits').textContent())).toBeGreaterThan(0);
  for (let i = 0; i < 5; i++) await expect(page.locator('.slots .slot').nth(i)).toBeDisabled();
  await page.locator('#start').click();
  await expect(page.locator('#player-hp')).toHaveText('80 / 80');
  await expect(page.locator('#enemy-hp')).toHaveText('90 / 90');
  await expect(page.locator('#allies')).toHaveText('0');
  await expect(page.locator('#hits')).toHaveText('0');
  for (let i = 0; i < 5; i++) await expect(page.locator('.slots .slot').nth(i)).toHaveAttribute('data-state', 'ready');
  expect(errors).toEqual([]);
});

test('production: idle defeat, restart and spear summon remain responsive at 390x844', async ({ page }) => {
  const errors = observe(page);
  await page.goto('./');
  await page.locator('#start').click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'lost', { timeout: 20000 });
  await expect(page.locator('#player-hp')).toHaveText('0 / 80');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#start').click();
  await page.locator('#summon-5').click();
  await expect(page.locator('#allies')).toHaveText('1');
  await expect(page.locator('#summon')).toBeEnabled({ timeout: 2000 });
  await expect(page.locator('#summon-5')).toHaveAttribute('data-state', 'cooling');
  const canvas = await page.locator('#battlefield canvas').boundingBox();
  expect(canvas?.width).toBeGreaterThan(300);
  expect(canvas?.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/r1b-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
