/**
 * Mermaid Parser - Import Mermaid code to SciDraw DSL format
 * 
 * Supported diagram types:
 * - flowchart (TD/LR/TB/RL)
 * - sequence (sequenceDiagram)
 * - class (classDiagram)
 * - state (stateDiagram)
 * - er (erDiagram)
 */

export function parseMermaid(code) {
  const trimmed = code.trim();
  
  // Detect diagram type
  if (/^(flowchart|graph)\s+/i.test(trimmed)) {
    return parseFlowchart(trimmed);
  } else if (/^sequenceDiagram/i.test(trimmed)) {
    return parseSequence(trimmed);
  } else if (/^classDiagram/i.test(trimmed)) {
    return parseClass(trimmed);
  } else if (/^stateDiagram/i.test(trimmed)) {
    return parseState(trimmed);
  } else if (/^erDiagram/i.test(trimmed)) {
    return parseER(trimmed);
  }
  
  // Default to flowchart
  return parseFlowchart(trimmed);
}

// ===== Flowchart Parser =====
function parseFlowchart(code) {
  const nodes = {};
  const edges = [];
  let direction = 'TD';
  
  const lines = code.split('\n');
  
  for (const line of lines) {
    const dirMatch = line.match(/flowchart\s+(TD|LR|TB|RL)/i);
    if (dirMatch) {
      direction = dirMatch[1].toUpperCase();
    }
  }
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('#')) continue;
    if (/^(graph|flowchart)\s+/i.test(trimmed)) continue;
    
    // Parse edge with shapes: A[Label] --> B{Label}
    const edgeRegex = /(\w+)(\[.*?\]|\(.*?\)|\{.*?\}|\/.*?\/|\\.*?\\|\(\(.*?\)\))?\s*(-->|-->|---|--->)\s*(?:\|(.*?)\|)?\s*(\[.*?\]|\(.*?\)|\{.*?\}|\/.*?\/|\\.*?\\|\(\(.*?\)\))?\s*(\w+)/g;
    
    let match;
    while ((match = edgeRegex.exec(trimmed)) !== null) {
      const fromId = match[1];
      const fromShape = match[2];
      const arrow = match[3];
      const label = match[4] ? match[4].trim() : '';
      const toShape = match[5];
      const toId = match[6];
      
      if (!nodes[fromId]) {
        nodes[fromId] = {
          id: fromId,
          type: parseShapeType(fromShape),
          label: parseShapeLabel(fromShape) || fromId
        };
      }
      
      if (!nodes[toId]) {
        nodes[toId] = {
          id: toId,
          type: parseShapeType(toShape),
          label: parseShapeLabel(toShape) || toId
        };
      }
      
      edges.push({
        from: fromId,
        to: toId,
        label: label,
        style: arrow === '---' ? 'dashed' : 'solid'
      });
    }
    
    // Parse simple edges: A --> B
    const simpleRegex = /(\w+)\s*(-->|---|--->)\s*(?:\|(.*?)\|)?\s*(\w+)/g;
    let simpleMatch;
    while ((simpleMatch = simpleRegex.exec(trimmed)) !== null) {
      const fromId = simpleMatch[1];
      const arrow = simpleMatch[2];
      const label = simpleMatch[3] ? simpleMatch[3].trim() : '';
      const toId = simpleMatch[4];
      
      if (trimmed.includes('[') || trimmed.includes('(') || trimmed.includes('{')) continue;
      
      if (!nodes[fromId]) {
        nodes[fromId] = { id: fromId, type: 'box', label: fromId };
      }
      if (!nodes[toId]) {
        nodes[toId] = { id: toId, type: 'box', label: toId };
      }
      
      const existing = edges.find(e => e.from === fromId && e.to === toId);
      if (!existing) {
        edges.push({ from: fromId, to: toId, label, style: arrow === '---' ? 'dashed' : 'solid' });
      }
    }
  }
  
  const nodeIds = Object.keys(nodes);
  const layout = calculateLayout(nodeIds, edges, direction);
  
  return buildDiagram(nodes, edges, layout);
}

