import { solve } from "./algorithm.js";
self.onmessage = ({ data }) => {
  try {
    const r = solve(data.cities, data.edges, (done, total) =>
      self.postMessage({ type: "progress", done, total }), data.matrix);
    self.postMessage({ type: "result", result: r }, [
      r.codes.buffer,
      r.costs.buffer,
      r.sorted.buffer,
      r.lexicographic.buffer,
    ]);
  } catch (error) {
    self.postMessage({ type: "error", message: error.message });
  }
};
