import React, { useState, useCallback, useEffect, useRef } from 'react';
import yaml from 'js-yaml';
import { parseDiagram, serializeDiagram } from './utils/dslParser';
import { exportToTikZ } from './utils/tikzExporter';
import { t, getLocale, setLocale } from './utils/i18n';
import WelcomeScreen from './components/WelcomeScreen';
import GuideOverlay from './components/GuideOverlay';
import NodeToolbar from './components/NodeToolbar';
import NodePropertiesPanel from './components/NodePropertiesPanel';

const DEFAULT_DSL = `# SciDraw 图表定义
# 使用 YAML 格式描述科研图表

canvas:
  width: 800
  height: 600
  background: "#ffffff"

nodes:
  - id: input
    type: box
    x: 50
    y: 50
    width: 120
    height: 60
    label: "输入数据"
    style:
      fill: "#e3f2fd"
      stroke: "#2196f3"
      strokeWidth: 2

  - id: process
    type: box
    x: 220
    y: 40
    width: 140
    height: 80
    label: "数据处理"
    subtitle: "算法"
    style:
      fill: "#e8f5e9"
      stroke: "#4caf50"
      strokeWidth: 2

  - id: output
    type: box
    x: 420
    y: 50
    width: 120
    height: 60
    label: "输出结果"
    style:
      fill: "#fff3e0"
      stroke: "#ff9800"
      strokeWidth: 2

edges:
  - from: input
    to: process
    style: solid

  - from: process
    to: output
    style: solid
    label: "结果"
`;