// ===== Sequence Diagram Parser =====
function parseSequence(code) {
  const participants = {};
  const messages = [];
  const lines = code.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    
    // Parse participant: participant A as Alice
    const participantMatch = trimmed.match(/participant\s+(\w+)(?:\s+as\s+(.+))?/i);
    if (participantMatch) {
      const id = participantMatch[1];
      const label = participantMatch[2] || id;
      participants[id] = { id, type: 'box', label };
      continue;
    }
    
    // Parse message: A->>B: Hello
    const msgMatch = trimmed.match(/(\w+)(->>|-->>|->|-->)\s*(\w+)\s*:\s*(.+)/);
    if (msgMatch) {
      const from = msgMatch[1];
      const arrow = msgMatch[2];
      const to = msgMatch[3];
      const label = msgMatch[4].trim();
      
      if (!participants[from]) participants[from] = { id: from, type: 'box', label: from };
      if (!participants[to]) participants[to] = { id: to, type: 'box', label: to };
      
      messages.push({
        from,
        to,
        label,
        style: arrow.includes('--') ? 'dashed' : 'solid'
      });
    }
  }
  
  const participantIds = Object.keys(participants);
  const layout = {};
  participantIds.forEach((id, i) => {
    layout[id] = { x: 50 + i * 180, y: 50 };
  });
  
  return buildDiagram(participants, messages, layout);
}

