import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {scenarioWeights,randomGraph,updateRandomGraph} from '../src/weights.js';
import {edgeKey} from '../src/algorithm.js';
const raw=readFileSync(new URL('../public/data/cities.json',import.meta.url));
const data=JSON.parse(raw);
const validateWeight=v=>Number.isInteger(v)&&v>=1&&v<=90;
test('original 100 cities are preserved byte for byte',()=>{
 assert.equal(createHash('sha1').update(raw).digest('hex'),'3b75088814eaecd5a2d5482c8c37cc8100147147');
});
test('fixed costs have 190 deterministic symmetric integer weights between 1 and 90',()=>{
 for(const {cities} of Object.values(data)){
  const w=scenarioWeights(cities);
  assert.equal(Object.keys(w).length,190);assert.ok(Object.values(w).every(validateWeight));assert.equal(Math.max(...Object.values(w)),90);
  assert.deepEqual(w,scenarioWeights(cities));
  assert.equal(w[edgeKey(cities[0].id,cities[1].id)],w[edgeKey(cities[1].id,cities[0].id)]);
 }
});
test('random graph is reproducible, bounded, non-directed and has no loops',()=>{
 const ids=data.peru.cities.slice(0,10).map(c=>c.id);
 for(const seed of [0,1,42,4294967295]){
  const a=randomGraph(ids,seed);assert.deepEqual(a,randomGraph(ids,seed));
  assert.equal(new Set(a.edges).size,a.edges.length);assert.ok(a.edges.length<=45);

  for(const key of a.edges){const [x,y]=key.split('|');assert.notEqual(x,y);assert.ok(ids.includes(x)&&ids.includes(y));}
 }
});
test('random generation never changes the fixed scenario costs',()=>{
 const cs=data.europe.cities, before=scenarioWeights(cs);
 for(const seed of [1,6,42])randomGraph(cs.slice(0,10).map(c=>c.id),seed);
 assert.deepEqual(scenarioWeights(cs),before);
});

test('random mode waits for five cities and preserves existing pairs when growing',()=>{
 const ids=['z','y','x','w','v'];
 for(let n=0;n<5;n++)assert.deepEqual(randomGraph(ids.slice(0,n),42).edges,[]);
 const first=updateRandomGraph(ids,ids.slice(0,4),[],42).edges;
 assert.ok(first.length>0);
 const custom=new Set(first);custom.add(edgeKey('z','y'));custom.delete(edgeKey('x','w'));
 const grown=updateRandomGraph(['a',...ids],ids,custom,42).edges;
 assert.deepEqual(new Set(grown.filter(k=>!k.split('|').includes('a'))),custom);
 assert.deepEqual(new Set(updateRandomGraph(ids,['a',...ids],grown,42).edges),custom);
 assert.deepEqual(updateRandomGraph(ids.slice(0,4),ids,first,42).edges,[]);
});
test('random mode produces denser networks while allowing absent edges',()=>{
 const ids=['a','b','c','d','e'];let total=0, incomplete=0;
 for(let seed=0;seed<1000;seed++){const n=randomGraph(ids,seed).edges.length;total+=n;if(n<10)incomplete++;}
 assert.ok(total>7500&&total<8500);assert.ok(incomplete>0);
});
