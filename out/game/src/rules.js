// rules.js — one job: the clash rules. Element wheel, Surge combos, damage.
import { ELEMENTS } from './deck.js';

/** True when element `a` beats element `b` on the wheel. */
export function beats(a, b) {
  return ELEMENTS[a].beats === b;
}

/**
 * Effective power of a card in a clash: base power, +2 when its element beats
 * the foe's element, +1 Surge when the player played the same element last round.
 */
export function clashPower(card, foeCard, surged) {
  let power = card.power;
  if (foeCard && beats(card.element, foeCard.element)) power += 2;
  if (surged) power += 1;
  return power;
}

/**
 * Resolve one clash. Returns { winner: 'player' | 'rival' | 'tie',
 * playerPower, rivalPower, damage } — damage is dealt to the loser.
 */
export function resolveClash(playerCard, rivalCard, playerSurged, rivalSurged) {
  const playerPower = clashPower(playerCard, rivalCard, playerSurged);
  const rivalPower = clashPower(rivalCard, playerCard, rivalSurged);
  if (playerPower === rivalPower) return { winner: 'tie', playerPower, rivalPower, damage: 0 };
  if (playerPower > rivalPower) {
    return { winner: 'player', playerPower, rivalPower, damage: playerPower - rivalPower };
  }
  return { winner: 'rival', playerPower, rivalPower, damage: rivalPower - playerPower };
}

/** Energy available on a round: starts at 3, grows by 1, caps at 7. */
export function energyForRound(round) {
  return Math.min(3 + round - 1, 7);
}

/** Starting life for both duelists. */
export const START_LIFE = 20;

/** Starting hand size. */
export const HAND_SIZE = 5;