// ===== Class Diagram Parser =====
function parseClass(code) {
  const classes = {};
  const edges = [];
  const lines = code.split('\n');
  
  let currentClass = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    if (/^classDiagram/i.test(trimmed)) continue;
    
    // Parse class definition: class Animal {
    const classMatch = trimmed.match(/class\s+(\w+)\s*\{/);
    if (classMatch) {
      currentClass = classMatch[1];
      if (!classes[currentClass]) {
        classes[currentClass] = { id: currentClass, type: 'box', label: currentClass, attributes: [] };
      }
      continue;
    }
    
    // Parse class content: +String name
    if (currentClass && trimmed.match(/^[+\-#~]/)) {
      if (classes[currentClass]) {
        classes[currentClass].label += '\n' + trimmed;
      }
      continue;
    }
    
    // End of class
    if (trimmed === '}') {
      currentClass = null;
      continue;
    }
    
    // Parse inheritance: Animal <|-- Dog
    const inheritMatch = trimmed.match(/(\w+)\s+(<\|--|--\>|<--|\.\.>|<\.\.|\*--|--\*)\s*(\w+)/);
    if (inheritMatch) {
      const from = inheritMatch[1];
      const rel = inheritMatch[2];
      const to = inheritMatch[3];
      
      if (!classes[from]) classes[from] = { id: from, type: 'box', label: from };
      if (!classes[to]) classes[to] = { id: to, type: 'box', label: to };
      
      edges.push({
        from: rel.includes('<') ? to : from,
        to: rel.includes('<') ? from : to,
        label: '',
        style: rel.includes('..') ? 'dashed' : 'solid'
      });
    }
  }
  
  const classIds = Object.keys(classes);
  const layout = calculateLayout(classIds, edges, 'TD');
  
  return buildDiagram(classes, edges, layout);
}

// ===== State Diagram Parser =====
function parseState(code) {
  const states = {};
  const edges = [];
  const lines = code.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    if (/^stateDiagram/i.test(trimmed)) continue;
    
    // Parse transition: [*] --> Idle
    const transMatch = trimmed.match(/(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)(?:\s*:\s*(.+))?/);
    if (transMatch) {
      const from = transMatch[1] === '[*]' ? '__start__' : transMatch[1];
      const to = transMatch[2] === '[*]' ? '__end__' : transMatch[2];
      const label = transMatch[3] ? transMatch[3].trim() : '';
      
      if (from !== '__start__' && !states[from]) {
        states[from] = { id: from, type: 'rounded', label: from };
      }
      if (to !== '__end__' && !states[to]) {
        states[to] = { id: to, type: 'rounded', label: to };
      }
      if (from === '__start__') {
        states['__start__'] = { id: '__start__', type: 'circle', label: '●' };
      }
      if (to === '__end__') {
        states['__end__'] = { id: '__end__', type: 'circle', label: '●' };
      }
      
      edges.push({ from, to, label, style: 'solid' });
    }
    
    // Parse state with description: Processing: doing work
    const stateDescMatch = trimmed.match(/(\w+)\s*:\s*(.+)/);
    if (stateDescMatch && !trimmed.includes('-->')) {
      const id = stateDescMatch[1];
      const desc = stateDescMatch[2].trim();
      if (!states[id]) {
        states[id] = { id, type: 'rounded', label: id };
      }
      states[id].label = id + '\n' + desc;
    }
  }
  
  const stateIds = Object.keys(states);
  const layout = calculateLayout(stateIds, edges, 'TD');
  
  return buildDiagram(states, edges, layout);
}

// ===== ER Diagram Parser =====
function parseER(code) {
  const entities = {};
  const edges = [];
  const lines = code.split('\n');
  
  let currentEntity = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%')) continue;
    if (/^erDiagram/i.test(trimmed)) continue;
    
    // Parse relationship: USER ||--o{ ORDER : places
    const relMatch = trimmed.match(/(\w+)\s+([\|\}][o\|]--[o\|][\|\{])\s*(\w+)\s*:\s*(.+)/);
    if (relMatch) {
      const from = relMatch[1].toUpperCase();
      const to = relMatch[3].toUpperCase();
      const label = relMatch[4].trim();
      
      if (!entities[from]) entities[from] = { id: from, type: 'box', label: from };
      if (!entities[to]) entities[to] = { id: to, type: 'box', label: to };
      
      edges.push({ from, to, label, style: 'solid' });
      continue;
    }
    
    // Parse entity: USER {
    const entityMatch = trimmed.match(/(\w+)\s*\{/);
    if (entityMatch) {
      currentEntity = entityMatch[1].toUpperCase();
      if (!entities[currentEntity]) {
        entities[currentEntity] = { id: currentEntity, type: 'box', label: currentEntity };
      }
      continue;
    }
    
    // Parse attribute: string name
    if (currentEntity && trimmed.match(/^\w+\s+\w+/)) {
      if (entities[currentEntity]) {
        entities[currentEntity].label += '\n' + trimmed;
      }
      continue;
    }
    
    // End of entity
    if (trimmed === '}') {
      currentEntity = null;
    }
  }
  
  const entityIds = Object.keys(entities);
  const layout = calculateLayout(entityIds, edges, 'TD');
  
  return buildDiagram(entities, edges, layout);
}

// ===== Helper Functions =====
function parseShapeType(shape) {
  if (!shape) return 'box';
  if (shape.startsWith('((') || shape.startsWith('))')) return 'circle';
  if (shape.startsWith('[') || shape.startsWith(']')) return 'box';
  if (shape.startsWith('(') || shape.startsWith(')')) return 'rounded';
  if (shape.startsWith('{') || shape.startsWith('}')) return 'diamond';
  if (shape.startsWith('[/') || shape.startsWith('/]')) return 'process';
  if (shape.startsWith('[\\') || shape.startsWith('\\]')) return 'process';
  return 'box';
}

function parseShapeLabel(shape) {
  if (!shape) return '';
  return shape
    .replace(/^\[{1,2}/, '').replace(/\]{1,2}$/, '')
    .replace(/^\({1,2}/, '').replace(/\){1,2}$/, '')
    .replace(/^\{{1,2}/, '').replace(/\}{1,2}$/, '')
    .replace(/^\[\\/, '').replace(/\\\]$/, '')
    .replace(/^\[\/\//, '').replace(/\/\]$/, '')
    .trim();
}

function getNodeStyle(type) {
  switch (type) {
    case 'circle':
      return { width: 60, height: 60, fill: '#fce4ec', stroke: '#e91e63' };
    case 'diamond':
      return { width: 100, height: 100, fill: '#fff3e0', stroke: '#ff9800' };
    case 'rounded':
      return { width: 120, height: 60, fill: '#e8f5e9', stroke: '#4caf50' };
    case 'process':
      return { width: 140, height: 60, fill: '#f3e5f5', stroke: '#9c27b0' };
    case 'box':
    default:
      return { width: 140, height: 70, fill: '#e3f2fd', stroke: '#2196f3' };
  }
}

function calculateLayout(nodeIds, edges, direction) {
  const positions = {};
  const GAP_X = 180;
  const GAP_Y = 120;
  const START_X = 100;
  const START_Y = 80;
  
  const adjList = {};
  const inDegree = {};
  nodeIds.forEach(id => {
    adjList[id] = [];
    inDegree[id] = 0;
  });
  
  edges.forEach(edge => {
    if (adjList[edge.from]) {
      adjList[edge.from].push(edge.to);
    }
    if (inDegree.hasOwnProperty(edge.to)) {
      inDegree[edge.to]++;
    }
  });
  
  const layers = [];
  const queue = [];
  nodeIds.forEach(id => {
    if (inDegree[id] === 0) {
      queue.push(id);
    }
  });
  
  const visited = new Set();
  while (queue.length > 0) {
    const layer = [];
    const nextQueue = [];
    
    for (const id of queue) {
      if (visited.has(id)) continue;
      visited.add(id);
      layer.push(id);
      
      for (const neighbor of (adjList[id] || [])) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          nextQueue.push(neighbor);
        }
      }
    }
    
    if (layer.length > 0) {
      layers.push(layer);
    }
    
    queue.length = 0;
    queue.push(...nextQueue);
  }
  
  nodeIds.forEach(id => {
    if (!visited.has(id)) {
      layers.push([id]);
    }
  });
  
  layers.forEach((layer, layerIndex) => {
    layer.forEach((id, nodeIndex) => {
      if (direction === 'LR' || direction === 'RL') {
        positions[id] = {
          x: START_X + layerIndex * GAP_X,
          y: START_Y + nodeIndex * GAP_Y
        };
      } else {
        positions[id] = {
          x: START_X + nodeIndex * GAP_X - (layer.length - 1) * GAP_X / 2 + GAP_X / 2,
          y: START_Y + layerIndex * GAP_Y
        };
      }
    });
  });
  
  return positions;
}

function buildDiagram(nodesObj, edges, layout) {
  const nodeIds = Object.keys(nodesObj);
  
  return {
    canvas: {
      width: 800,
      height: Math.max(600, nodeIds.length * 100 + 200),
      background: '#ffffff'
    },
    nodes: nodeIds.map((id, index) => {
      const node = nodesObj[id];
      const pos = layout[id] || { x: 100 + index * 150, y: 100 + index * 80 };
      const style = getNodeStyle(node.type);
      
      // Handle multi-line labels for class/ER diagrams
      const labelLines = node.label.split('\n');
      const mainLabel = labelLines[0] || node.label;
      const subLabel = labelLines.slice(1).join('\n').substring(0, 30);
      
      return {
        id: node.id,
        type: node.type,
        x: pos.x,
        y: pos.y,
        width: style.width,
        height: Math.max(style.height, labelLines.length * 16 + 20),
        label: mainLabel,
        subtitle: subLabel || '',
        labelOffset: { x: 0, y: 0 },
        zIndex: 0,
        style: {
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: 2,
          strokeDasharray: 'solid',
          fontSize: 14,
          fontWeight: 'bold',
          fontFamily: 'Arial'
        }
      };
    }),
    edges: edges.map((edge, index) => ({
      id: `edge_${index}`,
      from: edge.from,
      to: edge.to,
      label: edge.label || '',
      labelOffset: { x: 0, y: 0 },
      labelStyle: {
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Arial'
      },
      style: edge.style || 'solid',
      strokeWidth: 1.5,
      strokeColor: '#333333',
      labelColor: '#333333',
      fromDir: 'auto',
      toDir: 'auto',
      curveType: 'auto',
      controlPoints: [],
      zIndex: 0
    })),
    texts: [],
    images: []
  };
}


