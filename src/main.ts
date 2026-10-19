import Phaser from 'phaser';
import { Battle, DEMO } from './game/Battle';
import { BattleScene } from './game/BattleScene';
import './style.css';

function element<T extends HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing UI element: ${id}`);
  return result as T;
}

const battle = new Battle();
const start = element<HTMLButtonElement>('start');
const summon = element<HTMLButtonElement>('summon');
const gold = element('gold');
const cooldown = element('cooldown');
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
  const remaining = battle.cooldown > 0 ? battle.cooldown.toFixed(1) : '0';
  const ui = [battle.phase, visibleGold, remaining, friendlyCount, battle.hits, battle.playerHp, battle.enemyHp, battle.event].join('|');
  if (ui === previousUi) return;
  previousUi = ui;
  gold.textContent = String(visibleGold);
  allies.textContent = String(friendlyCount);
  hits.textContent = String(battle.hits);
  playerHp.textContent = `${battle.playerHp} / ${DEMO.playerBaseHp}`;
  enemyHp.textContent = `${battle.enemyHp} / ${DEMO.enemyBaseHp}`;
  event.textContent = battle.event;
  start.textContent = battle.phase === 'ready' ? 'Bắt đầu' : 'Chơi lại';
  summon.disabled = !battle.canSummon;
  const labels = { ready: 'Sẵn sàng — bấm Bắt đầu', running: 'Đang giao chiến', won: 'Thắng — căn cứ địch đã bị phá', lost: 'Thua — căn cứ ta đã bị phá' };
  status.textContent = labels[battle.phase];
  status.dataset.phase = battle.phase;
  cooldown.textContent = battle.phase === 'ready' ? 'Chờ bắt đầu'
    : battle.phase !== 'running' ? 'Trận đã kết thúc'
      : battle.cooldown > 0 ? `Hồi chiêu ${remaining}s`
        : battle.gold < DEMO.summonCost ? 'Chưa đủ Vàng' : 'Triệu hồi →';
}

start.addEventListener('click', () => { battle.start(); updateUi(); });
summon.addEventListener('click', () => { battle.summon(); updateUi(); });
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
