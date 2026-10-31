import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  solve,
  distance,
  edgeKey,
  decode,
  factorial,
} from "../src/algorithm.js";
const data = JSON.parse(
  readFileSync(new URL("../public/data/cities.json", import.meta.url)),
);
const cities = data.peru.cities.slice(0, 5);
const complete = (cs) =>
  cs.flatMap((a, i) => cs.slice(i + 1).map((b) => edgeKey(a.id, b.id)));
function independent(cs, edges) {
  const allowed = new Set(edges),
    others = cs.slice(1);
  let best = Infinity,
    count = 0;
  function walk(path, remaining) {
    if (!remaining.length) {
      const route = [cs[0], ...path, cs[0]];
      let cost = 0;
      for (let i = 1; i < route.length; i++) {
        if (!allowed.has(edgeKey(route[i - 1].id, route[i].id))) return;
        cost += distance(route[i - 1], route[i]);
      }
      count++;
      best = Math.min(best, cost);
      return;
    }
    remaining.forEach((c, i) =>
      walk(
        [...path, c],
        remaining.filter((_, j) => i !== j),
      ),
    );
  }
  walk([], others);
  return { best, count: count / 2 };
}
test("Haversine: same location, symmetry, quarter circumference and dateline", () => {
  assert.equal(distance({ lat: 0, lon: 0 }, { lat: 0, lon: 0 }), 0);
  assert.ok(
    Math.abs(distance({ lat: 0, lon: 0 }, { lat: 0, lon: 90 }) - 10007.557221) <
      0.001,
  );
  assert.ok(distance({ lat: 0, lon: 179 }, { lat: 0, lon: -179 }) < 223);
  assert.equal(distance(cities[0], cities[1]), distance(cities[1], cities[0]));
});
test("5-city complete graph has 12 unique cycles and exact independent optimum", () => {
  const edges = complete(cities),
    r = solve(cities, edges),
    oracle = independent(cities, edges);
  assert.equal(r.total, 12);
  assert.equal(r.sorted.length, 12);
  assert.equal(new Set(r.codes).size, 12);
  assert.ok(Math.abs(r.best - oracle.best) < 1e-7);
  for (const code of r.codes) {
    const p = decode(code, 5);
    assert.equal(p.length, 6);
    assert.equal(p[0], 0);
    assert.equal(p[5], 0);
    assert.equal(new Set(p.slice(0, -1)).size, 5);
    assert.ok(p[1] < p[4]);
  }
  for (let i = 1; i < r.sorted.length; i++)
    assert.ok(r.costs[r.sorted[i]] >= r.costs[r.sorted[i - 1]]);
});
test("sparse ring has exactly one cycle; missing-edge suggestion repairs it minimally", () => {
  const ring = cities.map((c, i) => edgeKey(c.id, cities[(i + 1) % 5].id));
  assert.equal(solve(cities, ring).sorted.length, 1);
  const incomplete = ring.slice(0, -1),
    r = solve(cities, incomplete);
  assert.equal(r.sorted.length, 0);
  assert.equal(r.suggestion.length, 1);
  assert.ok(solve(cities, [...incomplete, ...r.suggestion]).sorted.length > 0);
});
test("no edges needs exactly n new edges; disconnected graph handled", () => {
  const r = solve(cities, []);
  assert.equal(r.best, Infinity);
  assert.equal(r.suggestion.length, 5);
  assert.ok(solve(cities, r.suggestion).sorted.length > 0);
});
test("ties preserved and reverse cycles deduplicated", () => {
  const same = cities.map((c) => ({ ...c, lat: 0, lon: 0 })),
    r = solve(same, complete(same));
  assert.equal(r.optimalCount, 12);
  assert.equal(r.best, 0);
});
test("10-city limit enumerates 181440 cycles without numerical encoding loss", () => {
  const cs = data.china.cities.slice(0, 10),
    r = solve(cs, complete(cs));
  assert.equal(r.total, 181440);
  assert.equal(r.sorted.length, 181440);
  assert.equal(new Set(r.codes).size, 181440);
  for (const i of [0, 95000, 181439])
    assert.equal(new Set(decode(r.codes[i], 10).slice(0, -1)).size, 10);
});
test("multiple sparse networks match independent exhaustive oracle", () => {
  for (let k = 0; k < 10; k++) {
    const edges = complete(cities).filter((_, i) => (i * 7 + k * 3) % 11 > 2),
      r = solve(cities, edges),
      oracle = independent(cities, edges);
    assert.equal(r.sorted.length, oracle.count);
    assert.ok(r.best === oracle.best || Math.abs(r.best - oracle.best) < 1e-7);
    if (!r.sorted.length)
      assert.ok(solve(cities, [...edges, ...r.suggestion]).sorted.length > 0);
  }
});
test("all five scenarios have 20 unique valid coordinate pairs", () => {
  assert.equal(Object.keys(data).length, 5);
  for (const region of Object.values(data)) {
    assert.equal(region.cities.length, 20);
    assert.equal(new Set(region.cities.map((c) => c.id)).size, 20);
    region.cities.forEach((c) => {
      assert.ok(Number.isFinite(c.lon) && Math.abs(c.lon) <= 180);
      assert.ok(Number.isFinite(c.lat) && Math.abs(c.lat) <= 90);
    });
  }
});
test("input size validation", () => {
  assert.throws(() => solve(cities.slice(0, 4), []));
  assert.throws(() => solve(data.china.cities.slice(0, 11), []));
  assert.equal(factorial(9) / 2, 181440);
});

test('canonical candidates and valid cycles are truly lexicographic', () => {
 const r=solve(cities,complete(cities));
 for(let i=1;i<r.codes.length;i++) assert.ok(r.codes[i]>r.codes[i-1]);
 assert.deepEqual(Array.from(r.lexicographic),Array.from({length:12},(_,i)=>i));
});
test('explicit cost matrix controls optimum instead of geographical perimeter', () => {
 const matrix=cities.map((_,i)=>cities.map((_,j)=>i===j?0:90));
 const path=[0,2,4,1,3,0];
 for(let i=1;i<path.length;i++)matrix[path[i-1]][path[i]]=matrix[path[i]][path[i-1]]=1;
 const r=solve(cities,complete(cities),()=>{},matrix);
 assert.equal(r.best,5);assert.equal(r.optimalCount,1);
 const actual=decode(r.codes[r.sorted[0]],5);
 assert.deepEqual(actual,path);
 assert.throws(()=>solve(cities,complete(cities),()=>{},matrix.map((row,i)=>row.map((v,j)=>i===0&&j===1?-1:v))));
});
test('weighted incomplete graph suggestion preserves existing links and is minimal', () => {
 const es=complete(cities).filter(k=>!k.includes(cities[0].id));
 const matrix=cities.map((_,i)=>cities.map((_,j)=>i===j?0:12));
 const r=solve(cities,es,()=>{},matrix);
 assert.equal(r.sorted.length,0);assert.equal(r.suggestion.length,2);
 assert.ok(solve(cities,[...es,...r.suggestion],()=>{},matrix).sorted.length>0);
});
