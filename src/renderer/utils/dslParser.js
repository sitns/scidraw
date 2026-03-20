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
        labelOffset: node.labelOffset || { x: 0, y: 0 },
        style: {
          fill: node.style?.fill || '#ffffff',
          stroke: node.style?.stroke || '#000000',
          strokeWidth: node.style?.strokeWidth || 1,
          strokeDasharray: node.style?.strokeDasharray || 'solid'
        }
      })),
      edges: (parsed.edges || []).map((edge, index) => ({
        id: edge.id || `edge_${index}`,
        from: edge.from,
        to: edge.to,
        label: edge.label || '',
        labelOffset: edge.labelOffset || { x: 0, y: 0 },
        style: edge.style || 'solid',
        strokeWidth: edge.strokeWidth || 1.5,
        strokeColor: edge.strokeColor || '#333333',
        fromDir: edge.fromDir || 'auto',
        toDir: edge.toDir || 'auto',
        curveType: edge.curveType || 'auto',
        controlPoints: edge.controlPoints || []
      })),
      texts: (parsed.texts || []).map((text, index) => ({
        id: text.id || `text_${index}`,
        x: text.x || 100,
        y: text.y || 100,
        content: text.content || 'Text',
        fontSize: text.fontSize || 14,
        fontWeight: text.fontWeight || 'normal',
        color: text.color || '#000000',
        backgroundColor: text.backgroundColor || 'transparent'
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
      labelOffset: (node.labelOffset?.x !== 0 || node.labelOffset?.y !== 0) ? node.labelOffset : undefined,
      style: {
        fill: node.style.fill,
        stroke: node.style.stroke,
        strokeWidth: node.style.strokeWidth,
        strokeDasharray: node.style.strokeDasharray !== 'solid' ? node.style.strokeDasharray : undefined
      }
    })),
    edges: diagram.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      label: edge.label || undefined,
      labelOffset: (edge.labelOffset?.x !== 0 || edge.labelOffset?.y !== 0) ? edge.labelOffset : undefined,
      style: edge.style !== 'solid' ? edge.style : undefined,
      strokeWidth: edge.strokeWidth !== 1.5 ? edge.strokeWidth : undefined,
      strokeColor: edge.strokeColor !== '#333333' ? edge.strokeColor : undefined,
      fromDir: edge.fromDir !== 'auto' ? edge.fromDir : undefined,
      toDir: edge.toDir !== 'auto' ? edge.toDir : undefined,
      curveType: edge.curveType !== 'auto' && edge.curveType ? edge.curveType : undefined,
      controlPoints: edge.controlPoints && edge.controlPoints.length > 0 ? edge.controlPoints : undefined
    })),
    texts: diagram.texts && diagram.texts.length > 0 ? diagram.texts.map(text => ({
      id: text.id,
      x: Math.round(text.x),
      y: Math.round(text.y),
      content: text.content,
      fontSize: text.fontSize !== 14 ? text.fontSize : undefined,
      fontWeight: text.fontWeight !== 'normal' ? text.fontWeight : undefined,
      color: text.color !== '#000000' ? text.color : undefined,
      backgroundColor: text.backgroundColor !== 'transparent' ? text.backgroundColor : undefined
    })) : undefined
  };

  const cleaned = JSON.parse(JSON.stringify(obj));
  return yaml.dump(cleaned, { indent: 2, lineWidth: -1 });
}
