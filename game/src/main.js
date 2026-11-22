// main.js — one job: wire the table together. Turn flow, clicks, the reveal
// beat, and the ?shot= scenes for screenshots.
import { ELEMENTS } from './deck.js';
import { resolveClash } from './rules.js';
import { chooseCard } from './ai.js';
import { SCREEN_OVER, SCREEN_PLAY, checkWinner, newGame, nextRound } from './state.js';
import { announce, flashLife, renderAll, renderEnd } from './render.js';
import { stageShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const REVEAL_MS = 650;

let game = newGame();

function addLog(html) {
  game.log.push(html);
}

function describeCard(card, power, surged, advantage) {
  const info = ELEMENTS[card.element];
  const bits = [`<b>${card.name}</b> ${info.glyph} ${power}`];
  if (advantage) bits.push('element +2');
  if (surged) bits.push('Surge +1');
  return bits.join(' · ');
}

/** Run one clash after both cards are on the table. */
function resolveTurn() {
  const playerCard = game.playerPlayed;
  const rivalCard = game.rivalPlayed;
  const playerSurged = game.player.lastElement === playerCard.element;
  const rivalSurged = game.rival.lastElement === rivalCard.element;
  const result = resolveClash(playerCard, rivalCard, playerSurged, rivalSurged);
  const playerAdv = ELEMENTS[playerCard.element].beats === rivalCard.element;
  const rivalAdv = ELEMENTS[rivalCard.element].beats === playerCard.element;

  if (result.winner === 'player') {
    game.rival.life -= result.damage;
    game.player.clashesWon += 1;
    game.lastClash = { text: `You win the clash! Marlowe takes ${result.damage} damage.`, tone: 'win' };
    addLog(`${describeCard(playerCard, result.playerPower, playerSurged, playerAdv)} beats ${describeCard(rivalCard, result.rivalPower, rivalSurged, rivalAdv)} — <b>Marlowe −${result.damage} life</b>`);
    flashLife('rival');
  } else if (result.winner === 'rival') {
    game.player.life -= result.damage;
    game.rival.clashesWon += 1;
    game.lastClash = { text: `Marlowe wins the clash. You take ${result.damage} damage.`, tone: 'lose' };
    addLog(`${describeCard(rivalCard, result.rivalPower, rivalSurged, rivalAdv)} beats ${describeCard(playerCard, result.playerPower, playerSurged, playerAdv)} — <b>You −${result.damage} life</b>`);
    flashLife('player');
  } else {
    game.lastClash = { text: `A dead-even clash — ${result.playerPower} against ${result.playerPower}. No damage.`, tone: '' };
    addLog(`${describeCard(playerCard, result.playerPower, playerSurged, playerAdv)} ties ${describeCard(rivalCard, result.rivalPower, rivalSurged, rivalAdv)} — no damage`);
  }
  game.player.lastElement = playerCard.element;
  game.rival.lastElement = rivalCard.element;
  announce(game.lastClash.text);
  renderAll(game, onPlayCard);

  window.setTimeout(() => {
    const winner = checkWinner(game);
    if (winner) {
      game.screen = SCREEN_OVER;
      game.phase = 'over';
      renderEnd(game, winner);
      renderAll(game, onPlayCard);
      announce(winner === 'player' ? 'Victory! You won the duel.' : winner === 'rival' ? 'Defeat. Marlowe won the duel.' : 'The duel ends in a draw.');
      return;
    }
    nextRound(game);
    game.lastClash = { text: 'Play a card to clash', tone: '' };
    renderAll(game, onPlayCard);
  }, 1400);
}

/** Player clicks a card: pay energy, Marlowe answers, reveal, resolve. */
function onPlayCard(card) {
  if (game.screen !== SCREEN_PLAY || game.phase !== 'await-play') return;
  if (card.cost > game.player.energy) return;
  const rivalCard = chooseCard(game.rival.hand, game.rival.energy, game.rival.life, game.player.life, game.player.lastElement);
  if (!rivalCard) return;
  game.player.energy -= card.cost;
  game.rival.energy -= rivalCard.cost;
  game.player.hand = game.player.hand.filter((c) => c.id !== card.id);
  game.rival.hand = game.rival.hand.filter((c) => c.id !== rivalCard.id);
  game.playerPlayed = card;
  game.rivalPlayed = rivalCard;
  game.phase = 'reveal';
  game.lastClash = { text: 'Cards down… reveal!', tone: '' };
  renderAll(game, onPlayCard);
  window.setTimeout(resolveTurn, REVEAL_MS);
}

function startDuel() {
  game = newGame();
  game.screen = SCREEN_PLAY;
  renderAll(game, onPlayCard);
  announce('The duel begins. Play a card.');
}

function wireButtons() {
  $('start-btn').addEventListener('click', startDuel);
  $('again-btn').addEventListener('click', startDuel);
  $('new-game-btn').addEventListener('click', startDuel);
}

wireButtons();

// Screenshot scenes: ?shot=title|play|win|loss stages a real game state.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  game = stageShot(shot);
  renderAll(game, onPlayCard);
  if (game.screen === SCREEN_OVER) renderEnd(game, game.shotWinner);
  window.__shotReady = true;
} else {
  renderAll(game, onPlayCard);
}
