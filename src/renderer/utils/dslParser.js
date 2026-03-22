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
        zIndex: node.zIndex || 0,
        style: {
          fill: node.style?.fill || '#ffffff',
          stroke: node.style?.stroke || '#000000',
          strokeWidth: node.style?.strokeWidth || 1,
          strokeDasharray: node.style?.strokeDasharray || 'solid',
          fontSize: node.style?.fontSize || 14,
          fontWeight: node.style?.fontWeight || 'bold',
          fontFamily: node.style?.fontFamily || 'Arial'
        }
      })),
      edges: (parsed.edges || []).map((edge, index) => ({
        id: edge.id || `edge_${index}`,
        from: edge.from,
        to: edge.to,
        label: edge.label || '',
        labelOffset: edge.labelOffset || { x: 0, y: 0 },
        labelStyle: {
          fontSize: edge.labelStyle?.fontSize || 12,
          fontWeight: edge.labelStyle?.fontWeight || 'normal',
          fontFamily: edge.labelStyle?.fontFamily || 'Arial'
        },
        style: edge.style || 'solid',
        strokeWidth: edge.strokeWidth || 1.5,
        strokeColor: edge.strokeColor || '#333333',
        labelColor: edge.labelColor || '#333333',
        fromDir: edge.fromDir || 'auto',
        toDir: edge.toDir || 'auto',
        curveType: edge.curveType || 'auto',
        controlPoints: edge.controlPoints || [],
        zIndex: edge.zIndex || 0
      })),
      texts: (parsed.texts || []).map((text, index) => ({
        id: text.id || `text_${index}`,
        x: text.x || 100,
        y: text.y || 100,
        content: text.content || 'Text',
        fontSize: text.fontSize || 14,
        fontWeight: text.fontWeight || 'normal',
        fontFamily: text.fontFamily || 'Arial',
        color: text.color || '#000000',
        backgroundColor: text.backgroundColor || 'transparent',
        zIndex: text.zIndex || 0
      })),
      images: (parsed.images || []).map((image, index) => ({
        id: image.id || `image_${index}`,
        x: image.x || 100,
        y: image.y || 100,
        width: image.width || 200,
        height: image.height || 150,
        src: image.src || '',
        opacity: image.opacity || 1,
        zIndex: image.zIndex || 0
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
      zIndex: node.zIndex !== 0 ? node.zIndex : undefined,
      style: {
        fill: node.style.fill,
        stroke: node.style.stroke,
        strokeWidth: node.style.strokeWidth,
        strokeDasharray: node.style.strokeDasharray !== 'solid' ? node.style.strokeDasharray : undefined,
        fontSize: node.style.fontSize !== 14 ? node.style.fontSize : undefined,
        fontWeight: node.style.fontWeight !== 'bold' ? node.style.fontWeight : undefined,
        fontFamily: node.style.fontFamily !== 'Arial' ? node.style.fontFamily : undefined
      }
    })),
    edges: diagram.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      label: edge.label || undefined,
      labelOffset: (edge.labelOffset?.x !== 0 || edge.labelOffset?.y !== 0) ? edge.labelOffset : undefined,
      labelStyle: (edge.labelStyle?.fontSize !== 12 || edge.labelStyle?.fontWeight !== 'normal' || edge.labelStyle?.fontFamily !== 'Arial') ? {
        fontSize: edge.labelStyle?.fontSize,
        fontWeight: edge.labelStyle?.fontWeight,
        fontFamily: edge.labelStyle?.fontFamily
      } : undefined,
      style: edge.style !== 'solid' ? edge.style : undefined,
      strokeWidth: edge.strokeWidth !== 1.5 ? edge.strokeWidth : undefined,
      strokeColor: edge.strokeColor !== '#333333' ? edge.strokeColor : undefined,
      labelColor: edge.labelColor !== '#333333' ? edge.labelColor : undefined,
      fromDir: edge.fromDir !== 'auto' ? edge.fromDir : undefined,
      toDir: edge.toDir !== 'auto' ? edge.toDir : undefined,
      curveType: edge.curveType !== 'auto' && edge.curveType ? edge.curveType : undefined,
      controlPoints: edge.controlPoints && edge.controlPoints.length > 0 ? edge.controlPoints : undefined,
      zIndex: edge.zIndex !== 0 ? edge.zIndex : undefined
    })),
    texts: diagram.texts && diagram.texts.length > 0 ? diagram.texts.map(text => ({
      id: text.id,
      x: Math.round(text.x),
      y: Math.round(text.y),
      content: text.content,
      fontSize: text.fontSize !== 14 ? text.fontSize : undefined,
      fontWeight: text.fontWeight !== 'normal' ? text.fontWeight : undefined,
      fontFamily: text.fontFamily !== 'Arial' ? text.fontFamily : undefined,
      color: text.color !== '#000000' ? text.color : undefined,
      backgroundColor: text.backgroundColor !== 'transparent' ? text.backgroundColor : undefined,
      zIndex: text.zIndex !== 0 ? text.zIndex : undefined
    })) : undefined,
    images: diagram.images && diagram.images.length > 0 ? diagram.images.map(image => ({
      id: image.id,
      x: Math.round(image.x),
      y: Math.round(image.y),
      width: image.width,
      height: image.height,
      src: '[base64 image data]',  // Placeholder - actual data stored in diagram state
      opacity: image.opacity !== 1 ? image.opacity : undefined,
      zIndex: image.zIndex !== 0 ? image.zIndex : undefined
    })) : undefined
  };

  const cleaned = JSON.parse(JSON.stringify(obj));
  return yaml.dump(cleaned, { indent: 2, lineWidth: -1 });
}

