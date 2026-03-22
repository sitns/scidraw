import React, { useState, useCallback, useEffect, useRef } from 'react';
import yaml from 'js-yaml';
import { parseDiagram, serializeDiagram, bringToFront, sendToBack, bringForward, sendBackward, centerDiagram } from './utils/dslParser';
import { parseTikZ } from './utils/tikzParser';
import { parseMermaid } from './utils/mermaidParser';
import { t, getLocale, setLocale } from './utils/i18n';
import WelcomeScreen from './components/WelcomeScreen';
import GuideOverlay from './components/GuideOverlay';
import NodeToolbar from './components/NodeToolbar';
import NodePropertiesPanel from './components/NodePropertiesPanel';
import TikZImportDialog from './components/TikZImportDialog';
import MermaidImportDialog from './components/MermaidImportDialog';

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
  const [selectedIds, setSelectedIds] = useState([]);
  const [syncDirection, setSyncDirection] = useState('code-to-visual');
  const [locale, setLocaleState] = useState(getLocale);
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem('scidraw-welcomed') !== 'true';
  });
  const [showGuide, setShowGuide] = useState(false);
  const [showTikzDialog, setShowTikzDialog] = useState(false);
  const [showMermaidDialog, setShowMermaidDialog] = useState(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [monacoError, setMonacoError] = useState(false);
  const [editorWidth, setEditorWidth] = useState(40); // 百分比
  const [propertyWidth, setPropertyWidth] = useState(220); // 像素
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isEditorUpdating = useRef(false);
  const syncDirectionRef = useRef(syncDirection);
  const diagramRef = useRef(diagram);
  const imageStoreRef = useRef({});  // 独立存储图片base64数据, key=imageId

  const handleLocaleChange = useCallback((newLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  useEffect(() => {
    syncDirectionRef.current = syncDirection;
  }, [syncDirection]);

  useEffect(() => {
    diagramRef.current = diagram;
  }, [diagram]);

  // 分隔条拖动处理
  const handleDragStart = useCallback((e, type) => {
    e.preventDefault();
    const startX = e.clientX;
    let startEditorWidth = editorWidth;
    let startPropertyWidth = propertyWidth;

    const handleDrag = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const container = document.querySelector('.main-content');
      const containerWidth = container?.offsetWidth || 1000;
      
      if (type === 'editor') {
        const newWidth = Math.max(20, Math.min(60, startEditorWidth + (deltaX / containerWidth) * 100));
        setEditorWidth(newWidth);
      } else if (type === 'property') {
        const newWidth = Math.max(180, Math.min(400, startPropertyWidth - deltaX));
        setPropertyWidth(newWidth);
      }
    };

    const handleDragEnd = () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
  }, [editorWidth, propertyWidth]);

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
      if (syncDirectionRef.current !== 'code-to-visual') return;
      isEditorUpdating.current = true;
      const newCode = editorRef.current.getValue();
      setCode(newCode);
      isEditorUpdating.current = false;
      try {
        const parsed = parseDiagram(newCode);
        // 从imageStore恢复图片数据
        if (parsed.images) {
          parsed.images = parsed.images.map(img => ({
            ...img,
            src: imageStoreRef.current[img.id] || img.src
          }));
        }
        // 补充imageStore中有但parsed中没有的图片
        const store = imageStoreRef.current;
        Object.keys(store).forEach(id => {
          if (!parsed.images.find(img => img.id === id)) {
            const currentDiagram = diagramRef.current;
            const existing = currentDiagram?.images?.find(img => img.id === id);
            if (existing) {
              parsed.images.push(existing);
            }
          }
        });
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
      // 从imageStore恢复图片数据
      if (parsed.images) {
        parsed.images = parsed.images.map(img => ({
          ...img,
          src: imageStoreRef.current[img.id] || img.src
        }));
      }
      // 补充imageStore中有但parsed中没有的图片
      Object.keys(imageStoreRef.current).forEach(id => {
        if (!parsed.images.find(img => img.id === id)) {
          const existing = diagram?.images?.find(img => img.id === id);
          if (existing) {
            parsed.images.push(existing);
          }
        }
      });
      setDiagram(parsed);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [diagram]);

  const handleVisualChange = useCallback((newDiagram) => {
    setSyncDirection('visual-to-code');
    
    // Preserve actual image data (base64) before serialization
    const imagesWithFullData = newDiagram.images || [];
    
    setDiagram(newDiagram);
    
    try {
      const newCode = serializeDiagram(newDiagram);
      if (editorRef.current) {
        const currentPosition = editorRef.current.getPosition();
        editorRef.current.setValue(newCode);
        if (currentPosition) {
          editorRef.current.setPosition(currentPosition);
        }
      }
      setCode(newCode);
    } catch (err) {
      console.error('Serialization error:', err);
    }
    
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

  const handleAddText = useCallback((content) => {
    if (!diagram) return;

    const newText = {
      id: `text_${Date.now()}`,
      x: 100,
      y: 100,
      content: content,
      fontSize: 14,
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: 'transparent'
    };

    handleVisualChange({
      ...diagram,
      texts: [...(diagram.texts || []), newText]
    });
    setSelectedId(newText.id);
  }, [diagram, handleVisualChange]);

  const handleUpdateText = useCallback((updatedText) => {
    if (!diagram) return;
    
    const newTexts = (diagram.texts || []).map(text => 
      text.id === updatedText.id ? updatedText : text
    );
    handleVisualChange({ ...diagram, texts: newTexts });
  }, [diagram, handleVisualChange]);

  const handleDeleteText = useCallback((textId) => {
    if (!diagram) return;
    
    handleVisualChange({
      ...diagram,
      texts: (diagram.texts || []).filter(t => t.id !== textId)
    });
    setSelectedId(null);
  }, [diagram, handleVisualChange]);

  const handleAddImage = useCallback((imageData) => {
    if (!diagram) return;

    const imageId = `image_${Date.now()}`;
    
    // 存储图片数据到独立store
    imageStoreRef.current[imageId] = imageData.src;

    const newImage = {
      id: imageId,
      x: 100,
      y: 100,
      width: imageData.width || 200,
      height: imageData.height || 150,
      src: imageData.src,
      opacity: 1,
      zIndex: 0
    };

    const newDiagram = {
      ...diagram,
      images: [...(diagram.images || []), newImage]
    };
    
    setDiagram(newDiagram);
    setSelectedId(imageId);
    
    // 更新代码编辑器
    setSyncDirection('visual-to-code');
    try {
      const newCode = serializeDiagram(newDiagram);
      if (editorRef.current) {
        editorRef.current.setValue(newCode);
      }
      setCode(newCode);
    } catch (err) {
      console.error('Serialization error:', err);
    }
    setTimeout(() => setSyncDirection('code-to-visual'), 100);
  }, [diagram]);

  const handleUpdateImage = useCallback((updatedImage) => {
    if (!diagram) return;
    
    const newImages = (diagram.images || []).map(image => 
      image.id === updatedImage.id ? updatedImage : image
    );
    handleVisualChange({ ...diagram, images: newImages });
  }, [diagram, handleVisualChange]);

  const handleDeleteImage = useCallback((imageId) => {
    if (!diagram) return;
    
    const newDiagram = {
      ...diagram,
      images: (diagram.images || []).filter(img => img.id !== imageId)
    };
    setDiagram(newDiagram);
    setSelectedId(null);
  }, [diagram]);

  const handleDeleteSelected = useCallback(() => {
    if (!diagram) return;
    
    const idsToDelete = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToDelete.length === 0) return;
    
    let newDiagram = {
      nodes: [...diagram.nodes],
      edges: [...diagram.edges],
      texts: [...(diagram.texts || [])],
      images: [...(diagram.images || [])]
    };
    
    idsToDelete.forEach(id => {
      if (newDiagram.nodes.find(n => n.id === id)) {
        newDiagram.nodes = newDiagram.nodes.filter(n => n.id !== id);
        newDiagram.edges = newDiagram.edges.filter(e => e.from !== id && e.to !== id);
      } else if (newDiagram.edges.find(e => e.id === id)) {
        newDiagram.edges = newDiagram.edges.filter(e => e.id !== id);
      } else if (newDiagram.texts.find(t => t.id === id)) {
        newDiagram.texts = newDiagram.texts.filter(t => t.id !== id);
      } else if (newDiagram.images.find(i => i.id === id)) {
        newDiagram.images = newDiagram.images.filter(img => img.id !== id);
        delete imageStoreRef.current[id];
      }
    });
    
    setDiagram(newDiagram);
    setSelectedId(null);
    setSelectedIds([]);
  }, [diagram, selectedId, selectedIds]);

  const handleLayerAction = useCallback((action) => {
    if (!diagram || !selectedId) return;
    
    let elementType = 'node';
    
    if (diagram.nodes.find(n => n.id === selectedId)) {
      elementType = 'node';
    } else if (diagram.edges.find(e => e.id === selectedId)) {
      elementType = 'edge';
    } else if (diagram.texts.find(t => t.id === selectedId)) {
      elementType = 'text';
    } else if (diagram.images && diagram.images.find(i => i.id === selectedId)) {
      elementType = 'image';
    }
    
    let newDiagram;
    switch (action) {
      case 'bringToFront':
        newDiagram = bringToFront(diagram, selectedId, elementType);
        break;
      case 'sendToBack':
        newDiagram = sendToBack(diagram, selectedId, elementType);
        break;
      case 'bringForward':
        newDiagram = bringForward(diagram, selectedId, elementType);
        break;
      case 'sendBackward':
        newDiagram = sendBackward(diagram, selectedId, elementType);
        break;
      default:
        return;
    }
    
    setDiagram(newDiagram);
    
    // 更新代码编辑器
    setSyncDirection('visual-to-code');
    try {
      const newCode = serializeDiagram(newDiagram);
      if (editorRef.current) {
        editorRef.current.setValue(newCode);
      }
      setCode(newCode);
    } catch (err) {
      console.error('Layer action serialization error:', err);
    }
    setTimeout(() => setSyncDirection('code-to-visual'), 100);
  }, [diagram, selectedId]);

  const handleLabelMove = useCallback((itemId, type, offsetX, offsetY) => {
    if (!diagram) return;
    
    if (type === 'node') {
      const newNodes = diagram.nodes.map(node => 
        node.id === itemId ? { 
          ...node, 
          labelOffset: { 
            x: (node.labelOffset?.x || 0) + offsetX, 
            y: (node.labelOffset?.y || 0) + offsetY 
          } 
        } : node
      );
      handleVisualChange({ ...diagram, nodes: newNodes });
    } else if (type === 'edge') {
      const newEdges = diagram.edges.map(edge => 
        edge.id === itemId ? { 
          ...edge, 
          labelOffset: { 
            x: (edge.labelOffset?.x || 0) + offsetX, 
            y: (edge.labelOffset?.y || 0) + offsetY 
          } 
        } : edge
      );
      handleVisualChange({ ...diagram, edges: newEdges });
    }
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

  const handleImportTikZ = async () => {
    setShowTikzDialog(true);
  };

  const handleTikzImport = (tikzCode) => {
    try {
      const parsed = parseTikZ(tikzCode);
      const centered = centerDiagram(parsed, 800, 600);
      handleVisualChange(centered);
      if (editorRef.current) {
        editorRef.current.setValue(serializeDiagram(centered));
      }
    } catch (e) {
      setError(`TikZ parse error: ${e.message}`);
    }
  };

  const handleImportMermaid = async () => {
    setShowMermaidDialog(true);
  };

  const handleMermaidImport = (mermaidCode) => {
    try {
      const parsed = parseMermaid(mermaidCode);
      const centered = centerDiagram(parsed, 800, 600);
      handleVisualChange(centered);
      if (editorRef.current) {
        editorRef.current.setValue(serializeDiagram(centered));
      }
    } catch (e) {
      setError(`Mermaid parse error: ${e.message}`);
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
          <button className="toolbar-btn secondary" onClick={handleImportTikZ}>{t('toolbar.importTikZ', locale)}</button>
          <button className="toolbar-btn secondary" onClick={handleImportMermaid}>{t('toolbar.importMermaid', locale)}</button>
          <button className="toolbar-btn" onClick={handleExportPDF}>{t('toolbar.exportPDF', locale)}</button>
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
          onDeleteSelected={handleDeleteSelected}
          onAddText={handleAddText}
          onAddImage={handleAddImage}
          onLayerAction={handleLayerAction}
        />

        <div className="panel" style={{ width: `${editorWidth}%` }}>
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

        <div 
          className="resize-handle"
          onMouseDown={(e) => handleDragStart(e, 'editor')}
          title={locale === 'zh' ? '拖动调整大小' : 'Drag to resize'}
        />

        <div className="panel canvas-panel" style={{ flex: 1 }}>
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
            onTextMove={handleUpdateText}
            onImageMove={handleUpdateImage}
            onLabelMove={handleLabelMove}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={setSelectedId}
            onSelectMultiple={setSelectedIds}
          />
        </div>

        <div 
          className="resize-handle"
          onMouseDown={(e) => handleDragStart(e, 'property')}
          title={locale === 'zh' ? '拖动调整大小' : 'Drag to resize'}
        />

        <NodePropertiesPanel 
          locale={locale}
          width={propertyWidth}
          selectedNode={diagram?.nodes?.find(n => n.id === selectedId)}
          selectedEdge={diagram?.edges?.find(e => e.id === selectedId)}
          selectedText={diagram?.texts?.find(t => t.id === selectedId)}
          nodes={diagram?.nodes || []}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
          onUpdateText={handleUpdateText}
          onDeleteText={handleDeleteText}
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

      <TikZImportDialog
        isOpen={showTikzDialog}
        onClose={() => setShowTikzDialog(false)}
        onImport={handleTikzImport}
        locale={locale}
      />

      <MermaidImportDialog
        isOpen={showMermaidDialog}
        onClose={() => setShowMermaidDialog(false)}
        onImport={handleMermaidImport}
        locale={locale}
      />
    </div>
  );
}

function NodeShape({ node, selected, onMouseDown, onLabelMouseDown }) {
  const { x, y, width, height, type, label, subtitle, style, labelOffset } = node;
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
  const offsetX = labelOffset?.x || 0;
  const offsetY = labelOffset?.y || 0;
  const fontSize = style?.fontSize || 14;
  const fontWeight = style?.fontWeight || 'bold';
  const fontFamily = style?.fontFamily || 'Arial';
  
  return (
    <g 
      className={`shape node ${selected ? 'selected' : ''}`}
      onMouseDown={onMouseDown}
      transform={`translate(${x}, ${y})`}
    >
      {renderShape()}
      <text
        x={width / 2 + offsetX}
        y={textY - 6 + offsetY}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily={fontFamily}
        fill="#000"
        cursor="move"
        onMouseDown={onLabelMouseDown}
      >
        {label}
      </text>
      {subtitle && (
        <text
          x={width / 2 + offsetX}
          y={textY + 12 + offsetY}
          textAnchor="middle"
          fontSize={Math.max(10, fontSize - 4)}
          fontFamily={fontFamily}
          fill="#666"
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

function VisualCanvas({ diagram, onNodeMove, onEdgeUpdate, onTextMove, onImageMove, onLabelMove, selectedId, selectedIds, onSelect, onSelectMultiple }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [draggingType, setDraggingType] = useState('node');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState(null);
  const [draggingCP, setDraggingCP] = useState(null);
  const [draggingLabel, setDraggingLabel] = useState(null);
  const [labelStartPos, setLabelStartPos] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [, setForceUpdate] = useState(0);

  const canvas = diagram?.canvas || { width: 800, height: 600 };
  const nodes = diagram?.nodes || [];
  const edges = diagram?.edges || [];
  const texts = diagram?.texts || [];
  const images = diagram?.images || [];
  const width = canvas.width || 800;
  const height = canvas.height || 600;

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => {
        const newZoom = Math.max(0.25, Math.min(3, prev + delta));
        return Math.round(newZoom * 100) / 100;
      });
      return false;
    }
  }, []);

  useEffect(() => {
    const handleDocumentWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => {
          const newZoom = Math.max(0.25, Math.min(3, prev + delta));
          return Math.round(newZoom * 100) / 100;
        });
      }
    };
    
    document.addEventListener('wheel', handleDocumentWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleDocumentWheel);
  }, []);

  const handlePanStart = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleCanvasClick = useCallback((e) => {
    // Start selection box when clicking on empty area (not panning)
    if (e.button === 0 && !e.altKey && !isPanning) {
      const target = e.target;
      const svg = svgRef.current;
      
      // Only start selection if clicking on the SVG background or defs
      if (target === svg || target.tagName === 'svg' || target.tagName === 'defs') {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        setIsSelecting(true);
        setSelectionBox({ x1: svgP.x, y1: svgP.y, x2: svgP.x, y2: svgP.y });
        
        // Clear selection if not holding Shift
        if (!e.shiftKey) {
          onSelect(null);
          if (onSelectMultiple) onSelectMultiple([]);
        }
      }
    }
  }, [isPanning, onSelect, onSelectMultiple]);

  const handleSelectionMove = useCallback((e) => {
    if (isSelecting && selectionBox) {
      const svg = svgRef.current;
      if (!svg) return;
      
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      setSelectionBox(prev => ({ ...prev, x2: svgP.x, y2: svgP.y }));
    }
  }, [isSelecting, selectionBox]);

  const handleSelectionEnd = useCallback(() => {
    if (isSelecting && selectionBox && diagram) {
      const box = {
        x: Math.min(selectionBox.x1, selectionBox.x2),
        y: Math.min(selectionBox.y1, selectionBox.y2),
        width: Math.abs(selectionBox.x2 - selectionBox.x1),
        height: Math.abs(selectionBox.y2 - selectionBox.y1)
      };
      
      // Find all nodes within selection box
      const selected = [];
      (diagram.nodes || []).forEach(node => {
        const nodeBox = {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height
        };
        
        if (isBoxIntersecting(box, nodeBox)) {
          selected.push(node.id);
        }
      });
      
      (diagram.texts || []).forEach(text => {
        const textWidth = (text.content || '').length * (text.fontSize || 14) * 0.6;
        const textHeight = text.fontSize || 14;
        const textBox = {
          x: text.x,
          y: text.y - textHeight,
          width: textWidth,
          height: textHeight
        };
        
        if (isBoxIntersecting(box, textBox)) {
          selected.push(text.id);
        }
      });
      
      (diagram.images || []).forEach(image => {
        const imageBox = {
          x: image.x,
          y: image.y,
          width: image.width,
          height: image.height
        };
        
        if (isBoxIntersecting(box, imageBox)) {
          selected.push(image.id);
        }
      });
      
      if (selected.length > 0 && onSelectMultiple) {
        onSelectMultiple(selected);
        onSelect(selected[0]); // Set primary selection
      }
    }
    
    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectionBox, diagram, onSelect, onSelectMultiple]);

  const isBoxIntersecting = (box1, box2) => {
    return !(box1.x + box1.width < box2.x || 
             box2.x + box2.width < box1.x || 
             box1.y + box1.height < box2.y || 
             box2.y + box2.height < box1.y);
  };

  useEffect(() => {
    if (isSelecting) {
      window.addEventListener('mousemove', handleSelectionMove);
      window.addEventListener('mouseup', handleSelectionEnd);
      return () => {
        window.removeEventListener('mousemove', handleSelectionMove);
        window.removeEventListener('mouseup', handleSelectionEnd);
      };
    }
  }, [isSelecting, handleSelectionMove, handleSelectionEnd]);

  const handlePanMove = useCallback((e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handlePanMove);
      window.addEventListener('mouseup', handlePanEnd);
      return () => {
        window.removeEventListener('mousemove', handlePanMove);
        window.removeEventListener('mouseup', handlePanEnd);
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  const handleControlPointMouseDown = (e, edgeId, idx) => {
    e.stopPropagation();
    const edge = edges.find(ed => ed.id === edgeId);
    if (edge && edge.controlPoints && edge.controlPoints[idx]) {
      setDraggingCP({ edgeId, idx });
    }
    onSelect(edgeId);
  };

  const handleLabelMouseDown = (e, itemId, type) => {
    e.stopPropagation();
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    setDraggingLabel({ id: itemId, type });
    setLabelStartPos({ x: svgP.x, y: svgP.y });
    onSelect(itemId);
  };

  const handleTextMouseDown = (e, textId) => {
    e.stopPropagation();
    const text = texts.find(t => t.id === textId);
    if (text) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      setDragging(textId);
      setDraggingType('text');
      setOffset({ x: svgP.x - text.x, y: svgP.y - text.y });
    }
    onSelect(textId);
  };

  const handleImageMouseDown = (e, imageId) => {
    e.stopPropagation();
    const image = images.find(img => img.id === imageId);
    if (image) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      setDragging(imageId);
      setDraggingType('image');
      setOffset({ x: svgP.x - image.x, y: svgP.y - image.y });
    }
    onSelect(imageId);
  };

  const handleCanvasMouseMove = (e) => {
    if (draggingCP || draggingLabel) {
      const svg = svgRef.current;
      if (!svg) return;
      
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      if (draggingCP) {
        const edge = edges.find(ed => ed.id === draggingCP.edgeId);
        if (edge) {
          const newControlPoints = [...(edge.controlPoints || [])];
          newControlPoints[draggingCP.idx] = { x: svgP.x, y: svgP.y };
          onEdgeUpdate({ ...edge, controlPoints: newControlPoints });
          setForceUpdate(n => n + 1);
        }
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingCP(null);
    setDraggingLabel(null);
  };

  useEffect(() => {
    if (!dragging && !draggingLabel) return;
    
    const handleGlobalMouseMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      if (dragging) {
        if (draggingType === 'text') {
          const newX = Math.max(0, svgP.x - offset.x);
          const newY = Math.max(0, svgP.y - offset.y);
          const text = texts.find(t => t.id === dragging);
          if (text) {
            onTextMove({ ...text, x: newX, y: newY });
          }
        } else if (draggingType === 'image') {
          const newX = Math.max(0, svgP.x - offset.x);
          const newY = Math.max(0, svgP.y - offset.y);
          const image = images.find(img => img.id === dragging);
          if (image) {
            onImageMove({ ...image, x: newX, y: newY });
          }
        } else {
          const newX = Math.max(0, svgP.x - offset.x);
          const newY = Math.max(0, svgP.y - offset.y);
          onNodeMove(dragging, newX, newY);
        }
      } else if (draggingLabel && labelStartPos) {
        if (draggingLabel.type === 'node') {
          const node = nodes.find(n => n.id === draggingLabel.id);
          if (node) {
            const deltaX = svgP.x - labelStartPos.x;
            const deltaY = svgP.y - labelStartPos.y;
            onLabelMove(draggingLabel.id, 'node', deltaX, deltaY);
            setLabelStartPos({ x: svgP.x, y: svgP.y });
          }
        } else if (draggingLabel.type === 'edge') {
          const edge = edges.find(e => e.id === draggingLabel.id);
          if (edge) {
            const deltaX = svgP.x - labelStartPos.x;
            const deltaY = svgP.y - labelStartPos.y;
            onLabelMove(draggingLabel.id, 'edge', deltaX, deltaY);
            setLabelStartPos({ x: svgP.x, y: svgP.y });
          }
        }
      }
    };
    
    const handleGlobalMouseUp = () => {
      setDragging(null);
      setDraggingLabel(null);
      setDraggingType('node');
      setLabelStartPos(null);
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragging, draggingLabel, draggingType, offset, labelStartPos, onNodeMove, onTextMove, onLabelMove, texts, nodes, edges]);

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
    setDraggingType('node');
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

  const scaledWidth = width / zoom;
  const scaledHeight = height / zoom;
  const viewBoxX = -pan.x / zoom;
  const viewBoxY = -pan.y / zoom;

  return (
    <div 
      className="canvas-container"
      style={{ position: 'relative' }}
    >
      <svg 
        ref={svgRef}
        viewBox={`${viewBoxX} ${viewBoxY} ${scaledWidth} ${scaledHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={{ 
          background: canvas?.background || '#fff', 
          width: '100%', 
          height: '100%',
          cursor: isSelecting ? 'crosshair' : (isPanning ? 'grabbing' : 'default')
        }}
        onMouseDown={handlePanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
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

        {(() => {
          // 收集所有元素并按zIndex排序
          const allElements = [
            ...edges.map(e => ({ type: 'edge', data: e, zIndex: e.zIndex || 0 })),
            ...nodes.map(n => ({ type: 'node', data: n, zIndex: n.zIndex || 0 })),
            ...texts.map(t => ({ type: 'text', data: t, zIndex: t.zIndex || 0 })),
            ...(images || []).map(img => ({ type: 'image', data: img, zIndex: img.zIndex || 0 }))
          ].sort((a, b) => a.zIndex - b.zIndex);

          return allElements.map((item, index) => {
            if (item.type === 'edge') {
              const edge = item.data;
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
                  key={`edge-${edge.id}`} 
                  className={`edge ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(edge.id);
                  }}
                >
                  <path
                    d={edgeData.path}
                    stroke={edge.strokeColor || '#333'}
                    strokeWidth={isSelected ? (edge.strokeWidth || 1.5) * 1.5 : (edge.strokeWidth || 1.5)}
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
                      x={midX + (edge.labelOffset?.x || 0)} 
                      y={midY - 8 + (edge.labelOffset?.y || 0)}
                      textAnchor="middle"
                      fontSize={edge.labelStyle?.fontSize || 12}
                      fontWeight={edge.labelStyle?.fontWeight || 'normal'}
                      fontFamily={edge.labelStyle?.fontFamily || 'Arial'}
                      fill={edge.labelColor || '#333'}
                      cursor="move"
                      onMouseDown={(e) => handleLabelMouseDown(e, edge.id, 'edge')}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            } else if (item.type === 'node') {
              const isMultiSelected = selectedIds.includes(item.data.id);
              return (
                <NodeShape 
                  key={`node-${item.data.id}`}
                  node={item.data}
                  selected={selectedId === item.data.id || isMultiSelected}
                  onMouseDown={(e) => handleMouseDown(e, item.data.id)}
                  onLabelMouseDown={(e) => handleLabelMouseDown(e, item.data.id, 'node')}
                />
              );
            } else if (item.type === 'text') {
              const text = item.data;
              const isMultiSelected = selectedIds.includes(text.id);
              return (
                <g 
                  key={`text-${text.id}`}
                  className={`text-element ${selectedId === text.id || isMultiSelected ? 'selected' : ''}`}
                  onMouseDown={(e) => handleTextMouseDown(e, text.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(text.id);
                  }}
                  style={{ cursor: 'move' }}
                >
                  {text.backgroundColor && text.backgroundColor !== 'transparent' && (
                    <rect
                      x={text.x - 4}
                      y={text.y - (text.fontSize || 14) - 2}
                      width={text.content.length * (text.fontSize || 14) * 0.6 + 8}
                      height={(text.fontSize || 14) + 8}
                      fill={text.backgroundColor}
                      rx="3"
                      ry="3"
                    />
                  )}
                  <text
                    x={text.x}
                    y={text.y}
                    fontSize={text.fontSize || 14}
                    fontWeight={text.fontWeight || 'normal'}
                    fontFamily={text.fontFamily || 'Arial'}
                    fill={text.color || '#000000'}
                  >
                    {text.content}
                  </text>
                  {selectedId === text.id && (
                    <rect
                      x={text.x - 4}
                      y={text.y - (text.fontSize || 14) - 2}
                      width={text.content.length * (text.fontSize || 14) * 0.6 + 8}
                      height={(text.fontSize || 14) + 8}
                      fill="none"
                      stroke="#007acc"
                      strokeWidth="1"
                      strokeDasharray="4,2"
                    />
                  )}
                </g>
              );
            } else if (item.type === 'image') {
              const image = item.data;
              const isMultiSelected = selectedIds.includes(image.id);
              return (
                <g
                  key={`image-${image.id}`}
                  className={`image-element ${selectedId === image.id || isMultiSelected ? 'selected' : ''}`}
                  onMouseDown={(e) => handleImageMouseDown(e, image.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(image.id);
                  }}
                  style={{ cursor: 'move' }}
                >
                  <foreignObject
                    x={image.x}
                    y={image.y}
                    width={image.width}
                    height={image.height}
                    style={{ overflow: 'visible', opacity: image.opacity || 1 }}
                  >
                    <img
                      src={image.src}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      alt="diagram-image"
                    />
                  </foreignObject>
                  {selectedId === image.id && (
                    <rect
                      x={image.x - 2}
                      y={image.y - 2}
                      width={image.width + 4}
                      height={image.height + 4}
                      fill="none"
                      stroke="#007acc"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                    />
                  )}
                </g>
              );
            }
            return null;
          });
        })()}
        
        {/* Selection box */}
        {selectionBox && (
          <rect
            x={Math.min(selectionBox.x1, selectionBox.x2)}
            y={Math.min(selectionBox.y1, selectionBox.y2)}
            width={Math.abs(selectionBox.x2 - selectionBox.x1)}
            height={Math.abs(selectionBox.y2 - selectionBox.y1)}
            fill="rgba(0, 122, 204, 0.1)"
            stroke="#007acc"
            strokeWidth="1"
            strokeDasharray="4,2"
            pointerEvents="none"
          />
        )}
      </svg>
      
      <div className="zoom-controls">
        <button 
          className="zoom-btn"
          onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
          title="放大 (Ctrl++)"
        >
          +
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button 
          className="zoom-btn"
          onClick={() => setZoom(prev => Math.max(0.25, prev - 0.1))}
          title="缩小 (Ctrl+-)"
        >
          -
        </button>
        <button 
          className="zoom-btn"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          title="重置缩放 (Ctrl+0)"
        >
          1:1
        </button>
      </div>
    </div>
  );
}

export default App;
