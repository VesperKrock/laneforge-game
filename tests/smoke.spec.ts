import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Battle, DEMO, TEMP_R1A_SLOTS, TEMP_R1A_UNITS } from '../src/game/Battle';

function advance(battle: Battle, seconds: number): void {
  for (let left = seconds; left > 1e-9; left -= 0.01) battle.step(Math.min(0.01, left));
}

function duel() {
  const battle = new Battle();
  battle.start();
  battle.summon(0);
  const ally = battle.units.find(unit => unit.side === 'friendly')!;
  const enemy = battle.units.find(unit => unit.side === 'enemy')!;
  ally.x = 300;
  enemy.x = 400;
  enemy.attackIn = 999;
  battle.units = [ally, enemy];
  return { battle, ally, enemy };
}

test('model: five slots use four distinct profiles; each slot can summon its configured type', () => {
  const profiles = Object.values(TEMP_R1A_UNITS);
  expect(TEMP_R1A_SLOTS).toHaveLength(5);
  expect(new Set(TEMP_R1A_SLOTS).size).toBe(4);
  for (const field of ['hp', 'damage', 'attackInterval', 'speed'] as const) {
    expect(new Set(profiles.map(profile => profile[field])).size).toBe(4);
    expect(profiles.every(profile => profile[field] > 0)).toBe(true);
  }
  expect(TEMP_R1A_UNITS.shield.hp).toBe(Math.max(...profiles.map(profile => profile.hp)));
  expect(TEMP_R1A_UNITS.axe.damage).toBe(Math.max(...profiles.map(profile => profile.damage)));
  expect(TEMP_R1A_UNITS.gladiator.attackInterval).toBe(Math.min(...profiles.map(profile => profile.attackInterval)));
  expect(TEMP_R1A_UNITS.gladiator.speed).toBe(Math.max(...profiles.map(profile => profile.speed)));
  TEMP_R1A_SLOTS.forEach((kind, slot) => {
    const battle = new Battle();
    battle.start();
    expect(battle.summon(slot)).toBe(true);
    const profile = TEMP_R1A_UNITS[kind];
    const unit = battle.units.find(unit => unit.side === 'friendly')!;
    expect(unit).toMatchObject({ kind, hp: profile.hp, damage: profile.damage, speed: profile.speed, attackInterval: profile.attackInterval });
    expect(battle.gold).toBe(DEMO.initialGold - profile.cost);
    expect(battle.cooldowns[slot]).toBe(profile.cooldown);
    expect(battle.cooldowns.filter(value => value > 0)).toHaveLength(1);
  });
});

test('model: duplicate slots have independent CD; rejected summons have no side effects', () => {
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
  expect(battle.cooldowns[4]).toBe(0);
  advance(battle, 0.2);
  const goldBefore = battle.gold;
  expect(battle.summon(4)).toBe(true);
  expect(battle.gold).toBe(goldBefore - TEMP_R1A_UNITS.sword.cost);
  expect(battle.cooldowns[0]).toBeCloseTo(1.8);
  expect(battle.cooldowns[4]).toBe(2);
  reject(0);
  reject(4);
  for (const slot of [-1, 5, 1.5, NaN]) reject(slot);
  battle.gold = TEMP_R1A_UNITS.shield.cost - 1;
  reject(2);
  advance(battle, 1.81);
  expect(battle.canSummon(0)).toBe(true);
  expect(battle.canSummon(4)).toBe(false);
  battle.phase = 'won';
  reject(1);
});

test('model: directional nearest targets, movement speed, cadence and no walking through enemies', () => {
  const { battle, ally, enemy } = duel();
  battle.step(0.05);
  expect(ally.x).toBeCloseTo(300 + ally.speed * 0.05);
  expect(enemy.x).toBeCloseTo(400 - enemy.speed * 0.05);
  expect(enemy.hp).toBe(enemy.maxHp);
  ally.x = 300;
  enemy.x = 325;
  enemy.speed = 0;
  const far = { ...enemy, id: 10, x: 360 };
  const behind = { ...enemy, id: 11, x: 290 };
  const friendly = { ...ally, id: 12, x: 310, speed: 0, attackIn: 999 };
  battle.units = [ally, far, behind, enemy, friendly];
  battle.step(0.01);
  expect(enemy.hp).toBe(enemy.maxHp - ally.damage);
  expect([far.hp, behind.hp, friendly.hp]).toEqual([far.maxHp, behind.maxHp, friendly.maxHp]);
  expect(ally.x).toBe(300);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp);
  advance(battle, ally.attackInterval - 0.01);
  expect(enemy.hp).toBe(enemy.maxHp - ally.damage);
  battle.step(0.02);
  expect(enemy.hp).toBe(enemy.maxHp - ally.damage * 2);

  const contact = duel();
  contact.enemy.x = 335;
  contact.ally.hp = contact.enemy.hp = 10000;
  for (let frame = 0; frame < 300; frame++) {
    contact.battle.step(0.01);
    expect(contact.enemy.x - contact.ally.x).toBeGreaterThanOrEqual(DEMO.attackRange - 1e-8);
  }
});

