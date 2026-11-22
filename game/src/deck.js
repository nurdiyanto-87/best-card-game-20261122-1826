// deck.js — one job: build the 24-card deck, shuffle it, and draw hands.
// Every card is an original Ember & Tide creature with an element, a power and an energy cost.
export const ELEMENTS = {
  ember: { name: 'Ember', glyph: '▲', beats: 'leaf' },
  tide: { name: 'Tide', glyph: '●', beats: 'ember' },
  leaf: { name: 'Leaf', glyph: '◆', beats: 'stone' },
  stone: { name: 'Stone', glyph: '■', beats: 'tide' },
};

/** Card faces: [element, name, power, cost]. Powers 2-9, costs 1-4. */
const FACES = [
  ['ember', 'Spark Imp', 3, 1],
  ['ember', 'Cinder Fox', 5, 2],
  ['ember', 'Flame Drake', 7, 3],
  ['ember', 'Ash Phoenix', 9, 4],
  ['ember', 'Magma Bloom', 4, 2],
  ['ember', 'Wildfire', 8, 3],
  ['tide', 'Rain Sprite', 3, 1],
  ['tide', 'River Eel', 5, 2],
  ['tide', 'Coral Knight', 6, 3],
  ['tide', 'Wave Serpent', 8, 3],
  ['tide', 'Mist Heron', 4, 2],
  ['tide', 'Deep Kraken', 9, 4],
  ['leaf', 'Thorn Sprout', 2, 1],
  ['leaf', 'Vine Wolf', 5, 2],
  ['leaf', 'Moss Bear', 7, 3],
  ['leaf', 'Fern Archer', 4, 2],
  ['leaf', 'Oak Warden', 8, 4],
  ['leaf', 'Bloom Dragon', 9, 4],
  ['stone', 'Pebble Golem', 3, 1],
  ['stone', 'Quartz Bat', 4, 2],
  ['stone', 'Granite Ox', 6, 2],
  ['stone', 'Crystal Spider', 5, 2],
  ['stone', 'Basalt Titan', 8, 4],
  ['stone', 'Diamond Wurm', 9, 4],
];

/** Small deterministic PRNG so screenshot scenes replay the same deal. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fresh 24-card deck. Each card gets a unique id. */
export function buildDeck() {
  return FACES.map(([element, name, power, cost], index) => ({
    id: `card-${index}`,
    element,
    name,
    power,
    cost,
  }));
}

/** Fisher-Yates shuffle; pass a seeded random for deterministic deals. */
export function shuffle(deck, random = Math.random) {
  const cards = deck.slice();
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** Draw up to `count` cards from the front of the deck array. */
export function drawCards(deck, count) {
  return deck.splice(0, count);
}
