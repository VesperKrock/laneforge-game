import Phaser from 'phaser';
import { Battle, DEMO, UNIT_KINDS, TEMP_R1D_UNITS } from './game/Battle';
import type { Side, UnitKind } from './game/Battle';
import { BattleScene } from './game/BattleScene';
import { ACTIVE_WEAPONS, WEAPON_CATALOG, FAMILY_LABELS, describeCombatBehavior } from './game/WeaponCatalog';
import { compileBuild } from './game/UnitBuild';
import type { CompiledUnitProfile, UnitBuild } from './game/UnitBuild';
import './style.css';

function element<T extends HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing UI element: ${id}`);
  return result as T;
}

const battle = new Battle();
const start = element<HTMLButtonElement>('start');
const setup = element<HTMLButtonElement>('setup');
const selectionCount = element('selection-count');
const workshopControls = element<HTMLFieldSetElement>('workshop-controls');
const customSlot = element<HTMLSelectElement>('custom-slot');
const customWeapon = element<HTMLSelectElement>('custom-weapon');
const customOffhand = element<HTMLSelectElement>('custom-offhand');
let editorSlot = 0;
let loadedDraft = '';
let draftDirty = false;
let editorNotice = '';
const gripLabel = (p: CompiledUnitProfile) => p.gripMode === 'fixed_two_hand' ? 'Hai tay cố định · tay phụ trống'
  : p.shieldHp ? 'Một tay + Khiên' : p.gripMode === 'two_hand_grip' ? 'Cầm hai tay +30% · tay phụ trống' : 'Một tay · tay phụ trống';
const summaries = Array.from({ length: 5 }, (_, slot) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'build-summary';
  button.dataset.slot = String(slot);
  button.innerHTML = '<strong></strong><span></span><small></small><b>Sửa slot</b>';
  button.addEventListener('click', () => {
    if (battle.phase !== 'ready') return;
    selectEditor(slot);
    customWeapon.focus();
  });
  element('slot-summaries').append(button);
  return button;
});
for (const family of ['one_hand_slash', 'one_hand_pierce', 'one_hand_blunt', 'polearm', 'two_hand_heavy'] as const) {
  const group = document.createElement('optgroup');
  group.label = FAMILY_LABELS[family];
  for (const weapon of ACTIVE_WEAPONS.filter(item => item.animationFamily === family)) {
    const option = document.createElement('option');
    option.value = weapon.id;
    option.textContent = WEAPON_CATALOG.find(item => item.id === weapon.id)!.sourceName;
    group.append(option);
  }
  customWeapon.append(group);
}
customWeapon.value = 'axe';
function draftBuild(): UnitBuild {
  return { coreId: 'infantry_demo', equipment: { mainHand: customWeapon.value,
    offHand: customOffhand.value === 'shield' ? { kind: 'shield', shieldId: 'demo_shield' } : { kind: 'empty' },
  } };
}
function previewBuild(): void {
  const weapon = ACTIVE_WEAPONS.find(item => item.id === customWeapon.value)!;
  const fixed = weapon.gripClass !== 'one_hand';
  customOffhand.querySelector<HTMLOptionElement>('option[value="shield"]')!.disabled = fixed;
  if (fixed) customOffhand.value = 'empty';
  const p = compileBuild(draftBuild());
  element('grip-note').textContent = p.gripMode === 'fixed_two_hand' ? 'Vũ khí hai tay cố định · chiếm cả hai tay, không mang Khiên; không cộng thêm 30%.'
    : p.gripMode === 'two_hand_grip' ? 'Cầm hai tay (+30% damage vũ khí) · không mang Khiên.' : 'Một tay · không có bonus 30%.';
  element('custom-stats').textContent = `Bộ Binh demo · ${p.role} · HP thân ${p.hp} / HP Khiên ${p.shieldHp} · Damage mỗi hit ${p.damage} = lõi ${p.damagePhysicalCore} + vũ khí ${p.damagePhysicalWeaponBase} + bonus ${p.weaponBonus} (làm tròn) · Interval ${p.attackInterval}s · Windup ${p.windup}s · Tầm ${p.attackRange} · Tốc ${p.speed} · Giá ${p.cost} Vàng · CD ${p.cooldown}s`;
  element('custom-behavior').textContent = describeCombatBehavior(p.behavior);
}
function loadEditor(notice = ''): void {
  const profile = battle.getCustomProfile(editorSlot);
  customSlot.value = String(editorSlot);
  // A preset starts with a valid, unapplied Axe draft; no previous slot's draft leaks in.
  customWeapon.value = profile?.weaponId ?? 'axe';
  customOffhand.value = profile?.build.equipment.offHand.kind ?? 'empty';
  previewBuild();
  loadedDraft = JSON.stringify(draftBuild());
  draftDirty = false;
  editorNotice = notice;
}
function selectEditor(slot: number): void {
  if (slot === editorSlot) return;
  const notice = draftDirty ? `Đã bỏ nháp chưa áp dụng của slot ${editorSlot + 1}.` : '';
  editorSlot = slot;
  loadEditor(notice);
  updateUi();
}
customSlot.addEventListener('change', () => {
  if (battle.phase === 'ready') selectEditor(Number(customSlot.value));
});
for (const control of [customWeapon, customOffhand]) control.addEventListener('change', () => {
  if (battle.phase !== 'ready') return;
  previewBuild();
  draftDirty = JSON.stringify(draftBuild()) !== loadedDraft;
  editorNotice = '';
  updateUi();
});
element('apply-custom').addEventListener('click', () => {
  if (battle.setCustomBuild(editorSlot, draftBuild())) {
    loadEditor(`Đã áp dụng riêng slot ${editorSlot + 1}.`);
    updateUi();
  }
});
element('clear-custom').addEventListener('click', () => {
  if (battle.clearCustomBuild(editorSlot)) {
    loadEditor(`Đã trả riêng slot ${editorSlot + 1} về preset.`);
    updateUi();
  }
});
loadEditor();
let selected: UnitKind[] = [...battle.loadout];
const armory = UNIT_KINDS.map(kind => {
  const profile = TEMP_R1D_UNITS[kind];
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.kind = kind;
  button.textContent = `${profile.mark} · ${profile.name} · ${profile.cost} Vàng`;
  button.addEventListener('click', () => {
    if (battle.phase !== 'ready') return;
    if (selected.includes(kind)) selected = selected.filter(value => value !== kind);
    else if (selected.length < 5) selected = UNIT_KINDS.filter(value => selected.includes(value) || value === kind);
    if (selected.length === 5) battle.setLoadout(selected);
    updateUi();
  });
  element('armory-choices').append(button);
  return { button, kind };
});
function prepareSlots(side: Side) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(`#${side === 'friendly' ? 'player' : 'bot'}-slots .slot`));
  if (buttons.length !== 5) throw new Error('Expected five slots per side');
  return buttons.map((button, index) => {
    if (side === 'enemy') {
      const number = document.createElement('span');
      number.className = 'slot-number'; number.textContent = String(index + 1).padStart(2, '0');
      button.prepend(number);
      const note = document.createElement('small'); note.className = 'slot-note';
      button.querySelector('.slot-cooldown')!.before(note);
    }
    if (side === 'friendly') button.addEventListener('click', () => { battle.summon('friendly', index); updateUi(); });
    return { button, label: button.querySelector<HTMLElement>('.slot-cooldown')! };
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
  const customs = battle.loadout.map((_, slot) => battle.getCustomProfile(slot));
  const customKey = customs.map(p => p ? `${p.weaponId}:${p.shieldHp}` : '').join(',');
  const ui = [battle.phase, customKey, editorSlot, draftDirty, editorNotice, selected.join(','), battle.loadout.join(','), Math.floor(battle.gold.friendly), Math.floor(battle.gold.enemy), ...remaining.friendly, ...remaining.enemy, ...ready.friendly, ...ready.enemy, highlighted, battle.botChoice?.at, friendlyCount, battle.hits, battle.playerHp, battle.enemyHp, battle.event].join('|');
  if (ui === previousUi) return;
  previousUi = ui;
  gold.textContent = String(Math.floor(battle.gold.friendly));
  botGold.textContent = String(Math.floor(battle.gold.enemy));
  botChoice.textContent = battle.botChoice ? `Bot: ${battle.getSlotProfile(battle.botChoice.slot).name} · ${battle.botChoice.reason}` : 'Bot chưa triệu hồi.';
  allies.textContent = String(friendlyCount);
  hits.textContent = String(battle.hits);
  playerHp.textContent = `${battle.playerHp} / ${DEMO.baseHp}`;
  enemyHp.textContent = `${battle.enemyHp} / ${DEMO.baseHp}`;
  event.textContent = battle.event;
  start.textContent = battle.phase === 'ready' ? 'Bắt đầu' : 'Chơi lại';
  start.disabled = battle.phase === 'ready' && selected.length !== 5;
  setup.disabled = battle.phase === 'ready';
  workshopControls.disabled = battle.phase !== 'ready';
  element('custom-status').textContent = `${customs.filter(Boolean).length}/5 Custom · Player/Bot dùng cùng năm bản thiết kế, cùng chỉ số, Vàng và CD.`;
  element('editor-title').textContent = `Sửa slot ${editorSlot + 1} · Bộ Binh demo`;
  element('draft-status').textContent = `${editorNotice} ${battle.phase !== 'ready' ? 'Đội hình đã khóa; nháp không dùng trong trận.'
    : draftDirty ? `Slot ${editorSlot + 1}: Nháp chưa áp dụng — bấm Dùng bản lắp ráp để thay slot này.`
      : customs[editorSlot] ? `Slot ${editorSlot + 1}: Đang xem bản đã áp dụng.`
        : `Slot ${editorSlot + 1}: Đang dùng Preset. Nháp Rìu gợi ý chưa áp dụng.`}`.trim();
  element<HTMLButtonElement>('clear-custom').disabled = battle.phase !== 'ready' || !customs[editorSlot];
  summaries.forEach((button, slot) => {
    const p = battle.getSlotProfile(slot), custom = customs[slot];
    button.setAttribute('aria-pressed', String(slot === editorSlot));
    button.querySelector('strong')!.textContent = `Slot ${slot + 1} · ${custom ? 'Custom' : 'Preset'}`;
    button.querySelector('span')!.textContent = p.name;
    button.querySelector('small')!.textContent = `${custom ? gripLabel(custom) : 'Trang bị preset cố định'} · ${p.cost} Vàng · CD ${p.cooldown}s`;
    button.querySelector('b')!.textContent = slot === editorSlot ? 'Đang sửa slot này' : `Sửa slot ${slot + 1}`;
  });
  selectionCount.textContent = battle.phase === 'ready' ? `Đã chọn ${selected.length}/5 · Bỏ một loại để thay quân.` : 'Đội hình đã khóa · Chơi lại giữ nguyên năm slot.';
  for (const { button, kind } of armory) {
    button.setAttribute('aria-pressed', String(selected.includes(kind)));
    button.disabled = battle.phase !== 'ready' || (!selected.includes(kind) && selected.length === 5);
  }
  for (const side of ['friendly', 'enemy'] as const) slots[side].forEach(({ button, label }, index) => {
    const custom = customs[index];
    const kind = custom ? `custom:${custom.weaponId}:${custom.shieldHp}` : battle.loadout[index];
    const profile = battle.getSlotProfile(index);
    if (button.dataset.unitType !== kind) {
      button.dataset.unitType = kind;
      button.querySelector('.unit-symbol')!.textContent = profile.mark;
      button.querySelector('strong')!.textContent = profile.name;
      button.querySelector('.slot-price')!.textContent = `${profile.cost} Vàng · ${profile.cooldown}s CD`;
      const note = button.querySelector('.slot-note');
      if (note) note.textContent = `${custom ? `Custom · HP Khiên ${custom.shieldHp}` : 'Preset'} · HP ${profile.hp} · DMG ${profile.damage} · Nhịp ${profile.attackInterval}s · Tầm ${profile.attackRange} · Tốc ${profile.speed}`;
    }
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

start.addEventListener('click', () => {
  if (battle.phase === 'ready' && selected.length !== 5) return;
  battle.start(); updateUi();
});
setup.addEventListener('click', () => {
  battle.prepare(); selected = [...battle.loadout];
  loadEditor(draftDirty ? 'Đã bỏ nháp chưa áp dụng; đang xem đội hình dùng trong trận.' : 'Đã về chuẩn bị; giữ nguyên năm slot.');
  updateUi();
});
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
