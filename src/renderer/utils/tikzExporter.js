export function exportToTikZ(diagram) {
  const { canvas, nodes = [], edges = [] } = diagram;
  
  // 收集所有使用的颜色
  const colors = new Set();
  nodes.forEach(node => {
    if (node.style.stroke) colors.add(node.style.stroke.replace('#', ''));
    if (node.style.fill) colors.add(node.style.fill.replace('#', ''));
  });
  edges.forEach(edge => {
    if (edge.strokeColor) colors.add(edge.strokeColor.replace('#', ''));
  });
  
  // 生成颜色定义
  let colorDefs = '';
  colors.forEach(color => {
    if (color && color.length === 6) {
      const r = parseInt(color.substr(0, 2), 16) / 255;
      const g = parseInt(color.substr(2, 2), 16) / 255;
      const b = parseInt(color.substr(4, 2), 16) / 255;
      colorDefs += `\\definecolor{c${color}}{rgb}{${r.toFixed(3)},${g.toFixed(3)},${b.toFixed(3)}}\n`;
    }
  });
  
  let tikz = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{ctex}
\\usepackage{tikz}
\\usepackage{xcolor}
\\usetikzlibrary{shapes,arrows,positioning}

${colorDefs}
\\begin{document}

\\begin{tikzpicture}[node distance=2cm]

`;

  nodes.forEach(node => {
    const width = (node.width / 10).toFixed(1);
    const height = (node.height / 10).toFixed(1);
    const strokeColor = node.style.stroke?.replace('#', '') || '000000';
    const fillColor = node.style.fill?.replace('#', '') || 'ffffff';
    const strokeWidth = node.style.strokeWidth || 1;
    
    let options = [
      `minimum width=${width}cm`,
      `minimum height=${height}cm`,
      `draw=c${strokeColor}`,
      `fill=c${fillColor}`,
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
    
    const yPos = ((canvas.height - node.y - node.height) / 10).toFixed(1);
    const xPos = (node.x / 10).toFixed(1);
    
    tikz += `  \\node[${options.join(', ')}] (${node.id}) at (${xPos}, ${yPos}) {${node.label}};\n`;
    
    if (node.subtitle) {
      tikz += `  \\node[below=0.3cm of ${node.id}, font=\\small] {${node.subtitle}};\n`;
    }
  });

  tikz += '\n';
  
  edges.forEach(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) return;

    let drawOptions = ['->'];
    
    const edgeColor = edge.strokeColor?.replace('#', '') || '333333';
    if (edgeColor !== '333333') {
      drawOptions.push(`c${edgeColor}`);
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

    tikz += `  \\draw[${drawOptions.join(', ')}] (${edge.from}) -- (${edge.to});\n`;
    
    if (edge.label) {
      const fromX = fromNode.x + fromNode.width / 2;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x + toNode.width / 2;
      const toY = toNode.y + toNode.height / 2;
      const midX = ((fromX + toX) / 2 / 10).toFixed(1);
      const midY = ((canvas.height - (fromY + toY) / 2) / 10 + 0.3).toFixed(1);
      tikz += `  \\node at (${midX}, ${midY}) {${edge.label}};\n`;
    }
  });

  tikz += `
\\end{tikzpicture}

\\end{document}`;

  return tikz;
}
