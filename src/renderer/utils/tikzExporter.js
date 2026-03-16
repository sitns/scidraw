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
    
    tikz += `  \\node[box={${width}cm}{${height}cm}{${colorStroke}}{${colorFill}}] (${node.id}) at (${node.x/10}, ${(canvas.height - node.y - node.height)/10}) {${node.label}};
`;
    
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
    
    let arrow = '';
    if (edge.style === 'dashed') {
      tikz += `  \\draw[dashed,->] (${edge.from}) -- (${edge.to});
`;
    } else {
      tikz += `  \\draw[->] (${edge.from}) -- (${edge.to});
`;
    }
    
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
