import Phaser from 'phaser';
import { Battle, DEMO, TEMP_R1B_SLOTS, TEMP_R1B_UNITS } from './game/Battle';
import type { Side } from './game/Battle';
import { BattleScene } from './game/BattleScene';
import './style.css';

function element<T extends HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing UI element: ${id}`);
  return result as T;
}

const battle = new Battle();
const start = element<HTMLButtonElement>('start');
function prepareSlots(side: Side) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(`#${side === 'friendly' ? 'player' : 'bot'}-slots .slot`));
  if (buttons.length !== TEMP_R1B_SLOTS.length) throw new Error('Expected five slots per side');
  return buttons.map((button, index) => {
    const kind = TEMP_R1B_SLOTS[index];
    const profile = TEMP_R1B_UNITS[kind];
    button.dataset.unitType = kind;
    button.querySelector('.unit-symbol')!.textContent = profile.mark;
    button.querySelector('strong')!.textContent = profile.name;
    button.querySelector('.slot-price')!.textContent = `${profile.cost} Vàng · ${profile.cooldown}s CD`;
    const note = button.querySelector('.slot-note');
    if (note) note.textContent = `${profile.role} · Tầm ${profile.attackRange}`;
    if (side === 'friendly') button.addEventListener('click', () => { battle.summon('friendly', index); updateUi(); });
    return { button, profile, label: button.querySelector<HTMLElement>('.slot-cooldown')! };
  });
}
const slots = { friendly: prepareSlots('friendly'), enemy: prepareSlots('enemy') };
const gold = element('gold');
const botGold = element('bot-gold');
const botChoice = element('bot-choice');
document.querySelectorAll('.gold-readout small').forEach(label => { label.textContent = `+${DEMO.goldPerSecond} / giây · tối đa ${DEMO.maxGold}`; });
const status = element('battle-status');
const event = element('battle-event');
const allies = element('allies');
const hits = element('hits');
const playerHp = element('player-hp');
const enemyHp = element('enemy-hp');
let previousUi = '';

function updateUi(): void {
  const friendlyCount = battle.units.filter(unit => unit.side === 'friendly').length;
  const remaining = { friendly: battle.cooldowns.friendly.map(value => value > 0 ? value.toFixed(1) : '0'), enemy: battle.cooldowns.enemy.map(value => value > 0 ? value.toFixed(1) : '0') };
  const ready = { friendly: slots.friendly.map((_slot, index) => battle.canSummon('friendly', index)), enemy: slots.enemy.map((_slot, index) => battle.canSummon('enemy', index)) };
  const highlighted = battle.botChoice && battle.elapsed - battle.botChoice.at < 1 ? battle.botChoice.slot : -1;
  const ui = [battle.phase, Math.floor(battle.gold.friendly), Math.floor(battle.gold.enemy), ...remaining.friendly, ...remaining.enemy, ...ready.friendly, ...ready.enemy, highlighted, battle.botChoice?.at, friendlyCount, battle.hits, battle.playerHp, battle.enemyHp, battle.event].join('|');
  if (ui === previousUi) return;
  previousUi = ui;
  gold.textContent = String(Math.floor(battle.gold.friendly));
  botGold.textContent = String(Math.floor(battle.gold.enemy));
  botChoice.textContent = battle.botChoice ? `Bot: ${TEMP_R1B_UNITS[TEMP_R1B_SLOTS[battle.botChoice.slot]].name} · ${battle.botChoice.reason}` : 'Bot chưa triệu hồi.';
  allies.textContent = String(friendlyCount);
  hits.textContent = String(battle.hits);
  playerHp.textContent = `${battle.playerHp} / ${DEMO.baseHp}`;
  enemyHp.textContent = `${battle.enemyHp} / ${DEMO.baseHp}`;
  event.textContent = battle.event;
  start.textContent = battle.phase === 'ready' ? 'Bắt đầu' : 'Chơi lại';
  for (const side of ['friendly', 'enemy'] as const) slots[side].forEach(({ button, profile, label }, index) => {
    const state = battle.phase !== 'running' ? 'inactive' : battle.cooldowns[side][index] > 0 ? 'cooling' : battle.gold[side] < profile.cost ? 'insufficient' : ready[side][index] ? 'ready' : 'blocked';
    button.dataset.state = state;
    button.disabled = side === 'enemy' || !ready[side][index];
    button.classList.toggle('bot-chosen', side === 'enemy' && index === highlighted);
    label.textContent = battle.phase === 'ready' ? 'Chờ bắt đầu'
      : battle.phase !== 'running' ? 'Trận đã kết thúc'
        : state === 'cooling' ? `Hồi chiêu ${remaining[side][index]}s`
          : state === 'insufficient' ? 'Chưa đủ Vàng' : state === 'blocked' ? 'Cửa bị địch chặn' : side === 'enemy' ? 'Sẵn sàng' : 'Triệu hồi →';
  });
  const labels = { ready: 'Sẵn sàng — bấm Bắt đầu', running: 'Đang giao chiến', won: 'Thắng — căn cứ địch đã bị phá', lost: 'Thua — căn cứ ta đã bị phá' };
  if (status.textContent !== labels[battle.phase]) status.textContent = labels[battle.phase];
  status.dataset.phase = battle.phase;
}

start.addEventListener('click', () => { battle.start(); updateUi(); });
updateUi();

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'battlefield',
  width: DEMO.width,
  height: DEMO.height,
  backgroundColor: '#0c191e',
  banner: false,
  audio: { noAudio: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: new BattleScene(battle, updateUi),
});

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true));