test('model: base range, blocking enemies, death removal, frozen game over and complete restart', () => {
  const { battle, ally, enemy } = duel();
  battle.units = [ally];
  ally.x = 600;
  battle.step(0.05);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp);
  ally.x = DEMO.enemyBaseX - DEMO.attackRange;
  enemy.x = DEMO.enemyBaseX - 10;
  enemy.speed = 0;
  enemy.hp = 1;
  battle.units = [ally, enemy];
  battle.step(0.01);
  expect(enemy.hp).toBe(0);
  expect(battle.units).not.toContain(enemy);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp);
  advance(battle, ally.attackInterval + 0.01);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp - ally.damage);
  battle.enemyHp = 1;
  advance(battle, ally.attackInterval + 0.01);
  expect(battle.enemyHp).toBe(0);
  expect(battle.phase).toBe('won');
  const finished = JSON.stringify(battle);
  battle.step(20);
  expect(battle.summon(4)).toBe(false);
  expect(JSON.stringify(battle)).toBe(finished);
  battle.cooldowns.fill(10);
  battle.start();
  expect(battle.cooldowns).toEqual([0, 0, 0, 0, 0]);
  expect(battle.gold).toBe(DEMO.initialGold);
  expect(battle.playerHp).toBe(DEMO.playerBaseHp);
  expect(battle.enemyHp).toBe(DEMO.enemyBaseHp);
  expect(battle.elapsed).toBe(0);
  expect(battle.hits).toBe(0);
  expect(battle.units).toHaveLength(1);
  expect(battle.units[0]).toMatchObject({ side: 'enemy', kind: 'sword', attackIn: 0 });
  const attacker = battle.units[0];
  attacker.x = DEMO.playerBaseX + DEMO.attackRange;
  battle.playerHp = 1;
  battle.step(0.01);
  expect(battle.playerHp).toBe(0);
  expect(battle.phase).toBe('lost');
  const lost = JSON.stringify(battle);
  battle.step(1);
  expect(battle.summon(0)).toBe(false);
  expect(JSON.stringify(battle)).toBe(lost);
});

test('model: deterministic PvE, capped Gold, no delta burst and invalid time ignored', () => {
  const first = new Battle();
  const second = new Battle();
  first.start(); second.start();
  advance(first, 8); advance(second, 8);
  expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  expect(first.units.map(unit => unit.kind)).toEqual(['sword', 'axe']);
  expect(first.gold).toBe(DEMO.maxGold);
  const before = JSON.stringify(first);
  for (const time of [0, -1, NaN, Infinity]) first.step(time);
  expect(JSON.stringify(first)).toBe(before);
  const elapsed = first.elapsed;
  first.step(600);
  expect(first.elapsed - elapsed).toBeCloseTo(0.05);
});

function observe(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`Failed request: ${new URL(request.url()).pathname}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`); });
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4173/') && !request.url().startsWith('data:')) errors.push('Unexpected external request');
  });
  return errors;
}

