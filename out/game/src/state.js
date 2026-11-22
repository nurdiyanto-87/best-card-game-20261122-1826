// state.js — one job: the duel's state. Who holds what, whose turn it is,
// and when the duel is over.
import { buildDeck, drawCards, shuffle } from './deck.js';
import { HAND_SIZE, START_LIFE, energyForRound } from './rules.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

/** A fresh duel. Pass a seeded random for a deterministic deal. */
export function newGame(random = Math.random) {
  const playerDeck = shuffle(buildDeck(), random);
  const rivalDeck = shuffle(buildDeck(), random);
  const game = {
    screen: SCREEN_TITLE,
    phase: 'await-play',
    round: 1,
    player: {
      life: START_LIFE,
      deck: playerDeck,
      hand: [],
      energy: energyForRound(1),
      maxEnergy: energyForRound(1),
      lastElement: null,
      clashesWon: 0,
    },
    rival: {
      life: START_LIFE,
      deck: rivalDeck,
      hand: [],
      energy: energyForRound(1),
      maxEnergy: energyForRound(1),
      lastElement: null,
      clashesWon: 0,
    },
    playerPlayed: null,
    rivalPlayed: null,
    lastClash: null,
    log: [],
  };
  game.player.hand = drawCards(game.player.deck, HAND_SIZE);
  game.rival.hand = drawCards(game.rival.deck, HAND_SIZE);
  return game;
}

/** Refill one side's hand to 5 cards and set its energy for the new round. */
export function startRound(game, side) {
  const duelist = game[side];
  duelist.energy = energyForRound(game.round);
  duelist.maxEnergy = duelist.energy;
  const missing = HAND_SIZE - duelist.hand.length;
  if (missing > 0) duelist.hand.push(...drawCards(duelist.deck, missing));
}

/** True when a side has no cards left anywhere. */
export function isDeckOut(game, side) {
  return game[side].deck.length === 0 && game[side].hand.length === 0;
}

/**
 * Decide the duel's end: life at 0, or both decks out (higher life wins).
 * Returns 'player' | 'rival' | 'tie' | null.
 */
export function checkWinner(game) {
  if (game.player.life <= 0 && game.rival.life <= 0) return 'tie';
  if (game.player.life <= 0) return 'rival';
  if (game.rival.life <= 0) return 'player';
  if (isDeckOut(game, 'player') && isDeckOut(game, 'rival')) {
    if (game.player.life === game.rival.life) return 'tie';
    return game.player.life > game.rival.life ? 'player' : 'rival';
  }
  return null;
}

/** Advance to the next round: round counter up, both sides refilled. */
export function nextRound(game) {
  game.round += 1;
  game.playerPlayed = null;
  game.rivalPlayed = null;
  startRound(game, 'player');
  startRound(game, 'rival');
  game.phase = 'await-play';
}
