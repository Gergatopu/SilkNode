/** Great-circle distance on the mean-radius sphere; results stay unrounded in calculations. */
export function distance(a, b) {
  const rad = Math.PI / 180,
    dlat = (b.lat - a.lat) * rad,
    dlon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2;
  return (
    6371.0088 *
    2 *
    Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)))
  );
}
export const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export function decode(code, n) {
  const p = String(code)
    .padStart(n - 1, "0")
    .split("")
    .map(Number);
  return [0, ...p, 0];
}
export function factorial(n) {
  let x = 1;
  for (let i = 2; i <= n; i++) x *= i;
  return x;
}
/** Exhaustive permutation enumeration, fixed origin and reversed-cycle deduplication.
 * No heuristic or library solver: all canonical permutations are evaluated.
 * O(n * (n-1)!) time; stores a compact trace so every attempted cycle is inspectable. */
export function solve(cities, edgeList, onProgress = () => {}, weightMatrix = null, referenceMatrix = null) {
  const n = cities.length;
  if (n < 5 || n > 10) throw Error("Selecciona entre 5 y 10 ciudades.");
  const edges = new Set(edgeList),
    total = factorial(n - 1) / 2,
    codes = new Uint32Array(total),
    costs = new Float64Array(total);
  costs.fill(NaN);
  const matrix = weightMatrix ?? cities.map((a) => cities.map((b) => distance(a, b)));
  if (matrix.length !== n || matrix.some((row, i) => row.length !== n || row.some((v, j) => !Number.isFinite(v) || v < 0 || Math.abs(v - matrix[j]?.[i]) > 1e-7)))
    throw Error('La matriz debe ser finita, no negativa y simétrica.');
  const perm = Array.from({ length: n - 1 }, (_, i) => i + 1);
  const reference = { cost: Infinity, code: null, missing: [] };
  let count = 0,
    best = Infinity,
    minMissing = Infinity,
    suggestion = [],
    valid = [];
  function evaluate() {
    if (perm[0] > perm[n - 2]) return;
    let prev = 0,
      cost = 0,
      code = 0,
      missing = [];
    for (const next of [...perm, 0]) {
      cost += matrix[prev][next];
      if (!edges.has(edgeKey(cities[prev].id, cities[next].id)))
        missing.push(edgeKey(cities[prev].id, cities[next].id));
      prev = next;
    }
    for (const p of perm) code = code * 10 + p;
    if (referenceMatrix) {
      const route = [0, ...perm, 0];
      const value = route.slice(1).reduce((sum, next, i) => sum + referenceMatrix[route[i]][next], 0);
      if (value < reference.cost || (value === reference.cost && missing.length < reference.missing.length)) {
        reference.cost = value; reference.code = code; reference.missing = [...missing];
      }
    }
    codes[count] = code;
    if (!missing.length) {
      costs[count] = cost;
      valid.push(count);
      best = Math.min(best, cost);
    } else if (missing.length < minMissing) {
      minMissing = missing.length;
      suggestion = missing;
    }
    count++;
    if (count % 5000 === 0) onProgress(count, total);
  }
  const used = new Set();
  function visit(k) {
    if (k === perm.length) {
      evaluate();
      return;
    }
    for (let value = 1; value < n; value++) {
      if (used.has(value)) continue;
      perm[k] = value;
      used.add(value);
      visit(k + 1);
      used.delete(value);
    }
  }
  visit(0);
  const lexicographic = Uint32Array.from(valid);
  valid.sort((a, b) => costs[a] - costs[b] || codes[a] - codes[b]);
  const sorted = Uint32Array.from(valid);
  let optimalCount = 0;
  for (const i of sorted) {
    if (Math.abs(costs[i] - best) < 1e-7) optimalCount++;
    else break;
  }
  return {
    codes,
    costs,
    sorted,
    lexicographic,
    best,
    optimalCount,
    suggestion: valid.length ? [] : suggestion,
    matrix,
    total,
    reference: referenceMatrix ? reference : null,
  };
}
