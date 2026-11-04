import { edgeKey } from './algorithm.js';

// Pure state transition: every two distinct clicks create one undirected edge.
export function manualClick(selected, edges, start, id) {
  if (!selected.includes(id) && selected.length >= 10)
    return { selected, edges, start, message: 'Máximo 10 ciudades. Mayús + clic para quitar una.' };
  const nodes = selected.includes(id) ? [...selected] : [...selected, id];
  if (!start) return { selected: nodes, edges: new Set(edges), start: id };
  if (start === id) return { selected: nodes, edges: new Set(edges), start: null, message: 'Elige dos ciudades distintas.' };
  const key = edgeKey(start, id), next = new Set(edges);
  const message = next.has(key) ? 'Esta conexión ya existe. Pulsa su arista para editarla.' : '';
  next.add(key);
  return { selected: nodes, edges: next, start: null, message };
}
