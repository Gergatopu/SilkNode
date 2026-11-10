import { distance, edgeKey } from './algorithm.js';

export function hash(text) {
  let value = 2166136261;
  for (const c of text) value = Math.imul(value ^ c.charCodeAt(0), 16777619);
  return value >>> 0;
}
export function randomSource(seed) {
  let x = seed >>> 0;
  return () => {
    x += 0x6D2B79F5;
    let t = Math.imul(x ^ x >>> 15, 1 | x);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// Normalize against the full, immutable scenario, never the selected subset.
// All monetary values are illustrative, not estimates of real railway projects.
export function scenarioWeights(cities) {
  const pairs = [];
  cities.forEach((a, i) => cities.slice(i + 1).forEach(b => {
    const key = edgeKey(a.id, b.id), h = hash(key);
    const km = distance(a, b);
    // Corridor difficulty 0.55–2.50 plus an independent fixed infrastructure term.
    // Simulated pair-specific assumptions, never tuned after solving.
    const terrain = .55 + (h % 196) / 100;
    const infrastructure = 120 + ((h >>> 8) % 1301);
    const raw = km * terrain + infrastructure;
    pairs.push([key, raw]);
  }));
  const maximum = Math.max(1, ...pairs.map(([, v]) => v));
  return Object.fromEntries(pairs.map(([key, raw]) => [key, Math.max(1, Math.min(90, Math.round(90 * raw / maximum)))]));
}
export function randomGraph(ids, seed) {
  if (ids.length < 5) return { edges: [] };
  const edges = [];
  ids.forEach((a, i) => ids.slice(i + 1).forEach(b => {
    const key = edgeKey(a, b);
    if (randomSource(hash(`${seed}:${key}`))() < .8) edges.push(key);
  }));
  return { edges };
}

export function updateRandomGraph(ids, previousIds, existingEdges, seed) {
  if (ids.length < 5) return { edges: [] };
  if (previousIds.length < 5) return randomGraph(ids, seed);
  const active = new Set(ids), previous = new Set(previousIds);
  const edges = new Set([...existingEdges].filter(key => key.split('|').every(id => active.has(id))));
  for (const key of randomGraph(ids, seed).edges) {
    if (key.split('|').some(id => !previous.has(id))) edges.add(key);
  }
  return { edges: [...edges] };
}
