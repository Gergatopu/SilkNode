import test from 'node:test';
import assert from 'node:assert/strict';
import { manualClick } from '../src/graph.js';
import { solve, edgeKey } from '../src/algorithm.js';

test('manual builds edges from second click, keeps duplicates and permits disconnected pairs',()=>{
 let s={selected:[],edges:new Set(),start:null};
 const click=id=>s=manualClick(s.selected,s.edges,s.start,id);
 click('A');click('B');assert.deepEqual([...s.edges],['A|B']);
 click('C');click('D');assert.equal(s.edges.size,2);assert.equal(s.selected.length,4);
 click('A');click('B');assert.equal(s.edges.size,2);
 click('A');click('E');assert.ok(s.edges.has('A|E'));
 click('E');click('E');assert.equal(s.edges.size,3);
 for(const id of ['F','G','H','I','J'])click(id);
 click('K');assert.equal(s.selected.length,10);assert.match(s.message,/10/);
});
test('repair minimizes new edges then total cost; accepting improvement shows its optimum',()=>{
 const cs=Array.from({length:5},(_,i)=>({id:String(i)}));
 const ring=[0,1,2,3,4,0],keys=ring.slice(1).map((v,i)=>edgeKey(String(ring[i]),String(v)));
 const matrix=cs.map((_,i)=>cs.map((_,j)=>i===j?0:keys.includes(edgeKey(String(i),String(j)))?2:9));
 const empty=solve(cs,[],()=>{},matrix);
 assert.equal(empty.suggestion.length,5);assert.equal(empty.repairCost,10);
 const sparse=solve(cs,keys.slice(0,4),()=>{},matrix);
 assert.deepEqual(sparse.suggestion,[keys[4]]);assert.equal(sparse.repairCost,10);
 const other=[0,2,4,1,3,0],edges=other.slice(1).map((v,i)=>edgeKey(String(other[i]),String(v)));
 const r=solve(cs,edges,()=>{},matrix);assert.equal(r.best,45);assert.equal(r.improvement.cost,10);
 const repaired=solve(cs,[...edges,...r.improvement.missing],()=>{},matrix);
 assert.equal(repaired.best,10);assert.equal(repaired.improvement.missing.length,0);
});
