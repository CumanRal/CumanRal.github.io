const FACE_COLOR_MAP = {
  U: '#f3f0e8',
  D: '#f1d747',
  F: '#48bd79',
  B: '#568be0',
  R: '#ec574d',
  L: '#f09a49'
};

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createSvgLine(x1, y1, x2, y2, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  element.setAttribute('x1', String(x1));
  element.setAttribute('y1', String(y1));
  element.setAttribute('x2', String(x2));
  element.setAttribute('y2', String(y2));
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

function createStaticCubeIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 72 72');
  svg.setAttribute('class', 'solver-path-cube-icon');
  svg.setAttribute('aria-hidden', 'true');

  const top = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  top.setAttribute('points', '36,12 58,24 36,38 14,24');
  top.setAttribute('fill', '#f3f0e8');
  top.setAttribute('stroke', 'rgba(255,255,255,0.45)');
  top.setAttribute('stroke-width', '1.4');

  const left = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  left.setAttribute('points', '14,24 36,38 36,58 14,45');
  left.setAttribute('fill', '#f09a49');
  left.setAttribute('stroke', 'rgba(255,255,255,0.28)');
  left.setAttribute('stroke-width', '1.2');

  const right = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  right.setAttribute('points', '36,38 58,24 58,45 36,58');
  right.setAttribute('fill', '#48bd79');
  right.setAttribute('stroke', 'rgba(255,255,255,0.28)');
  right.setAttribute('stroke-width', '1.2');

  const front = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  front.setAttribute('points', '14,24 36,12 58,24 36,38');
  front.setAttribute('fill', '#ec574d');
  front.setAttribute('stroke', 'rgba(255,255,255,0.25)');
  front.setAttribute('stroke-width', '1.2');

  svg.append(top, left, right, front);
  return svg;
}

function createScrambledCubeIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 72 72');
  svg.setAttribute('class', 'solver-path-cube-icon solver-path-cube-icon--scrambled');
  svg.setAttribute('aria-hidden', 'true');

  const faceColors = ['#f3f0e8', '#ec574d', '#48bd79', '#f1d747', '#f09a49', '#568be0'];
  const positions = [
    { x: 36, y: 12, color: faceColors[0] },
    { x: 58, y: 24, color: faceColors[1] },
    { x: 36, y: 38, color: faceColors[2] },
    { x: 14, y: 24, color: faceColors[3] },
    { x: 36, y: 58, color: faceColors[4] },
    { x: 58, y: 45, color: faceColors[5] }
  ];

  positions.forEach((entry) => {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(entry.x));
    dot.setAttribute('cy', String(entry.y));
    dot.setAttribute('r', '6');
    dot.setAttribute('fill', entry.color);
    dot.setAttribute('opacity', '0.9');
    svg.appendChild(dot);
  });

  const base = createStaticCubeIcon();
  base.setAttribute('class', 'solver-path-cube-icon');
  svg.appendChild(base);
  return svg;
}

function generateTreeLayout(solutionKey, totalMoves, phase1Length) {
  const nodeCount = Math.max(1, totalMoves + 1);
  const leftX = 60;
  const rightX = 500;
  const centerY = 110;
  const nodes = [];
  const rand = mulberry32(hashString(solutionKey || 'empty'));

  for (let index = 0; index < nodeCount; index += 1) {
    const t = nodeCount === 1 ? 0.5 : index / (nodeCount - 1);
    const x = leftX + t * (rightX - leftX);
    const lobe = Math.sin(index * 1.35 + 0.8) * 26;
    const y = centerY + lobe + (index % 2 === 0 ? -12 : 12) * (0.7 + totalMoves / 26);
    nodes.push({ x, y, index });
  }

  const gateX = phase1Length !== null && Number.isFinite(phase1Length)
    ? nodes[clamp(phase1Length, 0, Math.max(0, totalMoves))].x
    : (leftX + rightX) / 2;

  const decoyBranches = [];
  for (let index = 0; index < nodeCount; index += 1) {
    const base = nodes[index];
    const branchCount = totalMoves <= 3 ? 1 : 2;
    for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
      const offset = (rand() - 0.5) * 38;
      const branchX = base.x + 18 + rand() * 46;
      const branchY = base.y + offset;
      const verticalLift = (rand() - 0.5) * 20;
      const midX = base.x + (branchX - base.x) * 0.55;
      const midY = base.y + offset * 0.4 + verticalLift;
      decoyBranches.push({
        d: `M ${base.x} ${base.y} Q ${midX} ${midY} ${branchX} ${branchY}`,
        leafX: branchX + 10,
        leafY: branchY + (rand() > 0.5 ? 8 : -8),
        stage: index <= (phase1Length ?? totalMoves) ? 'stage1' : 'stage2'
      });
    }
  }

  return { nodes, gateX, decoyBranches };
}