export function getAllElements(diagram) {
  const elements = [];
  
  (diagram.nodes || []).forEach(node => {
    elements.push({ type: 'node', data: node, zIndex: node.zIndex || 0 });
  });
  
  (diagram.edges || []).forEach(edge => {
    elements.push({ type: 'edge', data: edge, zIndex: edge.zIndex || 0 });
  });
  
  (diagram.texts || []).forEach(text => {
    elements.push({ type: 'text', data: text, zIndex: text.zIndex || 0 });
  });
  
  (diagram.images || []).forEach(image => {
    elements.push({ type: 'image', data: image, zIndex: image.zIndex || 0 });
  });
  
  return elements.sort((a, b) => a.zIndex - b.zIndex);
}

export function updateElementZIndex(diagram, elementId, elementType, newZIndex) {
  const newDiagram = { ...diagram };
  
  if (elementType === 'node') {
    newDiagram.nodes = diagram.nodes.map(node => 
      node.id === elementId ? { ...node, zIndex: newZIndex } : node
    );
  } else if (elementType === 'edge') {
    newDiagram.edges = diagram.edges.map(edge => 
      edge.id === elementId ? { ...edge, zIndex: newZIndex } : edge
    );
  } else if (elementType === 'text') {
    newDiagram.texts = diagram.texts.map(text => 
      text.id === elementId ? { ...text, zIndex: newZIndex } : text
    );
  } else if (elementType === 'image') {
    newDiagram.images = diagram.images.map(image => 
      image.id === elementId ? { ...image, zIndex: newZIndex } : image
    );
  }
  
  return newDiagram;
}

export function bringToFront(diagram, elementId, elementType) {
  const allElements = getAllElements(diagram);
  const maxZIndex = Math.max(...allElements.map(e => e.zIndex), 0);
  return updateElementZIndex(diagram, elementId, elementType, maxZIndex + 1);
}

export function sendToBack(diagram, elementId, elementType) {
  const allElements = getAllElements(diagram);
  const minZIndex = Math.min(...allElements.map(e => e.zIndex), 0);
  return updateElementZIndex(diagram, elementId, elementType, minZIndex - 1);
}

export function bringForward(diagram, elementId, elementType) {
  const allElements = getAllElements(diagram);
  const element = allElements.find(e => e.data.id === elementId && e.type === elementType);
  if (!element) return diagram;
  return updateElementZIndex(diagram, elementId, elementType, element.zIndex + 1);
}

export function sendBackward(diagram, elementId, elementType) {
  const allElements = getAllElements(diagram);
  const element = allElements.find(e => e.data.id === elementId && e.type === elementType);
  if (!element) return diagram;
  return updateElementZIndex(diagram, elementId, elementType, element.zIndex - 1);
}
