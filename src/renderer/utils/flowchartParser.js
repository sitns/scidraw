/**
 * Flowchart Parser - Import Mermaid-style flowchart code to SciDraw DSL format
 * 
 * Supports:
 * - flowchart TD/LR/TB/RL
 * - Node shapes: [text], (text), {text}, [/text/], [\text\], ((text))
 * - Arrows: -->, --->, --> text -->
 * - Subgraphs
 */

export function parseFlowchart(code) {
  const nodes = {};
  const edges = [];
  let direction = 'TD'; // TD (top-down) or LR (left-right)
  
  const lines = code.trim().split('\n');
  
  // Detect direction
  for (const line of lines) {
    const dirMatch = line.match(/flowchart\s+(TD|LR|TB|RL)/i);
    if (dirMatch) {
      direction = dirMatch[1].toUpperCase();
    }
  }
  
  // Parse edges and nodes
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('#')) continue;
    
    // Skip flowchart declaration
    if (/^(graph|flowchart)\s+/i.test(trimmed)) continue;
    
    // Parse edge: A --> B, A -->|label| B, A --- B
    const edgeRegex = /(\w+)(\[.*?\]|\(.*?\)|\{.*?\}|\/.*?\/|\\.*?\\|\(\(.*?\)\))?\s*(-->|-->|---|--->)\s*(?:\|(.*?)\|)?\s*(\[.*?\]|\(.*?\)|\{.*?\}|\/.*?\/|\\.*?\\|\(\(.*?\)\))?\s*(\w+)/g;
    
    let match;
    while ((match = edgeRegex.exec(trimmed)) !== null) {
      const fromId = match[1];
      const fromShape = match[2];
      const arrow = match[3];
      const label = match[4] ? match[4].trim() : '';
      const toShape = match[5];
      const toId = match[6];
      
      // Register nodes
      if (!nodes[fromId]) {
        nodes[fromId] = {
          id: fromId,
          type: parseShapeType(fromShape),
          label: parseShapeLabel(fromShape) || fromId,
          shape: fromShape
        };
      }
      
      if (!nodes[toId]) {
        nodes[toId] = {
          id: toId,
          type: parseShapeType(toShape),
          label: parseShapeLabel(toShape) || toId,
          shape: toShape
        };
      }
      
      edges.push({
        from: fromId,
        to: toId,
        label: label,
        style: arrow === '---' ? 'dashed' : 'solid'
      });
    }
    
    // Also parse simple: A --> B without shape brackets
    const simpleRegex = /(\w+)\s*(-->|---|--->)\s*(?:\|(.*?)\|)?\s*(\w+)/g;
    let simpleMatch;
    while ((simpleMatch = simpleRegex.exec(trimmed)) !== null) {
      const fromId = simpleMatch[1];
      const arrow = simpleMatch[2];
      const label = simpleMatch[3] ? simpleMatch[3].trim() : '';
      const toId = simpleMatch[4];
      
      // Skip if already captured by the more specific regex
      if (trimmed.includes('[') || trimmed.includes('(') || trimmed.includes('{')) {
        continue;
      }
      
      if (!nodes[fromId]) {
        nodes[fromId] = {
          id: fromId,
          type: 'box',
          label: fromId,
          shape: null
        };
      }
      
      if (!nodes[toId]) {
        nodes[toId] = {
          id: toId,
          type: 'box',
          label: toId,
          shape: null
        };
      }
      
      // Check if this edge already exists
      const existing = edges.find(e => e.from === fromId && e.to === toId);
      if (!existing) {
        edges.push({
          from: fromId,
          to: toId,
          label: label,
          style: arrow === '---' ? 'dashed' : 'solid'
        });
      }
    }
    
    // Parse standalone node definitions: A[Label]
    const nodeRegex = /(\w+)(\[.*?\]|\(.*?\)|\{.*?\}|\/.*?\/|\\.*?\\|\(\(.*?\)\))/g;
    let nodeMatch;
    while ((nodeMatch = nodeRegex.exec(trimmed)) !== null) {
      const id = nodeMatch[1];
      const shape = nodeMatch[2];
      if (!nodes[id]) {
        nodes[id] = {
          id: id,
          type: parseShapeType(shape),
          label: parseShapeLabel(shape) || id,
          shape: shape
        };
      }
    }
  }
  
  // Calculate positions
  const nodeIds = Object.keys(nodes);
  const layout = calculateLayout(nodeIds, edges, direction);
  
  // Build diagram
  const diagram = {
    canvas: {
      width: 800,
      height: 600,
      background: '#ffffff'
    },
    nodes: nodeIds.map((id, index) => {
      const node = nodes[id];
      const pos = layout[id] || { x: 100 + index * 150, y: 100 + index * 80 };
      const style = getNodeStyle(node.type);
      return {
        id: node.id,
        type: node.type,
        x: pos.x,
        y: pos.y,
        width: style.width,
        height: style.height,
        label: node.label,
        subtitle: '',
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
      style: edge.style,
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
  
  return diagram;
}

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
  // Remove brackets
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
      return { width: 80, height: 80, fill: '#fce4ec', stroke: '#e91e63' };
    case 'diamond':
      return { width: 100, height: 100, fill: '#fff3e0', stroke: '#ff9800' };
    case 'rounded':
      return { width: 120, height: 60, fill: '#e8f5e9', stroke: '#4caf50' };
    case 'process':
      return { width: 140, height: 60, fill: '#f3e5f5', stroke: '#9c27b0' };
    case 'box':
    default:
      return { width: 120, height: 60, fill: '#e3f2fd', stroke: '#2196f3' };
  }
}

function calculateLayout(nodeIds, edges, direction) {
  const positions = {};
  const GAP_X = 180;
  const GAP_Y = 100;
  const START_X = 100;
  const START_Y = 80;
  
  // Build adjacency list
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
  
  // Topological sort for layering
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
  
  // Add remaining nodes
  nodeIds.forEach(id => {
    if (!visited.has(id)) {
      layers.push([id]);
    }
  });
  
  // Assign positions
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