function routePathFromNodes(nodes, maxIndex) {
  if (!nodes.length) return '';
  const active = nodes.slice(0, clamp(maxIndex + 1, 0, nodes.length));
  return active.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function createSearchPath(containerEl) {
  const panel = containerEl;
  if (!panel) return { render() {} };

  const visualRoot = panel.querySelector('[data-role="visual"]');
  const stageTag = panel.querySelector('[data-role="stage-tag"]');
  const statusText = panel.querySelector('[data-role="status"]');
  let lastSolutionKey = null;
  let prevIndex = -1;

  function setStageTag(label, isStageTwo) {
    if (!stageTag) return;
    stageTag.textContent = label;
    stageTag.classList.toggle('is-stage2', isStageTwo);
  }

  function buildStaticLayout(solutionKey, startFacelets, solvedFacelets, phase1Length, totalMoves) {
    if (!visualRoot) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'solver-path-visual-inner';

    const startWrap = document.createElement('div');
    startWrap.className = 'solver-path-icon-wrap';
    const startIcon = createScrambledCubeIcon();
    startIcon.setAttribute('width', '56');
    startIcon.setAttribute('height', '56');
    startIcon.style.width = '56px';
    startIcon.style.height = '56px';
    startWrap.appendChild(startIcon);
    const startCaption = document.createElement('div');
    startCaption.className = 'solver-path-icon-caption';
    startCaption.textContent = 'Start (scrambled)';
    startWrap.appendChild(startCaption);

    const mapHost = document.createElement('div');
    mapHost.className = 'solver-path-map-host';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 560 220');
    svg.setAttribute('class', 'solver-path-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Search path summary');

    const layout = generateTreeLayout(solutionKey, totalMoves, phase1Length);
    const gateX = layout.gateX;

    const backboard = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    backboard.setAttribute('x', '0');
    backboard.setAttribute('y', '0');
    backboard.setAttribute('width', '560');
    backboard.setAttribute('height', '220');
    backboard.setAttribute('fill', 'rgba(14,17,24,0.7)');
    svg.appendChild(backboard);

    const divider = createSvgLine(gateX, 18, gateX, 188, {
      stroke: 'var(--pink)',
      'stroke-width': '2.2',
      'stroke-linecap': 'round',
      'class': 'solver-path-divider'
    });
    svg.appendChild(divider);

    const leftLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    leftLabel.setAttribute('x', String(clamp(gateX - 72, 90, 250)));
    leftLabel.setAttribute('y', '18');
    leftLabel.setAttribute('text-anchor', 'middle');
    leftLabel.setAttribute('class', 'solver-path-stage-label solver-path-stage-label-left');
    leftLabel.textContent = 'Stage 1';

    const rightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rightLabel.setAttribute('x', String(clamp(gateX + 72, 310, 470)));
    rightLabel.setAttribute('y', '18');
    rightLabel.setAttribute('text-anchor', 'middle');
    rightLabel.setAttribute('class', 'solver-path-stage-label solver-path-stage-label-right');
    rightLabel.textContent = 'Stage 2';
    svg.appendChild(leftLabel);
    svg.appendChild(rightLabel);

    const branchGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    branchGroup.setAttribute('data-role', 'branch-layer');
    layout.decoyBranches.forEach((branch) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', branch.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', branch.stage === 'stage2' ? 'rgba(192,138,255,0.18)' : 'rgba(141,184,255,0.18)');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-dasharray', '7 8');
      branchGroup.appendChild(path);

      const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      leaf.setAttribute('x', String(branch.leafX));
      leaf.setAttribute('y', String(branch.leafY));
      leaf.setAttribute('text-anchor', 'middle');
      leaf.setAttribute('fill', 'rgba(255,255,255,0.35)');
      leaf.setAttribute('font-size', '12');
      leaf.setAttribute('font-family', 'DM Mono, monospace');
      leaf.textContent = '×';
      branchGroup.appendChild(leaf);
    });
    svg.appendChild(branchGroup);

    const spine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    spine.setAttribute('data-role', 'spine');
    spine.setAttribute('d', '');
    spine.setAttribute('fill', 'none');
    spine.setAttribute('stroke', '#8db8ff');
    spine.setAttribute('stroke-width', '4');
    spine.setAttribute('stroke-linecap', 'round');
    spine.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(spine);

    const nodeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeLayer.setAttribute('data-role', 'node-layer');
    layout.nodes.forEach((node) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('data-index', String(node.index));
      circle.setAttribute('cx', String(node.x));
      circle.setAttribute('cy', String(node.y));
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', '#8db8ff');
      circle.setAttribute('stroke', 'rgba(255,255,255,0.6)');
      circle.setAttribute('stroke-width', '1.2');
      nodeLayer.appendChild(circle);
    });
    svg.appendChild(nodeLayer);

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('data-role', 'marker');
    marker.setAttribute('cx', String(layout.nodes[0].x));
    marker.setAttribute('cy', String(layout.nodes[0].y));
    marker.setAttribute('r', '7');
    marker.setAttribute('fill', '#8db8ff');
    marker.setAttribute('stroke', '#ffffff');
    marker.setAttribute('stroke-width', '1.6');
    svg.appendChild(marker);

    const rootGuide = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rootGuide.setAttribute('x1', '34');
    rootGuide.setAttribute('x2', String(layout.nodes[0].x));
    rootGuide.setAttribute('y1', '110');
    rootGuide.setAttribute('y2', String(layout.nodes[0].y));
    rootGuide.setAttribute('stroke', 'rgba(255,255,255,0.18)');
    rootGuide.setAttribute('stroke-width', '1.4');
    rootGuide.setAttribute('stroke-dasharray', '4 7');
    svg.appendChild(rootGuide);

    const solvedWrap = document.createElement('div');
    solvedWrap.className = 'solver-path-icon-wrap';
    const solvedIcon = createStaticCubeIcon();
    solvedIcon.setAttribute('width', '56');
    solvedIcon.setAttribute('height', '56');
    solvedIcon.style.width = '56px';
    solvedIcon.style.height = '56px';
    solvedWrap.appendChild(solvedIcon);
    const solvedCaption = document.createElement('div');
    solvedCaption.className = 'solver-path-icon-caption';
    solvedCaption.textContent = 'Solved';
    solvedWrap.appendChild(solvedCaption);

    svg.dataset.solutionKey = solutionKey;
    svg.dataset.gateX = String(gateX);
    svg.dataset.phase1Length = String(phase1Length ?? 'null');
    mapHost.appendChild(svg);
    wrapper.append(startWrap, mapHost, solvedWrap);
    visualRoot.replaceChildren(wrapper);
    return { svg, leftLabel, rightLabel, divider, marker, spine, nodeLayer };
  }

  function triggerPulse(element, secondary) {
    if (!element || typeof element.animate !== 'function') return;
    const animation = [
      { opacity: 1, filter: 'drop-shadow(0 0 0 rgba(255,152,187,0))' },
      { opacity: 1, filter: 'drop-shadow(0 0 12px rgba(255,152,187,0.9))' },
      { opacity: 1, filter: 'drop-shadow(0 0 0 rgba(255,152,187,0))' }
    ];
    element.animate(animation, { duration: 600, easing: 'ease-out' });
    if (secondary && typeof secondary.animate === 'function') {
      secondary.animate(animation, { duration: 600, easing: 'ease-out' });
    }
  }

  function render({ status = 'idle', moves = [], phase1Length = null, index = 0, startFacelets = '', solvedFacelets = '' } = {}) {
    const totalMoves = Array.isArray(moves) ? moves.length : 0;
    const safeIndex = clamp(Number.isFinite(index) ? index : 0, 0, totalMoves);
    const phase1Value = Number.isInteger(phase1Length) && phase1Length >= 0 ? phase1Length : null;
    const stageKey = status === 'already-solved' ? 'solved' : (phase1Value === null ? 'neutral' : (safeIndex <= phase1Value ? 'stage1' : 'stage2'));
    const solutionKey = `${(moves || []).join(' ')}|${startFacelets || ''}|${solvedFacelets || ''}|${phase1Length ?? 'null'}|${status}`;

    if (lastSolutionKey !== solutionKey) {
      lastSolutionKey = solutionKey;
      prevIndex = -1;
      buildStaticLayout(solutionKey, startFacelets, solvedFacelets, phase1Length, totalMoves);
    }

    const staticSvg = visualRoot?.querySelector('.solver-path-svg');
    if (!staticSvg) return;

    const leftLabel = staticSvg.querySelector('.solver-path-stage-label-left');
    const rightLabel = staticSvg.querySelector('.solver-path-stage-label-right');
    const marker = staticSvg.querySelector('[data-role="marker"]');
    const spine = staticSvg.querySelector('[data-role="spine"]');
    const nodeLayer = staticSvg.querySelector('[data-role="node-layer"]');
    const divider = staticSvg.querySelector('.solver-path-divider');
    const gateX = Number(staticSvg.dataset.gateX || '280');

    const tree = generateTreeLayout(solutionKey, totalMoves, phase1Value);
    const currentNode = tree.nodes[clamp(safeIndex, 0, Math.max(0, tree.nodes.length - 1))] || tree.nodes[0];
    const route = routePathFromNodes(tree.nodes, safeIndex);

    if (spine) {
      spine.setAttribute('d', route);
      spine.setAttribute('stroke', stageKey === 'stage2' ? 'var(--stage2)' : 'var(--stage1)');
      spine.setAttribute('stroke-dasharray', totalMoves === 0 ? '0 0' : '0 0');
    }

    if (marker) {
      marker.setAttribute('cx', String(currentNode.x));
      marker.setAttribute('cy', String(currentNode.y));
      marker.setAttribute('fill', stageKey === 'stage2' ? '#c08aff' : '#8db8ff');
      marker.setAttribute('stroke', 'rgba(255,255,255,0.82)');
    }

    if (nodeLayer) {
      [...nodeLayer.querySelectorAll('circle')].forEach((nodeEl, nodeIndex) => {
        const node = tree.nodes[nodeIndex];
        const stage = phase1Value === null ? 'stage1' : (nodeIndex <= phase1Value ? 'stage1' : 'stage2');
        const isCurrent = nodeIndex === safeIndex;
        const fill = isCurrent ? (stage === 'stage2' ? '#d9b9ff' : '#b9d6ff') : (stage === 'stage2' ? '#c08aff' : '#8db8ff');
        nodeEl.setAttribute('cx', String(node.x));
        nodeEl.setAttribute('cy', String(node.y));
        nodeEl.setAttribute('r', String(isCurrent ? 7 : 5));
        nodeEl.setAttribute('fill', fill);
        nodeEl.setAttribute('stroke', isCurrent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)');
      });
    }

    const stageLabelText = status === 'already-solved' ? 'SOLVED' : (phase1Value === null ? 'STAGE 1' : (safeIndex <= phase1Value ? 'STAGE 1' : 'STAGE 2'));
    setStageTag(stageLabelText, stageLabelText === 'STAGE 2');

    if (leftLabel) {
      leftLabel.classList.toggle('is-active', stageLabelText === 'STAGE 1' || stageLabelText === 'SOLVED');
    }
    if (rightLabel) {
      rightLabel.classList.toggle('is-active', stageLabelText === 'STAGE 2');
    }

    if (divider) {
      divider.setAttribute('x1', String(gateX));
      divider.setAttribute('x2', String(gateX));
      divider.setAttribute('y1', '18');
      divider.setAttribute('y2', '188');
    }

    const currentStatus = status === 'idle' ? 'Press Solve to see the path' : status === 'already-solved' ? 'Already solved, nothing to trace' : `Move ${safeIndex} / ${totalMoves} · ${safeIndex <= (phase1Value ?? 0) ? 'Stage 1' : 'Stage 2'}`;
    if (statusText) {
      statusText.textContent = currentStatus;
    }
    if (staticSvg) {
      staticSvg.setAttribute('aria-label', `Search path progress: ${currentStatus}`);
    }

    if (phase1Value !== null && totalMoves > phase1Value && prevIndex === phase1Value && safeIndex === phase1Value + 1) {
      panel.classList.remove('solver-path-pulse');
      void panel.offsetWidth;
      panel.classList.add('solver-path-pulse');
      if (divider) triggerPulse(divider, rightLabel);
    }
    prevIndex = safeIndex;
  }

  return { render };
}
