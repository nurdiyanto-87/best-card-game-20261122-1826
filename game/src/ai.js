// ai.js — one job: Marlowe's choices. A readable opponent: it favours the
// element that beats what you played last round, spends efficiently, and
// stops holding back its big cards when it is behind on life.
import { beats } from './rules.js';

/**
 * Pick a card from `hand` the rival can afford with `energy`.
 * `foeLastElement` is the element you played last round (null on round 1).
 * Returns the chosen card, or null when nothing is affordable.
 */
export function chooseCard(hand, energy, myLife, foeLife, foeLastElement) {
  const affordable = hand.filter((card) => card.cost <= energy);
  if (affordable.length === 0) return null;
  const behind = myLife < foeLife;
  let best = null;
  let bestScore = -Infinity;
  for (const card of affordable) {
    let score = card.power - card.cost * 0.6;
    // Counter-play: Marlowe reads your last element and answers it.
    if (foeLastElement && beats(card.element, foeLastElement)) score += 2.5;
    // When behind, stop saving the big cards — play for the win now.
    if (behind && card.power >= 7) score += 1.5;
    // When ahead, prefer cheap efficient cards and keep the heavies in hand.
    if (!behind && card.cost >= 4) score -= 1;
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}
