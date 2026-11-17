const Cube = require('cubejs');

function solveFaceletsDetailed(facelets, maxDepth = 22) {
  if (typeof facelets !== 'string' || facelets.length !== 54) {
    throw new TypeError('A cube facelet string must contain exactly 54 characters.');
  }
  if (!/^[URFDLB]+$/.test(facelets)) {
    throw new TypeError('Facelet strings may only contain the six cube face letters U, R, F, D, L, and B.');
  }

  const parsed = Cube.fromString(facelets);
  const detail = { solution: '', phase1Length: null, phase2Length: 0, totalMoves: 0 };
  const solution = parsed.solveUpright(maxDepth, detail);
  const finalSolution = typeof solution === 'string' ? solution.trim() : '';

  if (detail.totalMoves === 0 && finalSolution) {
    detail.totalMoves = finalSolution.split(/\s+/).filter(Boolean).length;
  }
  if (detail.phase1Length === null && detail.totalMoves > 0) {
    detail.phase1Length = 0;
  }
  detail.phase2Length = Math.max(0, detail.totalMoves - (detail.phase1Length ?? 0));

  return {
    solution: finalSolution,
    phase1Length: detail.phase1Length ?? 0,
    phase2Length: detail.phase2Length,
    totalMoves: detail.totalMoves
  };
}

module.exports = { Cube, solveFaceletsDetailed };
