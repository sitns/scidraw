/**
 * TikZ Parser - Import TikZ code to SciDraw DSL format
 */

export function parseTikZ(tikzCode) {
  const nodes = [];
  const edges = [];
  const colors = {};
  
  // 先提取颜色定义
  const colorRegex = /\\definecolor\{(\w+)\}\{rgb\}\{([^}]+)\}/g;
  let colorMatch;
  while ((colorMatch = colorRegex.exec(tikzCode)) !== null) {
    const name = colorMatch[1];
    const [r, g, b] = colorMatch[2].split(',').map(Number);
    colors[name] = rgbToHex(r, g, b);
  }
  
  // 提取节点
  const nodeRegex = /\\node\[([^\]]*)\]\s*\((\w+)\)\s*at\s*\(([^)]+)\)\s*\{([^}]*)\}/g;
  let nodeMatch;
  while ((nodeMatch = nodeRegex.exec(tikzCode)) !== null) {
    const options = nodeMatch[1];
    const id = nodeMatch[2];
    const [xStr, yStr] = nodeMatch[3].split(',').map(s => s.trim());
    const label = nodeMatch[4];
    
    const node = {
      id,
      type: parseNodeType(options),
      x: parseFloat(xStr) * 10,
      y: 600 - parseFloat(yStr) * 10,
      width: parseDimension(options, 'minimum width') * 10 || 120,
      height: parseDimension(options, 'minimum height') * 10 || 60,
      label,
      subtitle: '',
      labelOffset: { x: 0, y: 0 },
      style: {
        fill: parseColor(options, 'fill', colors) || '#ffffff',
        stroke: parseColor(options, 'draw', colors) || '#000000',
        strokeWidth: parseDimension(options, 'line width') || 1,
        strokeDasharray: parseDashStyle(options) || 'solid',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Arial'
      }
    };
    
    nodes.push(node);
  }
  
  // 提取标签节点（副标题）
  const labelNodeRegex = /\\node\[below=([^,]+) of (\w+)[^\]]*\]\s*\{([^}]*)\}/g;
  let labelMatch;
  while ((labelMatch = labelNodeRegex.exec(tikzCode)) !== null) {
    const parentId = labelMatch[2];
    const subtitle = labelMatch[3];
    const parent = nodes.find(n => n.id === parentId);
    if (parent) {
      parent.subtitle = subtitle;
    }
  }
  
  // 提取连线
  const edgeRegex = /\\draw\[([^\]]*)\]\s*\((\w+)\)\s*--\s*\((\w+)\)/g;
  let edgeMatch;
  while ((edgeMatch = edgeRegex.exec(tikzCode)) !== null) {
    const options = edgeMatch[1];
    const from = edgeMatch[2];
    const to = edgeMatch[3];
    
    const edge = {
      id: `edge_${edges.length}`,
      from,
      to,
      label: '',
      labelOffset: { x: 0, y: 0 },
      labelStyle: {
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Arial'
      },
      style: parseDashStyle(options) || 'solid',
      strokeWidth: parseDimension(options, 'line width') || 1.5,
      strokeColor: parseColor(options, 'color', colors) || '#333333',
      fromDir: 'auto',
      toDir: 'auto',
      curveType: 'auto',
      controlPoints: []
    };
    
    edges.push(edge);
  }
  
  // 提取连线标签
  const edgeLabelRegex = /\\node at \(([^)]+)\)\s*\{([^}]*)\}/g;
  let labelNodeMatch;
  while ((labelNodeMatch = edgeLabelRegex.exec(tikzCode)) !== null) {
    const [x, y] = labelNodeMatch[1].split(',').map(s => parseFloat(s.trim()));
    const text = labelNodeMatch[2];
    
    // 尝试找到最近的连线
    let closestEdge = null;
    let minDist = Infinity;
    
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (fromNode && toNode) {
        const midX = (fromNode.x + fromNode.width/2 + toNode.x + toNode.width/2) / 2 / 10;
        const midY = (fromNode.y + fromNode.height/2 + toNode.y + toNode.height/2) / 2 / 10;
        const dist = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closestEdge = edge;
        }
      }
    });
    
    if (closestEdge && minDist < 5) {
      closestEdge.label = text;
    }
  }
  
  return {
    canvas: {
      width: 800,
      height: 600,
      background: '#ffffff'
    },
    nodes,
    edges,
    texts: []
  };
}

function parseNodeType(options) {
  if (options.includes('circle')) return 'circle';
  if (options.includes('rounded corners')) return 'rounded';
  if (options.includes('diamond')) return 'diamond';
  return 'box';
}

function parseDimension(options, key) {
  const regex = new RegExp(`${key}=([\\d.]+)`);
  const match = options.match(regex);
  return match ? parseFloat(match[1]) : null;
}

function parseColor(options, key, colors) {
  const regex = new RegExp(`${key}=(\\w+)`);
  const match = options.match(regex);
  if (match) {
    const colorName = match[1];
    return colors[colorName] || `#${colorName}`;
  }
  return null;
}

function parseDashStyle(options) {
  if (options.includes('dashed')) return 'dashed';
  if (options.includes('dotted')) return 'dotted';
  return 'solid';
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
