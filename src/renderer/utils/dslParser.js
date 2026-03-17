import yaml from 'js-yaml';

export function parseDiagram(code) {
  try {
    const parsed = yaml.load(code);
    
    if (!parsed) {
      throw new Error('Empty diagram');
    }

    const diagram = {
      canvas: {
        width: parsed.canvas?.width || 800,
        height: parsed.canvas?.height || 600,
        background: parsed.canvas?.background || '#ffffff'
      },
      nodes: (parsed.nodes || []).map((node, index) => ({
        id: node.id || `node_${index}`,
        type: node.type || 'box',
        x: node.x || 0,
        y: node.y || 0,
        width: node.width || 120,
        height: node.height || 60,
        label: node.label || '',
        subtitle: node.subtitle || '',
        style: {
          fill: node.style?.fill || '#ffffff',
          stroke: node.style?.stroke || '#000000',
          strokeWidth: node.style?.strokeWidth || 1
        }
      })),
      edges: (parsed.edges || []).map((edge, index) => ({
        id: edge.id || `edge_${index}`,
        from: edge.from,
        to: edge.to,
        label: edge.label || '',
        style: edge.style || 'solid',
        fromDir: edge.fromDir || 'auto',
        toDir: edge.toDir || 'auto',
        curveType: edge.curveType || 'auto',
        controlPoints: edge.controlPoints || []
      }))
    };

    return diagram;
  } catch (e) {
    throw new Error(`Failed to parse YAML: ${e.message}`);
  }
}

export function serializeDiagram(diagram) {
  const obj = {
    canvas: diagram.canvas,
    nodes: diagram.nodes.map(node => ({
      id: node.id,
      type: node.type,
      x: Math.round(node.x),
      y: Math.round(node.y),
      width: node.width,
      height: node.height,
      label: node.label,
      subtitle: node.subtitle || undefined,
      style: {
        fill: node.style.fill,
        stroke: node.style.stroke,
        strokeWidth: node.style.strokeWidth
      }
    })),
    edges: diagram.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      label: edge.label || undefined,
      style: edge.style !== 'solid' ? edge.style : undefined,
      fromDir: edge.fromDir !== 'auto' ? edge.fromDir : undefined,
      toDir: edge.toDir !== 'auto' ? edge.toDir : undefined,
      curveType: edge.curveType !== 'auto' && edge.curveType ? edge.curveType : undefined,
      controlPoints: edge.controlPoints && edge.controlPoints.length > 0 ? edge.controlPoints : undefined
    }))
  };

  const cleaned = JSON.parse(JSON.stringify(obj));
  return yaml.dump(cleaned, { indent: 2, lineWidth: -1 });
}
