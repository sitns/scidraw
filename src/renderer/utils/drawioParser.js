import { centerDiagram } from './dslParser';
import { getShapePreset } from './shapeLibrary';

function parseXml(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const error = xml.querySelector('parsererror');
  if (error) {
    throw new Error(error.textContent || 'Invalid draw.io XML');
  }
  return xml;
}

function decodeMxfile(xml) {
  const diagramNode = xml.querySelector('mxfile > diagram');
  if (!diagramNode) {
    return xml;
  }

  const raw = (diagramNode.textContent || '').trim();
  if (!raw.startsWith('<')) {
    throw new Error('Compressed draw.io diagrams are not supported yet; please export as uncompressed XML.');
  }

  return parseXml(raw);
}

function parseStyle(styleText = '') {
  return styleText.split(';').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key) {
      acc[key.trim()] = value === undefined ? true : value.trim();
    }
    return acc;
  }, {});
}

function mapDrawioShape(styleMap = {}) {
  const shape = styleMap.shape || '';
  const rounded = styleMap.rounded === '1';
  const rhombus = shape.includes('rhombus') || shape.includes('diamond');

  if (shape.includes('ellipse') || shape.includes('doubleEllipse')) return 'ellipse';
  if (shape.includes('triangle')) return 'triangle';
  if (shape.includes('hexagon') || shape.includes('preparation')) return 'preparation';
  if (shape.includes('parallelogram')) return 'data';
  if (shape.includes('document')) return 'document';
  if (shape.includes('cylinder')) return 'database';
  if (shape.includes('swimlane')) return 'swimlane';
  if (shape.includes('note')) return 'note';
  if (shape.includes('package')) return 'package';
  if (shape.includes('process')) return 'process';
  if (rhombus) return 'diamond';
  if (rounded) return 'rounded';
  return 'box';
}

function toNode(cell, index) {
  const styleMap = parseStyle(cell.getAttribute('style') || '');
  const type = mapDrawioShape(styleMap);
  const preset = getShapePreset(type);
  const geometry = cell.querySelector('mxGeometry');

  const x = Number(geometry?.getAttribute('x') || 0);
  const y = Number(geometry?.getAttribute('y') || 0);
  const width = Number(geometry?.getAttribute('width') || preset.style.width);
  const height = Number(geometry?.getAttribute('height') || preset.style.height);

  return {
    id: cell.getAttribute('id') || `drawio_node_${index}`,
    type,
    x,
    y,
    width,
    height,
    label: cell.getAttribute('value') || preset.name.en,
    subtitle: '',
    labelOffset: { x: 0, y: 0 },
    zIndex: index,
    style: {
      fill: styleMap.fillColor || preset.style.fill,
      stroke: styleMap.strokeColor || preset.style.stroke,
      strokeWidth: Number(styleMap.strokeWidth || 2),
      strokeDasharray: styleMap.dashed === '1' ? 'dashed' : 'solid',
      fontSize: Number(styleMap.fontSize || 14),
      fontWeight: styleMap.fontStyle === '1' ? 'bold' : 'normal',
      fontFamily: styleMap.fontFamily || 'Arial'
    },
    drawio: {
      style: styleMap,
      rawStyle: cell.getAttribute('style') || ''
    }
  };
}

function toEdge(cell, index, nodeIds) {
  const source = cell.getAttribute('source');
  const target = cell.getAttribute('target');
  if (!source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
    return null;
  }

  const styleMap = parseStyle(cell.getAttribute('style') || '');
  return {
    id: cell.getAttribute('id') || `drawio_edge_${index}`,
    from: source,
    to: target,
    label: cell.getAttribute('value') || '',
    labelOffset: { x: 0, y: 0 },
    labelStyle: {
      fontSize: Number(styleMap.fontSize || 12),
      fontWeight: styleMap.fontStyle === '1' ? 'bold' : 'normal',
      fontFamily: styleMap.fontFamily || 'Arial'
    },
    style: styleMap.dashed === '1' ? 'dashed' : 'solid',
    strokeWidth: Number(styleMap.strokeWidth || 1.5),
    strokeColor: styleMap.strokeColor || '#333333',
    labelColor: styleMap.fontColor || '#333333',
    fromDir: 'auto',
    toDir: 'auto',
    curveType: styleMap.edgeStyle && styleMap.edgeStyle.includes('Elbow') ? 'manual' : 'auto',
    controlPoints: [],
    zIndex: index,
    drawio: {
      style: styleMap,
      rawStyle: cell.getAttribute('style') || ''
    }
  };
}

export function parseDrawio(input) {
  const xml = decodeMxfile(parseXml(input));
  const cells = Array.from(xml.querySelectorAll('mxCell'));
  const vertexCells = cells.filter((cell) => cell.getAttribute('vertex') === '1');
  const nodes = vertexCells.map(toNode);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = cells
    .filter((cell) => cell.getAttribute('edge') === '1')
    .map((cell, index) => toEdge(cell, index, nodeIds))
    .filter(Boolean);

  return centerDiagram({
    canvas: {
      background: '#ffffff',
      infinite: true,
      width: null,
      height: null
    },
    nodes,
    edges,
    texts: [],
    images: []
  }, 1200, 800);
}

export { mapDrawioShape, parseStyle };