test('production UI: all five slots summon; duplicate CD and shared Gold states are independent', async ({ page }) => {
  const errors = observe(page);
  await page.goto('./');
  const slots = page.locator('.slots .slot');
  await expect(slots).toHaveCount(5);
  for (let index = 0; index < 5; index++) {
    await expect(slots.nth(index)).toBeVisible();
    await expect(slots.nth(index)).toBeDisabled();
    await expect(slots.nth(index)).toHaveAttribute('data-unit-type', TEMP_R1A_SLOTS[index]);
  }
  expect(new Set(await slots.locator('.unit-symbol').allTextContents()).size).toBe(4);
  for (let index = 0; index < 5; index++) {
    await page.locator('#start').click();
    await slots.nth(index).click();
    await expect(page.locator('#allies')).toHaveText('1');
    await expect(slots.nth(index)).toHaveAttribute('data-state', 'cooling');
  }
  await page.locator('#start').click();
  await slots.nth(0).click();
  await expect(slots.nth(4)).toBeEnabled();
  await slots.nth(4).click();
  await expect(page.locator('#allies')).toHaveText('2');
  await expect(slots.nth(0)).toBeDisabled();
  await expect(slots.nth(4)).toBeDisabled();
  await slots.nth(0).dispatchEvent('click');
  await expect(page.locator('#allies')).toHaveText('2');
  expect(Number(await page.locator('#gold').textContent())).toBeGreaterThanOrEqual(50);
  expect(Number(await page.locator('#gold').textContent())).toBeLessThan(60);
  await page.locator('#start').click();
  for (const index of [1, 2, 0]) await slots.nth(index).click();
  await expect(page.locator('#allies')).toHaveText('3');
  await expect(slots.nth(3)).toHaveAttribute('data-state', 'insufficient');
  await expect(slots.nth(3)).toBeDisabled();
  await slots.nth(3).dispatchEvent('click');
  await expect(page.locator('#allies')).toHaveText('3');
  expect(errors).toEqual([]);
});

test('production subpath: four combat roles fight, win and restart', async ({ page }) => {
  const errors = observe(page);
  await page.goto('./');
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  await expect(page.locator('.slot')).toHaveCount(5);
  await expect(page.locator('#summon')).toBeDisabled();
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'running');
  await page.locator('#summon').click();
  expect(Number(await page.locator('#gold').textContent())).toBeLessThan(80);
  await expect(page.locator('#allies')).toHaveText('1');
  await expect(page.locator('#summon')).toBeDisabled();
  await expect(page.locator('#cooldown')).toContainText('Hồi chiêu');
  await page.waitForTimeout(500);
  await expect(page.locator('#allies')).toHaveText('1');
  await expect(page.locator('#summon')).toBeDisabled();
  await expect(page.locator('#summon')).toBeEnabled({ timeout: 3_000 });

  await page.locator('#start').click();
  for (const index of [2, 0, 3]) await page.locator('.slots .slot').nth(index).click();
  await expect.poll(async () => Number(await page.locator('#gold').textContent()), { timeout: 6_000 }).toBeGreaterThanOrEqual(TEMP_R1A_UNITS.axe.cost);
  await page.locator('#summon-2').click();
  await page.screenshot({ path: 'test-results/r1a-four-roles.png', fullPage: true });

  const deadline = Date.now() + 40_000;
  while (await page.locator('#battle-status').getAttribute('data-phase') === 'running' && Date.now() < deadline) {
    for (const index of [0, 4, 3, 1, 2]) {
      const slot = page.locator('.slots .slot').nth(index);
      // Native click is atomic if game over disables a slot between animation frames.
      // Pointer interaction with every slot is covered in the UI test above.
      await slot.evaluate(button => (button as HTMLButtonElement).click());
    }
    await page.waitForTimeout(200);
  }
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'won');
  await expect(page.locator('#enemy-hp')).toHaveText('0 / 90');
  expect(Number(await page.locator('#hits').textContent())).toBeGreaterThan(0);
  await expect(page.locator('#summon')).toBeDisabled();
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#player-hp')).toHaveText('80 / 80');
  await expect(page.locator('#enemy-hp')).toHaveText('90 / 90');
  await expect(page.locator('#allies')).toHaveText('0');
  await expect(page.locator('#hits')).toHaveText('0');
  await expect(page.locator('#summon')).toBeEnabled();
  for (let index = 0; index < 5; index++) await expect(page.locator('.slots .slot').nth(index)).toHaveAttribute('data-state', 'ready');
  expect(Number(await page.locator('#gold').textContent())).toBeGreaterThanOrEqual(100);
  await page.screenshot({ path: 'test-results/battle-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('scripted enemies can cause defeat; controls still work after mobile resize', async ({ page }) => {
  const errors = observe(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'lost', { timeout: 35_000 });
  await expect(page.locator('#player-hp')).toHaveText('0 / 80');
  await expect(page.locator('#summon')).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await page.locator('#summon').click();
  await expect(page.locator('#allies')).toHaveText('1');
  const canvas = await page.locator('#battlefield canvas').boundingBox();
  expect(canvas?.width).toBeGreaterThan(300);
  expect(canvas?.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/battle-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
