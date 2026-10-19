import Phaser from 'phaser';
import { Battle, DEMO, TEMP_R1A_SLOTS, TEMP_R1A_UNITS } from './game/Battle';
import { BattleScene } from './game/BattleScene';
import './style.css';

function element<T extends HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing UI element: ${id}`);
  return result as T;
}

const battle = new Battle();
const start = element<HTMLButtonElement>('start');
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.slots .slot'));
if (buttons.length !== TEMP_R1A_SLOTS.length) throw new Error('Expected five summon slots');
const slots = buttons.map((button, index) => {
  const kind = TEMP_R1A_SLOTS[index];
  const profile = TEMP_R1A_UNITS[kind];
  button.dataset.unitType = kind;
  button.querySelector('.unit-symbol')!.textContent = profile.mark;
  button.querySelector('strong')!.textContent = profile.name;
  button.querySelector('.slot-price')!.textContent = `${profile.cost} Vàng · ${profile.cooldown}s CD`;
  button.querySelector('.slot-note')!.textContent = index === 4 ? 'Trùng slot 01 · CD riêng (tạm)' : profile.role;
  button.addEventListener('click', () => { battle.summon(index); updateUi(); });
  return { button, profile, label: button.querySelector<HTMLElement>('.slot-cooldown')! };
});
const gold = element('gold');
const status = element('battle-status');
const event = element('battle-event');
const allies = element('allies');
const hits = element('hits');
const playerHp = element('player-hp');
const enemyHp = element('enemy-hp');
let previousUi = '';

function updateUi(): void {
  const friendlyCount = battle.units.filter(unit => unit.side === 'friendly').length;
  const visibleGold = Math.floor(battle.gold);
  const remaining = battle.cooldowns.map(value => value > 0 ? value.toFixed(1) : '0');
  const ui = [battle.phase, visibleGold, ...remaining, friendlyCount, battle.hits, battle.playerHp, battle.enemyHp, battle.event].join('|');
  if (ui === previousUi) return;
  previousUi = ui;
  gold.textContent = String(visibleGold);
  allies.textContent = String(friendlyCount);
  hits.textContent = String(battle.hits);
  playerHp.textContent = `${battle.playerHp} / ${DEMO.playerBaseHp}`;
  enemyHp.textContent = `${battle.enemyHp} / ${DEMO.enemyBaseHp}`;
  event.textContent = battle.event;
  start.textContent = battle.phase === 'ready' ? 'Bắt đầu' : 'Chơi lại';
  slots.forEach(({ button, profile, label }, index) => {
    const state = battle.phase !== 'running' ? 'inactive' : battle.cooldowns[index] > 0 ? 'cooling' : battle.gold < profile.cost ? 'insufficient' : 'ready';
    button.dataset.state = state;
    button.disabled = !battle.canSummon(index);
    label.textContent = battle.phase === 'ready' ? 'Chờ bắt đầu'
      : battle.phase !== 'running' ? 'Trận đã kết thúc'
        : state === 'cooling' ? `Hồi chiêu ${remaining[index]}s`
          : state === 'insufficient' ? 'Chưa đủ Vàng' : 'Triệu hồi →';
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
