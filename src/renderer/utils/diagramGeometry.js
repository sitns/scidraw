function normalizeBounds(bounds) {
  if (!bounds || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y) || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) {
    return null;
  }

  return {
    x: bounds.x,
    y: bounds.y,
    width: Math.max(0, bounds.width),
    height: Math.max(0, bounds.height)
  };
}

function unionBounds(a, b) {
  const first = normalizeBounds(a);
  const second = normalizeBounds(b);

  if (!first) return second;
  if (!second) return first;

  const minX = Math.min(first.x, second.x);
  const minY = Math.min(first.y, second.y);
  const maxX = Math.max(first.x + first.width, second.x + second.width);
  const maxY = Math.max(first.y + first.height, second.y + second.height);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function expandBounds(bounds, padding = 0) {
  const normalized = normalizeBounds(bounds);
  if (!normalized) return null;

  return {
    x: normalized.x - padding,
    y: normalized.y - padding,
    width: normalized.width + padding * 2,
    height: normalized.height + padding * 2
  };
}

function ensureMinimumBounds(bounds, minWidth = 1, minHeight = 1) {
  const normalized = normalizeBounds(bounds);
  if (!normalized) {
    return {
      x: 0,
      y: 0,
      width: minWidth,
      height: minHeight
    };
  }

  const width = Math.max(normalized.width, minWidth);
  const height = Math.max(normalized.height, minHeight);

  return {
    x: normalized.x - (width - normalized.width) / 2,
    y: normalized.y - (height - normalized.height) / 2,
    width,
    height
  };
}

function getNodeBounds(node) {
  const strokePadding = Math.max((node?.style?.strokeWidth || 0) / 2, 1);
  return {
    x: (node?.x || 0) - strokePadding,
    y: (node?.y || 0) - strokePadding,
    width: (node?.width || 0) + strokePadding * 2,
    height: (node?.height || 0) + strokePadding * 2
  };
}

function getTextBounds(text) {
  const fontSize = text?.fontSize || 14;
  const content = text?.content || '';
  const lines = String(content).split('\n');
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = longest * fontSize * 0.62 + 8;
  const height = lines.length * fontSize * 1.35 + 4;

  return {
    x: (text?.x || 0) - 4,
    y: (text?.y || 0) - fontSize,
    width,
    height
  };
}

function getImageBounds(image) {
  return {
    x: image?.x || 0,
    y: image?.y || 0,
    width: image?.width || 0,
    height: image?.height || 0
  };
}

function getEdgeBounds(edge, nodesById = {}) {
  const fromNode = nodesById[edge?.from];
  const toNode = nodesById[edge?.to];
  if (!fromNode || !toNode) return null;

  const points = [
    { x: fromNode.x + fromNode.width / 2, y: fromNode.y + fromNode.height / 2 },
    { x: toNode.x + toNode.width / 2, y: toNode.y + toNode.height / 2 },
    ...((edge?.controlPoints || []).map((point) => ({ x: point.x, y: point.y })))
  ];

  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const padding = Math.max((edge?.strokeWidth || 1.5) * 6, 16);

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  };
}

export function getDiagramBounds(diagram, padding = 0) {
  if (!diagram) {
    return {
      x: 0,
      y: 0,
      width: 1200,
      height: 800
    };
  }

  const nodesById = Object.fromEntries((diagram.nodes || []).map((node) => [node.id, node]));
  let bounds = null;

  (diagram.nodes || []).forEach((node) => {
    bounds = unionBounds(bounds, getNodeBounds(node));
  });

  (diagram.texts || []).forEach((text) => {
    bounds = unionBounds(bounds, getTextBounds(text));
  });

  (diagram.images || []).forEach((image) => {
    bounds = unionBounds(bounds, getImageBounds(image));
  });

  (diagram.edges || []).forEach((edge) => {
    bounds = unionBounds(bounds, getEdgeBounds(edge, nodesById));
  });

  return ensureMinimumBounds(expandBounds(bounds, padding), 120, 120);
}

export function translateDiagram(diagram, dx, dy) {
  return {
    ...diagram,
    nodes: (diagram.nodes || []).map((node) => ({
      ...node,
      x: node.x + dx,
      y: node.y + dy
    })),
    texts: (diagram.texts || []).map((text) => ({
      ...text,
      x: text.x + dx,
      y: text.y + dy
    })),
    images: (diagram.images || []).map((image) => ({
      ...image,
      x: image.x + dx,
      y: image.y + dy
    }))
  };
}

export { ensureMinimumBounds, expandBounds, getEdgeBounds, getImageBounds, getNodeBounds, getTextBounds, normalizeBounds, unionBounds };