function App() {
  const [code, setCode] = useState(DEFAULT_DSL);
  const [diagram, setDiagram] = useState(null);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [syncDirection, setSyncDirection] = useState('code-to-visual');
  const [locale, setLocaleState] = useState(getLocale);
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem('scidraw-welcomed') !== 'true';
  });
  const [showGuide, setShowGuide] = useState(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [monacoError, setMonacoError] = useState(false);
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isEditorUpdating = useRef(false);

  const handleLocaleChange = useCallback((newLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  useEffect(() => {
    const loadMonaco = async () => {
      if (!window.monaco) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
        script.onload = () => {
          window.require.config({
            paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
          });
          window.require(['vs/editor/editor.main'], () => {
            setMonacoLoaded(true);
            initEditor();
          }, (err) => {
            console.error('Monaco load error:', err);
            setMonacoError(true);
          });
        };
        script.onerror = () => {
          console.error('Failed to load Monaco script');
          setMonacoError(true);
        };
        document.head.appendChild(script);
      } else {
        setMonacoLoaded(true);
        initEditor();
      }
    };
    loadMonaco();
  }, []);

  useEffect(() => {
    if (monacoLoaded && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.layout();
      }, 100);
    }
  }, [monacoLoaded]);

  useEffect(() => {
    if (editorRef.current && !isEditorUpdating.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== code) {
        isEditorUpdating.current = true;
        editorRef.current.setValue(code);
        isEditorUpdating.current = false;
      }
    }
  }, [code]);

  useEffect(() => {
    try {
      const parsed = parseDiagram(DEFAULT_DSL);
      setDiagram(parsed);
    } catch (e) {
      console.error('Initial parse error:', e);
    }
  }, []);

  const initEditor = () => {
    if (editorRef.current || !editorContainerRef.current) return;

    monacoRef.current = window.monaco;
    
    editorRef.current = window.monaco.editor.create(editorContainerRef.current, {
      value: code,
      language: 'yaml',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on'
    });

    editorRef.current.onDidChangeModelContent(() => {
      if (syncDirection !== 'code-to-visual') return;
      isEditorUpdating.current = true;
      const newCode = editorRef.current.getValue();
      setCode(newCode);
      isEditorUpdating.current = false;
      try {
        const parsed = parseDiagram(newCode);
        setDiagram(parsed);
        setError(null);
      } catch (e) {
        setError(e.message);
      }
    });
  };

  const handleCodeChange = useCallback((value) => {
    setCode(value);
    try {
      const parsed = parseDiagram(value);
      setDiagram(parsed);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleVisualChange = useCallback((newDiagram) => {
    setSyncDirection('visual-to-code');
    setDiagram(newDiagram);
    
    const newCode = serializeDiagram(newDiagram);
    if (editorRef.current) {
      const currentPosition = editorRef.current.getPosition();
      editorRef.current.setValue(newCode);
      if (currentPosition) {
        editorRef.current.setPosition(currentPosition);
      }
    }
    setCode(newCode);
    
    setTimeout(() => setSyncDirection('code-to-visual'), 100);
  }, []);

  const handleAddNode = useCallback((nodeType, style) => {
    if (!diagram) return;
    
    const newNodeId = `node_${Date.now()}`;
    const usedIds = diagram.nodes.map(n => n.id);
    let finalId = newNodeId;
    let counter = 1;
    while (usedIds.includes(finalId)) {
      finalId = `node_${Date.now()}_${counter}`;
      counter++;
    }

    const existingNodes = diagram.nodes;
    let newX = 50;
    let newY = 50;
    
    if (existingNodes.length > 0) {
      const maxY = Math.max(...existingNodes.map(n => n.y));
      newY = maxY + 80;
      if (newY > 500) {
        newY = 50;
        const maxX = Math.max(...existingNodes.map(n => n.x + n.width));
        newX = maxX + 20;
      }
    }

    const newNode = {
      id: finalId,
      type: nodeType || 'box',
      x: newX,
      y: newY,
      width: style?.width || 120,
      height: style?.height || 60,
      label: style?.label || locale === 'zh' ? '新节点' : 'New Node',
      subtitle: style?.subtitle || '',
      style: {
        fill: style?.fill || '#ffffff',
        stroke: style?.stroke || '#000000',
        strokeWidth: style?.strokeWidth || 2
      }
    };

    handleVisualChange({
      ...diagram,
      nodes: [...diagram.nodes, newNode]
    });
  }, [diagram, handleVisualChange, locale]);

  const handleAddEdge = useCallback((fromId, toId, style = 'solid') => {
    if (!diagram) return;
    if (!fromId || !toId || fromId === toId) return;

    const existingEdge = diagram.edges.find(e => 
      (e.from === fromId && e.to === toId) || 
      (e.from === toId && e.to === fromId)
    );
    if (existingEdge) return;

    const newEdge = {
      id: `edge_${Date.now()}`,
      from: fromId,
      to: toId,
      label: '',
      style: style
    };

    handleVisualChange({
      ...diagram,
      edges: [...diagram.edges, newEdge]
    });
  }, [diagram, handleVisualChange]);

  const handleDeleteNode = useCallback((nodeId) => {
    if (!diagram) return;
    
    handleVisualChange({
      ...diagram,
      nodes: diagram.nodes.filter(n => n.id !== nodeId),
      edges: diagram.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
    });
    setSelectedId(null);
  }, [diagram, handleVisualChange]);

  const handleUpdateNode = useCallback((updatedNode) => {
    if (!diagram) return;
    
    const newNodes = diagram.nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    );
    handleVisualChange({ ...diagram, nodes: newNodes });
  }, [diagram, handleVisualChange]);

  const handleUpdateEdge = useCallback((updatedEdge) => {
    if (!diagram) return;
    
    const newEdges = diagram.edges.map(edge => 
      edge.id === updatedEdge.id ? updatedEdge : edge
    );
    handleVisualChange({ ...diagram, edges: newEdges });
  }, [diagram, handleVisualChange]);

  const handleDeleteEdge = useCallback((edgeId) => {
    if (!diagram) return;
    
    handleVisualChange({
      ...diagram,
      edges: diagram.edges.filter(e => e.id !== edgeId)
    });
    setSelectedId(null);
  }, [diagram, handleVisualChange]);

  const handleNodeMove = useCallback((nodeId, x, y) => {
    if (!diagram) return;
    const newNodes = diagram.nodes.map(node => 
      node.id === nodeId ? { ...node, x, y } : node
    );
    handleVisualChange({ ...diagram, nodes: newNodes });
  }, [diagram, handleVisualChange]);

  const handleSave = async () => {
    if (window.electronAPI) {
      await window.electronAPI.saveFile({
        content: code,
        defaultName: 'diagram.yaml',
        filters: [{ name: 'YAML Files', extensions: ['yaml', 'yml'] }]
      });
    }
  };

  const handleOpen = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile();
      if (result.success) {
        handleCodeChange(result.content);
        if (editorRef.current) {
          editorRef.current.setValue(result.content);
        }
      }
    }
  };

  const handleNewFile = () => {
    const emptyDiagram = `canvas:
  width: 800
  height: 600
  background: "#ffffff"

nodes: []

edges: []
`;
    isEditorUpdating.current = true;
    setCode(emptyDiagram);
    try {
      const parsed = parseDiagram(emptyDiagram);
      setDiagram(parsed);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    if (editorRef.current) {
      editorRef.current.setValue(emptyDiagram);
    }
    isEditorUpdating.current = false;
  };

  const handleExportTikZ = async () => {
    if (!diagram) return;
    const tikzCode = exportToTikZ(diagram);
    
    if (window.electronAPI) {
      await window.electronAPI.exportTikZ({ content: tikzCode });
    } else {
      console.log('TikZ Export:', tikzCode);
    }
  };

  const handleExportPDF = async () => {
    if (!diagram) return;
    
    const svgElement = document.querySelector('.canvas-container svg');
    if (!svgElement) return;
    
    const canvas = diagram.canvas || { width: 800, height: 600 };
    const width = canvas.width || 800;
    const height = canvas.height || 600;
    
    const svgClone = svgElement.cloneNode(true);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);
    
    const controlPointElements = svgClone.querySelectorAll('g[key^="cp-"]');
    controlPointElements.forEach(el => el.remove());
    
    const svgString = new XMLSerializer().serializeToString(svgClone);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Diagram</title>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            svg { max-width: 100%; max-height: 100vh; }
            @media print {
              body { min-height: auto; }
              svg { max-height: none; }
            }
          </style>
        </head>
        <body>
          ${svgClone.outerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('scidraw-welcomed', 'true');
    setShowGuide(true);
  };

  const handleGuideClose = () => {
    setShowGuide(false);
  };

  if (showWelcome) {
    return (
      <WelcomeScreen 
        locale={locale}
        onLocaleChange={handleLocaleChange}
        onClose={handleWelcomeClose}
        onTryExample={() => {
          setShowWelcome(false);
          localStorage.setItem('scidraw-welcomed', 'true');
        }}
      />
    );
  }

  return (
    <div className="app">
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="toolbar-title">{t('appTitle', locale)}</span>
          <select 
            value={locale} 
            onChange={(e) => handleLocaleChange(e.target.value)}
            style={{
              background: '#3e3e3e',
              color: '#fff',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={handleNewFile}>{t('toolbar.newFile', locale)}</button>
          <button className="toolbar-btn secondary" onClick={handleOpen}>{t('toolbar.open', locale)}</button>
          <button className="toolbar-btn secondary" onClick={handleSave}>{t('toolbar.save', locale)}</button>
          <button className="toolbar-btn" onClick={handleExportPDF}>{t('toolbar.exportPDF', locale)}</button>
          <button className="toolbar-btn" onClick={handleExportTikZ}>{t('toolbar.exportTikZ', locale)}</button>
        </div>
      </div>

      <div className="main-content">
        <NodeToolbar 
          locale={locale}
          nodes={diagram?.nodes || []}
          selectedId={selectedId}
          onAddNode={handleAddNode}
          onAddEdge={handleAddEdge}
          onDeleteNode={handleDeleteNode}
        />

        <div className="panel" style={{ width: '40%' }}>
          <div className="panel-header">
            <span className="panel-title">{t('panels.codeEditor', locale)}</span>
          </div>
          <div className="editor-container" ref={editorContainerRef}>
            {!monacoLoaded || monacoError ? (
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
              />
            ) : null}
          </div>
        </div>

        <div className="panel" style={{ flex: 1, borderRight: 'none' }}>
          <div className="panel-header">
            <span className="panel-title">{t('panels.visualCanvas', locale)}</span>
            <button 
              className="toolbar-btn secondary" 
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => setShowGuide(true)}
            >
              {locale === 'zh' ? '新手引导' : 'Guide'}
            </button>
          </div>
          <VisualCanvas 
            diagram={diagram} 
            onNodeMove={handleNodeMove}
            onEdgeUpdate={handleUpdateEdge}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <NodePropertiesPanel 
          locale={locale}
          selectedNode={diagram?.nodes?.find(n => n.id === selectedId)}
          selectedEdge={diagram?.edges?.find(e => e.id === selectedId)}
          nodes={diagram?.nodes || []}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
        />
      </div>

      {error && (
        <div className="error-panel">
          {t('errors.parseError', locale)}: {error}
        </div>
      )}

      <div className="status-bar">
        <div className="status-left">
          <span>{diagram?.nodes?.length || 0} {t('statusBar.nodes', locale)}</span>
          <span>{diagram?.edges?.length || 0} {t('statusBar.edges', locale)}</span>
        </div>
        <div className="status-right">
          <span>{syncDirection === 'code-to-visual' ? t('statusBar.codeToVisual', locale) : t('statusBar.visualToCode', locale)}</span>
        </div>
      </div>

      {showGuide && (
        <GuideOverlay 
          locale={locale}
          onClose={handleGuideClose}
        />
      )}
    </div>
  );
}

function NodeShape({ node, selected, onMouseDown }) {
  const { x, y, width, height, type, label, subtitle, style } = node;
  const fill = style?.fill || '#fff';
  const stroke = style?.stroke || '#000';
  const strokeWidth = style?.strokeWidth || 1;
  const strokeDasharray = (() => {
    switch (style?.strokeDasharray) {
      case 'dashed': return '8,4';
      case 'dotted': return '2,2';
      default: return 'none';
    }
  })();

  const renderShape = () => {
    switch (type) {
      case 'circle':
        return (
          <g transform={`translate(${width/2}, ${height/2})`}>
            <circle r={Math.min(width, height) / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          </g>
        );
      case 'diamond':
        const cx = width / 2;
        const cy = height / 2;
        return (
          <polygon 
            points={`${cx},0 ${width},${cy} ${cx},${height} 0,${cy}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'rounded':
        return (
          <rect
            width={width}
            height={height}
            rx={Math.min(height / 4, 12)}
            ry={Math.min(height / 4, 12)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'process':
        return (
          <polygon
            points={`${height/2},0 ${width - height/2},0 ${width},${height/2} ${width - height/2},${height} ${height/2},${height} 0,${height/2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'data':
        return (
          <path
            d={`M 0,${height/2} L ${height/4},0 L ${width - height/4},0 C ${width},0 ${width},${height} ${width - height/4},${height} L ${height/4},${height} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      case 'box':
      default:
        return (
          <rect
            width={width}
            height={height}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
    }
  };

  const textY = type === 'diamond' ? height / 2 : height / 2;
  
  return (
    <g 
      className={`shape node ${selected ? 'selected' : ''}`}
      onMouseDown={onMouseDown}
      transform={`translate(${x}, ${y})`}
    >
      {renderShape()}
      <text
        x={width / 2}
        y={textY - 6}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#000"
      >
        {label}
      </text>
      {subtitle && (
        <text
          x={width / 2}
          y={textY + 12}
          textAnchor="middle"
          fontSize="10"
          fill="#666"
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

function VisualCanvas({ diagram, onNodeMove, onEdgeUpdate, selectedId, onSelect }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState(null);
  const [draggingCP, setDraggingCP] = useState(null);
  const [, setForceUpdate] = useState(0);

  const canvas = diagram?.canvas || { width: 800, height: 600 };
  const nodes = diagram?.nodes || [];
  const edges = diagram?.edges || [];
  const width = canvas.width || 800;
  const height = canvas.height || 600;

  const handleControlPointMouseDown = (e, edgeId, idx) => {
    e.stopPropagation();
    const edge = edges.find(ed => ed.id === edgeId);
    if (edge && edge.controlPoints && edge.controlPoints[idx]) {
      setDraggingCP({ edgeId, idx });
    }
    onSelect(edgeId);
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingCP) return;
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    const edge = edges.find(ed => ed.id === draggingCP.edgeId);
    if (edge) {
      const newControlPoints = [...(edge.controlPoints || [])];
      newControlPoints[draggingCP.idx] = { x: svgP.x, y: svgP.y };
      onEdgeUpdate({ ...edge, controlPoints: newControlPoints });
      setForceUpdate(n => n + 1);
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingCP(null);
  };

  useEffect(() => {
    if (!dragging) return;
    
    const handleGlobalMouseMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      const newX = Math.max(0, svgP.x - offset.x);
      const newY = Math.max(0, svgP.y - offset.y);
      
      onNodeMove(dragging, newX, newY);
    };
    
    const handleGlobalMouseUp = () => {
      setDragging(null);
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragging, offset, onNodeMove]);

  if (!diagram) {
    return (
      <div className="canvas-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#666' }}>Loading...</span>
      </div>
    );
  }

  const handleMouseDown = (e, nodeId) => {
    if (e.button === 2) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    setDragging(nodeId);
    setOffset({ x: svgP.x - node.x, y: svgP.y - node.y });
    onSelect(nodeId);
  };

  const handleMouseMove = (e) => {
    if (connecting) {
      return;
    }
    handleCanvasMouseMove(e);
  };

  const handleMouseUp = () => {
    setDragging(null);
    setConnecting(null);
    handleCanvasMouseUp();
  };

  const handleAddControlPoint = (edgeId) => {
    const edge = edges.find(ed => ed.id === edgeId);
    if (edge) {
      const edgeData = getEdgePath(edge);
      const newPoint = {
        x: (edgeData.start.x + edgeData.end.x) / 2,
        y: (edgeData.start.y + edgeData.end.y) / 2
      };
      const newControlPoints = [...(edge.controlPoints || []), newPoint];
      onEdgeUpdate({ ...edge, controlPoints: newControlPoints });
    }
  };

  const handleRemoveControlPoint = (edgeId, index) => {
    const edge = edges.find(ed => ed.id === edgeId);
    if (edge && edge.controlPoints) {
      const newControlPoints = edge.controlPoints.filter((_, i) => i !== index);
      onEdgeUpdate({ ...edge, controlPoints: newControlPoints });
    }
  };

  const getNodeAnchor = (node, direction) => {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const w = node.width / 2;
    const h = node.height / 2;
    
    switch (direction) {
      case 'left':
        return { x: node.x, y: cy };
      case 'right':
        return { x: node.x + node.width, y: cy };
      case 'top':
        return { x: cx, y: node.y };
      case 'bottom':
        return { x: cx, y: node.y + node.height };
      case 'auto':
      default:
        return { x: node.x + node.width, y: cy };
    }
  };

  const getBestAnchor = (fromNode, toNode, fromDir, toDir) => {
    if (fromDir !== 'auto' && toDir !== 'auto') {
      return {
        start: getNodeAnchor(fromNode, fromDir),
        end: getNodeAnchor(toNode, toDir)
      };
    }
    
    const fromCx = fromNode.x + fromNode.width / 2;
    const fromCy = fromNode.y + fromNode.height / 2;
    const toCx = toNode.x + toNode.width / 2;
    const toCy = toNode.y + toNode.height / 2;
    
    const dx = toCx - fromCx;
    const dy = toCy - fromCy;
    
    let startDir = 'right';
    let endDir = 'left';
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        startDir = 'right';
        endDir = 'left';
      } else {
        startDir = 'left';
        endDir = 'right';
      }
    } else {
      if (dy > 0) {
        startDir = 'bottom';
        endDir = 'top';
      } else {
        startDir = 'top';
        endDir = 'bottom';
      }
    }
    
    return {
      start: getNodeAnchor(fromNode, fromDir !== 'auto' ? fromDir : startDir),
      end: getNodeAnchor(toNode, toDir !== 'auto' ? toDir : endDir)
    };
  };

  const getEdgePath = (edge) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return { path: '', start: {x:0,y:0}, end: {x:0,y:0} };
    
    const anchors = getBestAnchor(fromNode, toNode, edge.fromDir || 'auto', edge.toDir || 'auto');
    let { start, end } = anchors;
    
    const curveType = edge.curveType || 'auto';
    const controlPoints = edge.controlPoints || [];
    
    let path;
    
    if (curveType === 'straight') {
      path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    } else if (curveType === 'manual' && controlPoints.length >= 1) {
      path = `M ${start.x} ${start.y}`;
      for (let i = 0; i < controlPoints.length; i++) {
        path += ` L ${controlPoints[i].x} ${controlPoints[i].y}`;
      }
      path += ` L ${end.x} ${end.y}`;
    } else if (curveType === 'bezier' && controlPoints.length >= 1) {
      path = `M ${start.x} ${start.y} Q ${controlPoints[0].x} ${controlPoints[0].y} ${end.x} ${end.y}`;
    } else if (curveType === 'bezier2' && controlPoints.length >= 2) {
      path = `M ${start.x} ${start.y} C ${controlPoints[0].x} ${controlPoints[0].y} ${controlPoints[1].x} ${controlPoints[1].y} ${end.x} ${end.y}`;
    } else {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      
      let cp1x, cp1y, cp2x, cp2y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        cp1x = start.x + dx * 0.5;
        cp1y = start.y;
        cp2x = end.x - dx * 0.5;
        cp2y = end.y;
      } else {
        cp1x = start.x;
        cp1y = start.y + dy * 0.5;
        cp2x = end.x;
        cp2y = end.y - dy * 0.5;
      }
      
      path = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
    }
    
    return {
      path,
      end,
      start,
      controlPoints
    };
  };

  return (
    <div 
      className="canvas-container"
      style={{ position: 'relative' }}
    >
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={{ background: canvas?.background || '#fff', width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target.tagName === 'svg') {
            onSelect(null);
          }
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
        </defs>

        {edges.map((edge, i) => {
          const edgeData = getEdgePath(edge);
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          const midX = fromNode && toNode ? (fromNode.x + fromNode.width/2 + toNode.x + toNode.width/2) / 2 : 0;
          const midY = fromNode && toNode ? (fromNode.y + fromNode.height/2 + toNode.y + toNode.height/2) / 2 : 0;
          const isSelected = selectedId === edge.id;
          
          const getStrokeDasharray = (style) => {
            switch (style) {
              case 'dashed':
                return '8,4';
              case 'dotted':
                return '2,2';
              default:
                return 'none';
            }
          };
          
          return (
            <g 
              key={`edge-${i}`} 
              className={`edge ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(edge.id);
              }}
            >
              <path
                d={edgeData.path}
                stroke={isSelected ? '#007acc' : (edge.strokeColor || '#333')}
                strokeWidth={isSelected ? (edge.strokeWidth || 1.5) * 2 : (edge.strokeWidth || 1.5)}
                strokeDasharray={getStrokeDasharray(edge.style)}
                fill="none"
                markerEnd="url(#arrowhead)"
              />
              {isSelected && edge.controlPoints && edge.controlPoints.length > 0 && edge.controlPoints.map((cp, idx) => (
                <g key={`cp-${idx}`}>
                  <circle 
                    cx={cp.x} 
                    cy={cp.y} 
                    r={10} 
                    fill="rgba(0, 122, 204, 0.3)" 
                    stroke="#007acc" 
                    strokeWidth={2}
                    style={{ cursor: 'move', pointerEvents: 'all' }}
                    onMouseDown={(e) => handleControlPointMouseDown(e, edge.id, idx)}
                  />
                  <circle 
                    cx={cp.x} 
                    cy={cp.y} 
                    r={4} 
                    fill="#007acc"
                    style={{ pointerEvents: 'none' }}
                  />
                  <text 
                    x={cp.x} 
                    y={cp.y - 12} 
                    fontSize={11} 
                    fill="#007acc"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {idx + 1}
                  </text>
                </g>
              ))}
              {edge.label && (
                <text 
                  x={midX} 
                  y={midY - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#333"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((node) => (
          <NodeShape 
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
          />
        ))}
      </svg>
    </div>
  );
}

export default App;
