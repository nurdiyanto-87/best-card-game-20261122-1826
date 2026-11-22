// render.js — one job: draw the duel state into the DOM. Hands, life bars,
// the clash zone, the log, and the title / end overlays.
import { ELEMENTS } from './deck.js';
import { SCREEN_OVER, SCREEN_TITLE } from './state.js';

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One face-up card element. `onClick` wires it when given. */
export function cardElement(card, onClick) {
  const info = ELEMENTS[card.element];
  const node = el('div', `card el-${card.element}`);
  node.dataset.cardId = card.id;
  node.append(el('span', 'cost', String(card.cost)));
  node.append(el('span', 'glyph', info.glyph));
  node.append(el('span', 'power', String(card.power)));
  node.append(el('span', 'power-label', 'POWER'));
  node.append(el('span', 'cname', card.name));
  node.append(el('span', 'element-name', info.name.toUpperCase()));
  if (onClick) node.addEventListener('click', () => onClick(card));
  return node;
}

/** One face-down rival card back. */
export function cardBackElement(key) {
  const node = el('div', 'card back');
  node.append(el('span', 'back-mark', '✦'));
  node.append(el('span', 'back-word', 'DUEL'));
  if (key !== undefined) node.dataset.key = key;
  return node;
}

function renderLife(side, game) {
  const duelist = game[side];
  const fill = $(`${side}-life-fill`);
  const num = $(`${side}-life-num`);
  fill.style.width = `${Math.max(0, (duelist.life / 20) * 100)}%`;
  fill.classList.toggle('low', duelist.life <= 6);
  num.textContent = String(Math.max(0, duelist.life));
  $(`${side}-deck`).textContent = `Deck ${duelist.deck.length}`;
}

function renderEnergy(game) {
  const row = $('energy-row');
  row.textContent = '';
  row.append(el('span', null, `Energy ${game.player.energy}/${game.player.maxEnergy}`));
  for (let i = 0; i < game.player.maxEnergy; i += 1) {
    row.append(el('span', i < game.player.energy ? 'energy-pip full' : 'energy-pip'));
  }
}

function renderPlayedSlot(slotId, card, animate) {
  const slot = $(slotId);
  slot.textContent = '';
  if (!card) {
    slot.append(el('span', 'slot-hint', slotId === 'rival-played' ? 'Rival plays here' : 'You play here'));
    return;
  }
  const node = cardElement(card);
  if (animate) node.classList.add('flip-in');
  slot.append(node);
}

function renderLog(game) {
  const log = $('battle-log');
  log.textContent = '';
  for (const line of game.log.slice(-3)) {
    const div = document.createElement('div');
    div.innerHTML = line;
    log.append(div);
  }
}

/** Draw the whole table for the current state. `onPlay` handles card clicks. */
export function renderAll(game, onPlay) {
  $('round-label').textContent = `Round ${game.round}`;
  $('clash-score').textContent = `Clashes won ${game.player.clashesWon} – ${game.rival.clashesWon}`;
  renderLife('player', game);
  renderLife('rival', game);
  renderEnergy(game);

  const rivalHand = $('rival-hand');
  rivalHand.textContent = '';
  game.rival.hand.forEach((card, i) => rivalHand.append(cardBackElement(i)));

  const playerHand = $('player-hand');
  playerHand.textContent = '';
  const canPlay = game.screen === 'play' && game.phase === 'await-play';
  for (const card of game.player.hand) {
    const node = cardElement(card, canPlay ? onPlay : null);
    if (canPlay && card.cost > game.player.energy) node.classList.add('unaffordable');
    playerHand.append(node);
  }

  renderPlayedSlot('rival-played', game.rivalPlayed, game.phase === 'reveal');
  renderPlayedSlot('player-played', game.playerPlayed, game.phase === 'reveal');
  if (game.lastClash) {
    const clash = $('clash-result');
    clash.textContent = game.lastClash.text;
    clash.className = `clash-result ${game.lastClash.tone}`;
  }
  renderLog(game);

  $('title-screen').classList.toggle('hidden', game.screen !== SCREEN_TITLE);
  $('end-screen').classList.toggle('hidden', game.screen !== SCREEN_OVER);
}

/** Show the end overlay: win, loss, or a rare tie. */
export function renderEnd(game, winner) {
  const title = $('end-title');
  const glyph = $('end-glyph');
  const text = $('end-text');
  const stats = $('end-stats');
  const rounds = game.round;
  const score = `${game.player.clashesWon} – ${game.rival.clashesWon}`;
  if (winner === 'player') {
    title.textContent = 'VICTORY';
    title.classList.remove('lost');
    glyph.textContent = '▲';
    glyph.className = 'end-glyph win';
    text.innerHTML = 'Marlowe’s life runs dry. The table is yours —<br>the embers bow to you.';
    stats.textContent = `Duel won in ${rounds} rounds · Clashes ${score} · Life left ${Math.max(0, game.player.life)}`;
  } else if (winner === 'rival') {
    title.textContent = 'DEFEAT';
    title.classList.add('lost');
    glyph.textContent = '●';
    glyph.className = 'end-glyph lose';
    text.innerHTML = 'The tide takes the table this time.<br>Marlowe keeps the embers — for now.';
    stats.textContent = `Duel lost in ${rounds} rounds · Clashes ${score} · Life left ${Math.max(0, game.player.life)}`;
  } else {
    title.textContent = 'A DRAW';
    title.classList.remove('lost');
    glyph.textContent = '◆';
    glyph.className = 'end-glyph';
    text.textContent = 'Neither duelist yields. The table calls it even.';
    stats.textContent = `Duel drawn in ${rounds} rounds · Clashes ${score}`;
  }
}

/** Flash a side's life bar when it takes damage. */
export function flashLife(side) {
  const zone = $(`${side}-zone`);
  zone.classList.remove('flash');
  void zone.offsetWidth;
  zone.classList.add('flash');
}

/** Announce a line for screen readers. */
export function announce(text) {
  $('status').textContent = text;
}
