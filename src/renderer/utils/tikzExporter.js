export function exportToTikZ(diagram) {
  const { canvas, nodes = [], edges = [] } = diagram;
  
  let tikz = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{tikz}
\\usetikzlibrary{shapes,arrows,positioning}

\\begin{document}

\\begin{tikzpicture}[
  node distance=1cm,
  box/.style={rectangle, rounded corners, minimum width=#1, minimum height=#2, text centered, draw=#3, fill=#4},
  arrow/.style={thick,->,>=stealth}
]

`;

  nodes.forEach(node => {
    const width = node.width / 10;
    const height = node.height / 10;
    const stroke = node.style.stroke.replace('#', '');
    const fill = node.style.fill.replace('#', '');

    let colorStroke = stroke;
    let colorFill = fill;

    if (stroke.length === 6) {
      colorStroke = `{RGB}{${parseInt(stroke.substr(0,2),16)},${parseInt(stroke.substr(2,2),16)},${parseInt(stroke.substr(4,2),16)}}`;
    }
    if (fill.length === 6) {
      colorFill = `{RGB}{${parseInt(fill.substr(0,2),16)},${parseInt(fill.substr(2,2),16)},${parseInt(fill.substr(4,2),16)}}`;
    }

    let extraOptions = '';
    const sw = node.style.strokeWidth || 1;
    if (sw !== 1) {
      extraOptions += `, line width=${sw}pt`;
    }
    if (node.style.strokeDasharray === 'dashed') {
      extraOptions += ', dashed';
    } else if (node.style.strokeDasharray === 'dotted') {
      extraOptions += ', dotted';
    }

    tikz += `  \\node[box={${width}cm}{${height}cm}{${colorStroke}}{${colorFill}}${extraOptions}] (${node.id}) at (${node.x/10}, ${(canvas.height - node.y - node.height)/10}) {${node.label}};\n`;
    
    if (node.subtitle) {
      tikz += `    node[below=0.2cm of ${node.id}, font=\\fontsize{8pt}{10pt}\\selectfont] {${node.subtitle}};
`;
    }
  });

  tikz += '\n';
  
  edges.forEach(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) return;

    let drawOptions = ['->'];

    if (edge.style === 'dashed') {
      drawOptions.push('dashed');
    } else if (edge.style === 'dotted') {
      drawOptions.push('dotted');
    }

    const edgeStrokeWidth = edge.strokeWidth || 1.5;
    if (edgeStrokeWidth !== 1.5) {
      drawOptions.push(`line width=${edgeStrokeWidth}pt`);
    }

    if (edge.strokeColor && edge.strokeColor !== '#333333') {
      const ec = edge.strokeColor.replace('#', '');
      if (ec.length === 6) {
        const colorDef = `{RGB}{${parseInt(ec.substr(0,2),16)},${parseInt(ec.substr(2,2),16)},${parseInt(ec.substr(4,2),16)}}`;
        drawOptions.push(`color=${colorDef}`);
      }
    }

    tikz += `  \\draw[${drawOptions.join(',')}] (${edge.from}) -- (${edge.to});\n`;
    
    if (edge.label) {
      const midX = (fromNode.x + fromNode.width/2 + toNode.x + toNode.width/2) / 2 / 10;
      const midY = (fromNode.y + fromNode.height/2 + toNode.y + toNode.height/2) / 2 / 10;
      tikz += `  \\node at (${midX}, ${midY + 0.3}) {${edge.label}};
`;
    }
  });

  tikz += `\\end{tikzpicture}

\\end{document}`;

  return tikz;
}
