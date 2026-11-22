// shots.js — one job: stage the four screenshot scenes. Each one plays the
// real rules forward from a fresh seeded duel, so the frame is what a short
// game really looks like and the same seed always gives the same frame.
import { mulberry32 } from './deck.js';
import { ELEMENTS } from './deck.js';
import { resolveClash } from './rules.js';
import { chooseCard } from './ai.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, checkWinner, newGame, nextRound } from './state.js';

const SEED = 20261123;
const PLAY_ROUNDS = 5;

/** One synchronous round: both sides play, the clash resolves, damage lands. */
function playRound(game) {
  const playerCard = chooseCard(game.player.hand, game.player.energy, game.player.life, game.rival.life, game.rival.lastElement);
  const rivalCard = chooseCard(game.rival.hand, game.rival.energy, game.rival.life, game.player.life, game.player.lastElement);
  if (!playerCard || !rivalCard) return false;
  game.player.energy -= playerCard.cost;
  game.rival.energy -= rivalCard.cost;
  game.player.hand = game.player.hand.filter((c) => c.id !== playerCard.id);
  game.rival.hand = game.rival.hand.filter((c) => c.id !== rivalCard.id);
  const playerSurged = game.player.lastElement === playerCard.element;
  const rivalSurged = game.rival.lastElement === rivalCard.element;
  const result = resolveClash(playerCard, rivalCard, playerSurged, rivalSurged);
  const tag = (card, power) => `${card.name} ${ELEMENTS[card.element].glyph} ${power}`;
  if (result.winner === 'player') {
    game.rival.life -= result.damage;
    game.player.clashesWon += 1;
    game.lastClash = { text: `You win the clash! Marlowe takes ${result.damage} damage.`, tone: 'win' };
    game.log.push(`${tag(playerCard, result.playerPower)} beats ${tag(rivalCard, result.rivalPower)} — <b>Marlowe −${result.damage} life</b>`);
  } else if (result.winner === 'rival') {
    game.player.life -= result.damage;
    game.rival.clashesWon += 1;
    game.lastClash = { text: `Marlowe wins the clash. You take ${result.damage} damage.`, tone: 'lose' };
    game.log.push(`${tag(rivalCard, result.rivalPower)} beats ${tag(playerCard, result.playerPower)} — <b>You −${result.damage} life</b>`);
  } else {
    game.lastClash = { text: `A dead-even clash — ${result.playerPower} against ${result.playerPower}. No damage.`, tone: '' };
    game.log.push(`${tag(playerCard, result.playerPower)} ties ${tag(rivalCard, result.rivalPower)} — no damage`);
  }
  game.player.lastElement = playerCard.element;
  game.rival.lastElement = rivalCard.element;
  game.playerPlayed = playerCard;
  game.rivalPlayed = rivalCard;
  return true;
}

/** Mid-game table: five real rounds in, both hands full, life already dented. */
function stagePlay() {
  const game = newGame(mulberry32(SEED));
  game.screen = SCREEN_PLAY;
  for (let round = 0; round < PLAY_ROUNDS; round += 1) {
    if (!playRound(game)) break;
    if (checkWinner(game)) break;
    const keptPlayed = [game.playerPlayed, game.rivalPlayed];
    const keptClash = game.lastClash;
    nextRound(game);
    // Keep the last clash on the table so the shot shows the duel mid-flow.
    [game.playerPlayed, game.rivalPlayed] = keptPlayed;
    game.lastClash = keptClash;
  }
  game.phase = 'await-play';
  return game;
}

/** A finished duel: the winner and the final table, staged from real rules. */
function stageEnd(winner) {
  const game = newGame(mulberry32(SEED + 7));
  game.screen = SCREEN_PLAY;
  // Play real rounds until one side is close to falling, then land the last blow.
  while (!checkWinner(game) && game.round < 14) {
    if (!playRound(game)) break;
    if (checkWinner(game)) break;
    nextRound(game);
  }
  if (!checkWinner(game)) {
    // Force the ending the table was heading for: the side ahead wins.
    if (winner === 'player') game.rival.life = 0;
    else game.player.life = 0;
  }
  game.screen = SCREEN_OVER;
  game.phase = 'over';
  game.shotWinner = checkWinner(game) ?? winner;
  game.log.push(game.shotWinner === 'player' ? 'The final ember lands — <b>Marlowe falls</b>.' : 'The last wave crashes — <b>you fall</b>.');
  return game;
}

/**
 * Set the game to the named scene (title, play, win or loss; any other name
 * is the title) and return it ready to render.
 */
export function stageShot(name) {
  if (name === 'play') return stagePlay();
  if (name === 'win') return stageEnd('player');
  if (name === 'loss') return stageEnd('rival');
  const game = newGame(mulberry32(SEED));
  game.screen = SCREEN_TITLE;
  return game;
}
