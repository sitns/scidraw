export function exportToTikZ(diagram) {
  const { canvas, nodes = [], edges = [] } = diagram;
  
  let tikz = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{tikz}
\\usepackage{xcolor}
\\usetikzlibrary{shapes,arrows,positioning}

\\begin{document}

\\begin{tikzpicture}[node distance=2cm]

`;

  nodes.forEach(node => {
    const width = node.width / 10;
    const height = node.height / 10;
    const strokeColor = node.style.stroke || '#000000';
    const fillColor = node.style.fill || '#ffffff';
    const strokeWidth = node.style.strokeWidth || 1;
    
    let options = [
      `minimum width=${width}cm`,
      `minimum height=${height}cm`,
      `draw=${strokeColor.replace('#', '')}`,
      `fill=${fillColor.replace('#', '')}`,
      'text centered'
    ];
    
    if (node.type === 'rounded') {
      options.push('rounded corners');
    } else if (node.type === 'circle') {
      options.push('circle');
    }
    
    if (node.style.strokeDasharray === 'dashed') {
      options.push('dashed');
    } else if (node.style.strokeDasharray === 'dotted') {
      options.push('dotted');
    }
    
    if (strokeWidth !== 1) {
      options.push(`line width=${strokeWidth}pt`);
    }
    
    const yPos = (canvas.height - node.y - node.height) / 10;
    
    tikz += `  \\node[${options.join(', ')}] (${node.id}) at (${(node.x / 10).toFixed(2)}, ${yPos.toFixed(2)}) {${node.label}};\n`;
    
    if (node.subtitle) {
      tikz += `  \\node[below=0.3cm of ${node.id}, font=\\small] {${node.subtitle}};\n`;
    }
  });

  tikz += '\n';
  
  edges.forEach(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) return;

    let drawOptions = [];
    
    const edgeColor = edge.strokeColor || '#333333';
    if (edgeColor !== '#333333') {
      drawOptions.push(edgeColor.replace('#', ''));
    }
    
    if (edge.style === 'dashed') {
      drawOptions.push('dashed');
    } else if (edge.style === 'dotted') {
      drawOptions.push('dotted');
    }

    const edgeStrokeWidth = edge.strokeWidth || 1.5;
    if (edgeStrokeWidth !== 1.5) {
      drawOptions.push(`line width=${edgeStrokeWidth}pt`);
    }

    const optionsStr = drawOptions.length > 0 ? `[${drawOptions.join(', ')}]` : '';
    
    if (edge.controlPoints && edge.controlPoints.length > 0) {
      const points = edge.controlPoints.map(cp => 
        `(${(cp.x / 10).toFixed(2)}, ${((canvas.height - cp.y) / 10).toFixed(2)})`
      ).join(' .. ');
      tikz += `  \\draw[->${optionsStr ? ', ' + drawOptions.join(', ') : ''}] (${edge.from}) .. controls ${points} .. (${edge.to});\n`;
    } else {
      tikz += `  \\draw[->${optionsStr ? ', ' + drawOptions.join(', ') : ''}] (${edge.from}) -- (${edge.to});\n`;
    }
    
    if (edge.label) {
      const fromX = fromNode.x + fromNode.width / 2;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x + toNode.width / 2;
      const toY = toNode.y + toNode.height / 2;
      const midX = (fromX + toX) / 2 / 10;
      const midY = (canvas.height - (fromY + toY) / 2) / 10;
      tikz += `  \\node at (${midX.toFixed(2)}, ${(midY + 0.3).toFixed(2)}) {${edge.label}};\n`;
    }
  });

  tikz += `
\\end{tikzpicture}

\\end{document}`;

  return tikz;
}
