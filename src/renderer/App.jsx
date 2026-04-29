import React, { useCallback, useEffect, useRef, useState } from 'react';
import { bringForward, bringToFront, centerDiagram, parseDiagram, sendBackward, sendToBack, serializeDiagram } from './utils/dslParser';
import { getDiagramBounds, getImageBounds, getNodeBounds, getTextBounds } from './utils/diagramGeometry';
import { parseTikZ } from './utils/tikzParser';
import { parseMermaid } from './utils/mermaidParser';
import { parseDrawio } from './utils/drawioParser';
import { t, getLocale, setLocale } from './utils/i18n';
import WelcomeScreen from './components/WelcomeScreen';
import GuideOverlay from './components/GuideOverlay';
import NodeToolbar from './components/NodeToolbar';
import NodePropertiesPanel from './components/NodePropertiesPanel';
import TikZImportDialog from './components/TikZImportDialog';
import MermaidImportDialog from './components/MermaidImportDialog';
import DrawioImportDialog from './components/DrawioImportDialog';

const DEFAULT_DSL = `# SciDraw 图表定义
canvas:
  background: "#ffffff"
  infinite: true

nodes:
  - id: input
    type: box
    x: 80
    y: 80
    width: 140
    height: 64
    label: "输入数据"
    style:
      fill: "#e3f2fd"
      stroke: "#2196f3"
      strokeWidth: 2

  - id: process
    type: rounded
    x: 300
    y: 72
    width: 160
    height: 80
    label: "数据处理"
    subtitle: "算法"
    style:
      fill: "#e8f5e9"
      stroke: "#4caf50"
      strokeWidth: 2

  - id: output
    type: diamond
    x: 560
    y: 68
    width: 120
    height: 120
    label: "输出结果"
    style:
      fill: "#fff3e0"
      stroke: "#ff9800"
      strokeWidth: 2

edges:
  - id: edge_1
    from: input
    to: process
  - id: edge_2
    from: process
    to: output
    label: "结果"
`;

function createDefaultImage(imageData, id) {
  return {
    id,
    x: 100,
    y: 100,
    width: imageData.width || 200,
    height: imageData.height || 150,
    naturalWidth: imageData.naturalWidth || imageData.width || 200,
    naturalHeight: imageData.naturalHeight || imageData.height || 150,
    src: imageData.src,
    opacity: 1,
    groupId: undefined,
    zIndex: 0,
    fit: 'cover',
    crop: { x: 0, y: 0, width: 1, height: 1 }
  };
}

function mergeImagesFromStore(parsed, imageStore, currentDiagram) {
  const parsedImages = parsed.images || [];
  parsed.images = parsedImages.map((image) => ({
    ...image,
    src: imageStore[image.id] || image.src
  }));

  Object.keys(imageStore).forEach((id) => {
    if (!parsed.images.find((image) => image.id === id)) {
      const existing = currentDiagram?.images?.find((image) => image.id === id);
      if (existing) {
        parsed.images.push(existing);
      }
    }
  });

  return parsed;
}

function getImageCss(image) {
  const crop = image.crop || { x: 0, y: 0, width: 1, height: 1 };
  const safeWidth = Math.max(crop.width, 0.05);
  const safeHeight = Math.max(crop.height, 0.05);
  const style = {
    position: 'absolute',
    display: 'block',
    left: `${-(crop.x / safeWidth) * 100}%`,
    top: `${-(crop.y / safeHeight) * 100}%`,
    width: `${100 / safeWidth}%`,
    height: `${100 / safeHeight}%`
  };

  if (image.fit === 'fill') {
    return style;
  }

  style.objectFit = image.fit === 'contain' ? 'contain' : 'cover';
  return style;
}

function getImageResizeHandlePosition(image, handle) {
  const centerX = image.x + image.width / 2;
  const centerY = image.y + image.height / 2;
  switch (handle) {
    case 'nw':
      return { x: image.x, y: image.y };
    case 'ne':
      return { x: image.x + image.width, y: image.y };
    case 'sw':
      return { x: image.x, y: image.y + image.height };
    case 'se':
      return { x: image.x + image.width, y: image.y + image.height };
    case 'n':
      return { x: centerX, y: image.y };
    case 's':
      return { x: centerX, y: image.y + image.height };
    case 'w':
      return { x: image.x, y: centerY };
    case 'e':
    default:
      return { x: image.x + image.width, y: centerY };
  }
}

function getCursorForHandle(handle) {
  const cursors = {
    nw: 'nwse-resize',
    se: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize'
  };
  return cursors[handle] || 'move';
}

function getGroupMemberIds(diagram, groupId) {
  if (!groupId || !diagram) return [];
  return [
    ...(diagram.nodes || []).filter((node) => node.groupId === groupId).map((node) => node.id),
    ...(diagram.texts || []).filter((text) => text.groupId === groupId).map((text) => text.id),
    ...(diagram.images || []).filter((image) => image.groupId === groupId).map((image) => image.id)
  ];
}

function moveGroupedElements(diagram, movedIds, dx, dy) {
  const movedIdSet = new Set(movedIds);
  return {
    ...diagram,
    nodes: (diagram.nodes || []).map((node) => movedIdSet.has(node.id) ? { ...node, x: node.x + dx, y: node.y + dy } : node),
    texts: (diagram.texts || []).map((text) => movedIdSet.has(text.id) ? { ...text, x: text.x + dx, y: text.y + dy } : text),
    images: (diagram.images || []).map((image) => movedIdSet.has(image.id) ? { ...image, x: image.x + dx, y: image.y + dy } : image)
  };
}

function App() {
  const [code, setCode] = useState(DEFAULT_DSL);
  const [diagram, setDiagram] = useState(null);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [syncDirection, setSyncDirection] = useState('code-to-visual');
  const [locale, setLocaleState] = useState(getLocale);
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('scidraw-welcomed') !== 'true');
  const [showGuide, setShowGuide] = useState(false);
  const [showTikzDialog, setShowTikzDialog] = useState(false);
  const [showMermaidDialog, setShowMermaidDialog] = useState(false);
  const [showDrawioDialog, setShowDrawioDialog] = useState(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [monacoError, setMonacoError] = useState(false);
  const [editorWidth, setEditorWidth] = useState(40);
  const [propertyWidth, setPropertyWidth] = useState(260);
  const [isDirty, setIsDirty] = useState(false);
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);
  const isEditorUpdating = useRef(false);
  const syncDirectionRef = useRef(syncDirection);
  const diagramRef = useRef(diagram);
  const imageStoreRef = useRef({});
  const isDirtyRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    syncDirectionRef.current = syncDirection;
  }, [syncDirection]);

  useEffect(() => {
    diagramRef.current = diagram;
  }, [diagram]);

  const syncDiagramToCode = useCallback((newDiagram) => {
    (newDiagram.images || []).forEach((image) => {
      if (image.src) {
        imageStoreRef.current[image.id] = image.src;
      }
    });

    setSyncDirection('visual-to-code');
    setIsDirty(true);
    setDiagram(newDiagram);

    try {
      const newCode = serializeDiagram(newDiagram);
      if (editorRef.current) {
        const currentPosition = editorRef.current.getPosition?.();
        editorRef.current.setValue(newCode);
        if (currentPosition) {
          editorRef.current.setPosition(currentPosition);
        }
      }
      setCode(newCode);
      setError(null);
    } catch (err) {
      setError(err.message);
    }

    setTimeout(() => setSyncDirection('code-to-visual'), 100);
  }, []);

  const parseAndLoadCode = useCallback((input, currentDiagram = diagramRef.current) => {
    const parsed = mergeImagesFromStore(parseDiagram(input), imageStoreRef.current, currentDiagram);
    setDiagram(parsed);
    setCode(input);
    setError(null);
    return parsed;
  }, []);

  useEffect(() => {
    try {
      parseAndLoadCode(DEFAULT_DSL, null);
    } catch (e) {
      setError(e.message);
    }
  }, [parseAndLoadCode]);

  const initEditor = useCallback(() => {
    if (editorRef.current || !editorContainerRef.current || !window.monaco) return;

    editorRef.current = window.monaco.editor.create(editorContainerRef.current, {
      value: code,
      language: 'yaml',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 13,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      scrollBeyondLastLine: false
    });

    editorRef.current.onDidChangeModelContent(() => {
      if (syncDirectionRef.current !== 'code-to-visual') return;
      const nextCode = editorRef.current.getValue();
      setCode(nextCode);
      setIsDirty(true);
      try {
        parseAndLoadCode(nextCode, diagramRef.current);
      } catch (e) {
        setError(e.message);
      }
    });
  }, [code, parseAndLoadCode]);

  useEffect(() => {
    const loadMonaco = async () => {
      if (window.monaco) {
        setMonacoLoaded(true);
        initEditor();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
      script.onload = () => {
        window.require.config({
          paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
        });
        window.require(['vs/editor/editor.main'], () => {
          setMonacoLoaded(true);
          initEditor();
        }, () => setMonacoError(true));
      };
      script.onerror = () => setMonacoError(true);
      document.head.appendChild(script);
    };

    loadMonaco();
  }, [initEditor]);

  useEffect(() => {
    if (editorRef.current && !isEditorUpdating.current && editorRef.current.getValue() !== code) {
      isEditorUpdating.current = true;
      editorRef.current.setValue(code);
      isEditorUpdating.current = false;
    }
  }, [code]);

  const handleLocaleChange = useCallback((newLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const handleDragStart = useCallback((e, type) => {
    e.preventDefault();
    const startX = e.clientX;
    const startEditorWidth = editorWidth;
    const startPropertyWidth = propertyWidth;

    const handleDrag = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = document.querySelector('.main-content')?.offsetWidth || 1200;
      if (type === 'editor') {
        setEditorWidth(Math.max(20, Math.min(60, startEditorWidth + (deltaX / containerWidth) * 100)));
      } else {
        setPropertyWidth(Math.max(220, Math.min(420, startPropertyWidth - deltaX)));
      }
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleEnd);
    };

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleEnd);
  }, [editorWidth, propertyWidth]);

  const handleVisualChange = useCallback((newDiagram) => {
    syncDiagramToCode(newDiagram);
  }, [syncDiagramToCode]);

  const handleAddNode = useCallback((nodeType, style) => {
    if (!diagram) return;
    const id = `node_${Date.now()}`;
    const bounds = getDiagramBounds(diagram, 80);
    const newNode = {
      id,
      type: nodeType,
      x: bounds.x + bounds.width + 40,
      y: bounds.y + 40,
      width: style?.width || 120,
      height: style?.height || 60,
      label: style?.label || (locale === 'zh' ? '新节点' : 'New Node'),
      subtitle: style?.subtitle || '',
      labelOffset: { x: 0, y: 0 },
      groupId: undefined,
      zIndex: 0,
      style: {
        fill: style?.fill || '#ffffff',
        stroke: style?.stroke || '#000000',
        strokeWidth: style?.strokeWidth || 2,
        strokeDasharray: style?.strokeDasharray || 'solid',
        fontSize: style?.fontSize || 14,
        fontWeight: style?.fontWeight || 'bold',
        fontFamily: style?.fontFamily || 'Arial'
      }
    };
    handleVisualChange({ ...diagram, nodes: [...diagram.nodes, newNode] });
    setSelectedId(id);
  }, [diagram, handleVisualChange, locale]);

  const handleAddEdge = useCallback((fromId, toId) => {
    if (!diagram || !fromId || !toId || fromId === toId) return;
    const edge = {
      id: `edge_${Date.now()}`,
      from: fromId,
      to: toId,
      label: '',
      labelOffset: { x: 0, y: 0 },
      labelStyle: { fontSize: 12, fontWeight: 'normal', fontFamily: 'Arial' },
      style: 'solid',
      strokeWidth: 1.5,
      strokeColor: '#333333',
      labelColor: '#333333',
      fromDir: 'auto',
      toDir: 'auto',
      curveType: 'auto',
      controlPoints: [],
      zIndex: 0
    };
    handleVisualChange({ ...diagram, edges: [...diagram.edges, edge] });
  }, [diagram, handleVisualChange]);

  const handleUpdateNode = useCallback((updatedNode) => {
    if (!diagram) return;
    handleVisualChange({
      ...diagram,
      nodes: diagram.nodes.map((node) => node.id === updatedNode.id ? updatedNode : node)
    });
  }, [diagram, handleVisualChange]);

  const handleDeleteNode = useCallback((nodeId) => {
    if (!diagram) return;
    handleVisualChange({
      ...diagram,
      nodes: diagram.nodes.filter((node) => node.id !== nodeId),
      edges: diagram.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId)
    });
    setSelectedId(null);
  }, [diagram, handleVisualChange]);

  const handleUpdateEdge = useCallback((updatedEdge) => {
    if (!diagram) return;
    handleVisualChange({
      ...diagram,
      edges: diagram.edges.map((edge) => edge.id === updatedEdge.id ? updatedEdge : edge)
    });
  }, [diagram, handleVisualChange]);

  const handleDeleteEdge = useCallback((edgeId) => {
    if (!diagram) return;
    handleVisualChange({ ...diagram, edges: diagram.edges.filter((edge) => edge.id !== edgeId) });
    setSelectedId(null);
  }, [diagram, handleVisualChange]);

  const handleAddText = useCallback((content) => {
    if (!diagram) return;
    const text = {
      id: `text_${Date.now()}`,
      x: 120,
      y: 120,
      content,
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'transparent',
      groupId: undefined,
      zIndex: 0
    };
    handleVisualChange({ ...diagram, texts: [...(diagram.texts || []), text] });
    setSelectedId(text.id);
  }, [diagram, handleVisualChange]);

  const handleUpdateText = useCallback((updatedText) => {
    if (!diagram) return;
    handleVisualChange({
      ...diagram,
      texts: (diagram.texts || []).map((text) => text.id === updatedText.id ? updatedText : text)
    });
  }, [diagram, handleVisualChange]);

  const handleDeleteText = useCallback((textId) => {
    if (!diagram) return;
    handleVisualChange({ ...diagram, texts: (diagram.texts || []).filter((text) => text.id !== textId) });
    setSelectedId(null);
  }, [diagram, handleVisualChange]);

  const handleAddImage = useCallback((imageData) => {
    if (!diagram) return;
    const id = `image_${Date.now()}`;
    const newImage = createDefaultImage(imageData, id);
    imageStoreRef.current[id] = imageData.src;
    handleVisualChange({ ...diagram, images: [...(diagram.images || []), newImage] });
    setSelectedId(id);
  }, [diagram, handleVisualChange]);

  const handleUpdateImage = useCallback((updatedImage) => {
    if (!diagram) return;
    if (updatedImage.src) {
      imageStoreRef.current[updatedImage.id] = updatedImage.src;
    }
    handleVisualChange({
      ...diagram,
      images: (diagram.images || []).map((image) => image.id === updatedImage.id ? updatedImage : image)
    });
  }, [diagram, handleVisualChange]);

  const handleDeleteImage = useCallback((imageId) => {
    if (!diagram) return;
    delete imageStoreRef.current[imageId];
    handleVisualChange({ ...diagram, images: (diagram.images || []).filter((image) => image.id !== imageId) });
    setSelectedId(null);
  }, [diagram, handleVisualChange]);

  const handleDeleteSelected = useCallback(() => {
    if (!diagram) return;
    const ids = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (ids.length === 0) return;
    ids.forEach((id) => delete imageStoreRef.current[id]);
    handleVisualChange({
      ...diagram,
      nodes: diagram.nodes.filter((node) => !ids.includes(node.id)),
      edges: diagram.edges.filter((edge) => !ids.includes(edge.id) && !ids.includes(edge.from) && !ids.includes(edge.to)),
      texts: (diagram.texts || []).filter((text) => !ids.includes(text.id)),
      images: (diagram.images || []).filter((image) => !ids.includes(image.id))
    });
    setSelectedId(null);
    setSelectedIds([]);
  }, [diagram, handleVisualChange, selectedId, selectedIds]);

  const handleBindSelected = useCallback(() => {
    if (!diagram) return;
    const ids = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (ids.length < 2) return;
    const groupId = `group_${Date.now()}`;
    handleVisualChange({
      ...diagram,
      nodes: diagram.nodes.map((node) => ids.includes(node.id) ? { ...node, groupId } : node),
      texts: (diagram.texts || []).map((text) => ids.includes(text.id) ? { ...text, groupId } : text),
      images: (diagram.images || []).map((image) => ids.includes(image.id) ? { ...image, groupId } : image)
    });
  }, [diagram, handleVisualChange, selectedId, selectedIds]);

  const handleUnbindSelected = useCallback(() => {
    if (!diagram || !selectedId) return;
    const currentGroupId = diagram.nodes.find((node) => node.id === selectedId)?.groupId
      || diagram.texts.find((text) => text.id === selectedId)?.groupId
      || diagram.images.find((image) => image.id === selectedId)?.groupId;
    if (!currentGroupId) return;
    handleVisualChange({
      ...diagram,
      nodes: diagram.nodes.map((node) => node.groupId === currentGroupId ? { ...node, groupId: undefined } : node),
      texts: (diagram.texts || []).map((text) => text.groupId === currentGroupId ? { ...text, groupId: undefined } : text),
      images: (diagram.images || []).map((image) => image.groupId === currentGroupId ? { ...image, groupId: undefined } : image)
    });
  }, [diagram, handleVisualChange, selectedId]);

  const handleLayerAction = useCallback((action) => {
    if (!diagram || !selectedId) return;
    let elementType = 'node';
    if (diagram.edges.find((edge) => edge.id === selectedId)) elementType = 'edge';
    if (diagram.texts.find((text) => text.id === selectedId)) elementType = 'text';
    if (diagram.images.find((image) => image.id === selectedId)) elementType = 'image';

    const mapper = {
      bringToFront,
      sendToBack,
      bringForward,
      sendBackward
    };
    const fn = mapper[action];
    if (!fn) return;
    handleVisualChange(fn(diagram, selectedId, elementType));
  }, [diagram, handleVisualChange, selectedId]);

  const handleLabelMove = useCallback((itemId, type, dx, dy) => {
    if (!diagram) return;
    if (type === 'node') {
      handleVisualChange({
        ...diagram,
        nodes: diagram.nodes.map((node) => node.id === itemId ? {
          ...node,
          labelOffset: { x: (node.labelOffset?.x || 0) + dx, y: (node.labelOffset?.y || 0) + dy }
        } : node)
      });
      return;
    }

    handleVisualChange({
      ...diagram,
      edges: diagram.edges.map((edge) => edge.id === itemId ? {
        ...edge,
        labelOffset: { x: (edge.labelOffset?.x || 0) + dx, y: (edge.labelOffset?.y || 0) + dy }
      } : edge)
    });
  }, [diagram, handleVisualChange]);

  const handleElementTranslate = useCallback((elementType, elementId, x, y) => {
    if (!diagram) return;

    if (elementType === 'node') {
      const node = diagram.nodes.find((item) => item.id === elementId);
      if (!node) return;
      const dx = x - node.x;
      const dy = y - node.y;
      const movedIds = node.groupId ? getGroupMemberIds(diagram, node.groupId) : [elementId];
      handleVisualChange(moveGroupedElements(diagram, movedIds, dx, dy));
      return;
    }

    if (elementType === 'text') {
      const text = (diagram.texts || []).find((item) => item.id === elementId);
      if (!text) return;
      const dx = x - text.x;
      const dy = y - text.y;
      const movedIds = text.groupId ? getGroupMemberIds(diagram, text.groupId) : [elementId];
      handleVisualChange(moveGroupedElements(diagram, movedIds, dx, dy));
      return;
    }

    if (elementType === 'image') {
      const image = (diagram.images || []).find((item) => item.id === elementId);
      if (!image) return;
      const dx = x - image.x;
      const dy = y - image.y;
      const movedIds = image.groupId ? getGroupMemberIds(diagram, image.groupId) : [elementId];
      handleVisualChange(moveGroupedElements(diagram, movedIds, dx, dy));
    }
  }, [diagram, handleVisualChange]);

  const handleSave = async () => {
    if (savingRef.current || !window.electronAPI) return;
    savingRef.current = true;
    try {
      const result = await window.electronAPI.saveFile({
        content: code,
        defaultName: 'diagram.yaml',
        filters: [{ name: 'YAML Files', extensions: ['yaml', 'yml'] }]
      });
      if (result.success) setIsDirty(false);
      window.electronAPI.send('save-done', result.success);
    } finally {
      savingRef.current = false;
    }
  };

  const handleOpen = async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.openFile();
    if (!result.success) return;

    setIsDirty(false);

    try {
      const input = result.content;
      if (/^\s*</.test(input) || /\.drawio$|\.xml$/i.test(result.filePath || '')) {
        const imported = parseDrawio(input);
        syncDiagramToCode(imported);
      } else {
        parseAndLoadCode(input);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleNewFile = () => {
    setIsDirty(false);
    const emptyDSL = `canvas:\n  background: "#ffffff"\n  infinite: true\n\nnodes: []\n\nedges: []\n`;
    parseAndLoadCode(emptyDSL);
  };

  const handleTikzImport = (input) => {
    try {
      syncDiagramToCode(centerDiagram(parseTikZ(input), 1200, 800));
    } catch (e) {
      setError(`TikZ parse error: ${e.message}`);
    }
  };

  const handleMermaidImport = (input) => {
    try {
      syncDiagramToCode(centerDiagram(parseMermaid(input), 1200, 800));
    } catch (e) {
      setError(`Mermaid parse error: ${e.message}`);
    }
  };

  const handleDrawioImport = (input) => {
    try {
      syncDiagramToCode(parseDrawio(input));
    } catch (e) {
      setError(`draw.io parse error: ${e.message}`);
    }
  };

  const handleExportPDF = async () => {
    if (!diagram) return;
    const svgElement = document.querySelector('.canvas-container svg');
    if (!svgElement) return;

    const exportPadding = diagram.canvas?.exportPadding || 32;
    const bounds = getDiagramBounds(diagram, exportPadding);
    const svgClone = svgElement.cloneNode(true);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
    svgClone.setAttribute('width', bounds.width);
    svgClone.setAttribute('height', bounds.height);

    svgClone.querySelectorAll('.image-resize-handle, .image-selection-outline, .image-crop-overlay, .selection-overlay').forEach((element) => element.remove());

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Diagram</title><style>body{margin:0;padding:0;background:#fff;display:flex;align-items:flex-start;justify-content:flex-start;}svg{width:${bounds.width}px;height:${bounds.height}px;display:block;}</style></head><body>${svgClone.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return undefined;

    const handleMenuNew = () => handleNewFile();
    const handleMenuOpen = () => { void handleOpen(); };
    const handleMenuSave = () => { void handleSave(); };
    const handleMenuSaveAs = () => { void handleSave(); };
    const handleMenuImportTikz = () => setShowTikzDialog(true);
    const handleMenuImportDrawio = () => setShowDrawioDialog(true);
    const handleMenuExportPdf = () => { void handleExportPDF(); };

    api.onMenuNew?.(handleMenuNew);
    api.onMenuOpen?.(handleMenuOpen);
    api.onMenuSave?.(handleMenuSave);
    api.onMenuSaveAs?.(handleMenuSaveAs);
    api.onMenuImportTikZ?.(handleMenuImportTikz);
    api.onMenuImportDrawio?.(handleMenuImportDrawio);
    api.onMenuExportPDF?.(handleMenuExportPdf);

    return () => {
      api.removeMenuNew?.(handleMenuNew);
      api.removeMenuOpen?.(handleMenuOpen);
      api.removeMenuSave?.(handleMenuSave);
      api.removeMenuSaveAs?.(handleMenuSaveAs);
      api.removeMenuImportTikZ?.(handleMenuImportTikz);
      api.removeMenuImportDrawio?.(handleMenuImportDrawio);
      api.removeMenuExportPDF?.(handleMenuExportPdf);
    };
  }, [handleExportPDF, handleOpen, handleSave, handleNewFile]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const handleBeforeUnload = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleQueryDirty = () => {
      api.send('dirty-state-response', isDirtyRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    api.onQueryDirtyState(handleQueryDirty);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      api.removeQueryDirtyState(handleQueryDirty);
    };
  }, []);

  const selectedNode = diagram?.nodes?.find((node) => node.id === selectedId) || null;
  const selectedEdge = diagram?.edges?.find((edge) => edge.id === selectedId) || null;
  const selectedText = diagram?.texts?.find((text) => text.id === selectedId) || null;
  const selectedImage = diagram?.images?.find((image) => image.id === selectedId) || null;

  if (showWelcome) {
    return <WelcomeScreen locale={locale} onLocaleChange={handleLocaleChange} onClose={() => { setShowWelcome(false); localStorage.setItem('scidraw-welcomed', 'true'); setShowGuide(true); }} onTryExample={() => { setShowWelcome(false); localStorage.setItem('scidraw-welcomed', 'true'); }} />;
  }

  return (
    <div className="app">
      <div className="toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="toolbar-title">{t('appTitle', locale)}</span>
          <select value={locale} onChange={(e) => handleLocaleChange(e.target.value)} style={{ background: '#3e3e3e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', fontSize: '12px' }}>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={handleNewFile}>{t('toolbar.newFile', locale)}</button>
          <button className="toolbar-btn secondary" onClick={handleOpen}>{t('toolbar.open', locale)}</button>
          <button className="toolbar-btn secondary" onClick={handleSave}>{t('toolbar.save', locale)}</button>
          <button className="toolbar-btn secondary" onClick={() => setShowTikzDialog(true)}>{t('toolbar.importTikZ', locale)}</button>
          <button className="toolbar-btn secondary" onClick={() => setShowMermaidDialog(true)}>{t('toolbar.importMermaid', locale)}</button>
          <button className="toolbar-btn secondary" onClick={() => setShowDrawioDialog(true)}>{t('toolbar.importDrawio', locale)}</button>
          <button className="toolbar-btn" onClick={handleExportPDF}>{t('toolbar.exportPDF', locale)}</button>
        </div>
      </div>

      <div className="main-content">
        <NodeToolbar locale={locale} nodes={diagram?.nodes || []} selectedId={selectedId} selectedIds={selectedIds} selectedGroupId={selectedNode?.groupId || selectedText?.groupId || selectedImage?.groupId || null} onAddNode={handleAddNode} onAddEdge={handleAddEdge} onDeleteNode={handleDeleteNode} onDeleteSelected={handleDeleteSelected} onAddText={handleAddText} onAddImage={handleAddImage} onLayerAction={handleLayerAction} onBindSelected={handleBindSelected} onUnbindSelected={handleUnbindSelected} />

        <div className="panel" style={{ width: `${editorWidth}%` }}>
          <div className="panel-header"><span className="panel-title">{t('panels.codeEditor', locale)}</span></div>
          <div className="editor-container" ref={editorContainerRef}>
            {!monacoLoaded || monacoError ? <textarea value={code} onChange={(e) => { setCode(e.target.value); try { parseAndLoadCode(e.target.value); } catch (err) { setError(err.message); } }} spellCheck={false} /> : null}
          </div>
        </div>

        <div className="resize-handle" onMouseDown={(e) => handleDragStart(e, 'editor')} title={locale === 'zh' ? '拖动调整大小' : 'Drag to resize'} />

        <div className="panel canvas-panel" style={{ flex: 1 }}>
          <div className="panel-header">
            <span className="panel-title">{t('panels.visualCanvas', locale)}</span>
            <button className="toolbar-btn secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setShowGuide(true)}>{locale === 'zh' ? '新手引导' : 'Guide'}</button>
          </div>
          <VisualCanvas diagram={diagram} selectedId={selectedId} selectedIds={selectedIds} onSelect={setSelectedId} onSelectMultiple={setSelectedIds} onElementTranslate={handleElementTranslate} onEdgeUpdate={handleUpdateEdge} onTextMove={handleUpdateText} onImageMove={handleUpdateImage} onLabelMove={handleLabelMove} />
        </div>

        <div className="resize-handle" onMouseDown={(e) => handleDragStart(e, 'property')} title={locale === 'zh' ? '拖动调整大小' : 'Drag to resize'} />

        <NodePropertiesPanel locale={locale} width={propertyWidth} selectedNode={selectedNode} selectedEdge={selectedEdge} selectedText={selectedText} selectedImage={selectedImage} nodes={diagram?.nodes || []} onUpdateNode={handleUpdateNode} onDeleteNode={handleDeleteNode} onUpdateEdge={handleUpdateEdge} onDeleteEdge={handleDeleteEdge} onUpdateText={handleUpdateText} onDeleteText={handleDeleteText} onUpdateImage={handleUpdateImage} onDeleteImage={handleDeleteImage} />
      </div>

      {error ? <div className="error-panel">{t('errors.parseError', locale)}: {error}</div> : null}

      <div className="status-bar">
        <div className="status-left">
          <span>{diagram?.nodes?.length || 0} {t('statusBar.nodes', locale)}</span>
          <span>{diagram?.edges?.length || 0} {t('statusBar.edges', locale)}</span>
          <span>{diagram?.images?.length || 0} {locale === 'zh' ? '张图片' : 'images'}</span>
        </div>
        <div className="status-right"><span>{syncDirection === 'code-to-visual' ? t('statusBar.codeToVisual', locale) : t('statusBar.visualToCode', locale)}</span></div>
      </div>

      {showGuide ? <GuideOverlay locale={locale} onClose={() => setShowGuide(false)} /> : null}
      <TikZImportDialog isOpen={showTikzDialog} onClose={() => setShowTikzDialog(false)} onImport={handleTikzImport} locale={locale} />
      <MermaidImportDialog isOpen={showMermaidDialog} onClose={() => setShowMermaidDialog(false)} onImport={handleMermaidImport} locale={locale} />
      <DrawioImportDialog isOpen={showDrawioDialog} onClose={() => setShowDrawioDialog(false)} onImport={handleDrawioImport} locale={locale} />
    </div>
  );
}

function NodeShape({ node, selected, onMouseDown, onLabelMouseDown }) {
  const { x, y, width, height, type, label, subtitle, style, labelOffset } = node;
  const fill = style?.fill || '#fff';
  const stroke = style?.stroke || '#000';
  const strokeWidth = style?.strokeWidth || 1;
  const strokeDasharray = style?.strokeDasharray === 'dashed' ? '8,4' : style?.strokeDasharray === 'dotted' ? '2,2' : 'none';

  const renderShape = () => {
    switch (type) {
      case 'circle':
        return <g transform={`translate(${width / 2}, ${height / 2})`}><circle r={Math.min(width, height) / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} /></g>;
      case 'ellipse':
        return <ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'diamond':
        return <polygon points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'triangle':
        return <polygon points={`${width / 2},0 ${width},${height} 0,${height}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'rounded':
        return <rect width={width} height={height} rx={Math.min(height / 4, 12)} ry={Math.min(height / 4, 12)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'process':
        return <polygon points={`${height / 2},0 ${width - height / 2},0 ${width},${height / 2} ${width - height / 2},${height} ${height / 2},${height} 0,${height / 2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'data':
        return <polygon points={`18,0 ${width},0 ${width - 18},${height} 0,${height}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'document':
        return <path d={`M0 0 H${width} V${height - 16} Q${width * 0.75} ${height + 6} ${width * 0.5} ${height - 8} Q${width * 0.25} ${height - 22} 0 ${height - 8} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'database':
        return <g><ellipse cx={width / 2} cy={12} rx={width / 2} ry={12} fill={fill} stroke={stroke} strokeWidth={strokeWidth} /><path d={`M0 12 V${height - 12} C0 ${height + 4} ${width} ${height + 4} ${width} ${height - 12} V12`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} /><ellipse cx={width / 2} cy={height - 12} rx={width / 2} ry={12} fill={fill} stroke={stroke} strokeWidth={strokeWidth} /></g>;
      case 'terminator':
        return <rect width={width} height={height} rx={height / 2} ry={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'preparation':
        return <polygon points={`18,0 ${width - 18},0 ${width},${height / 2} ${width - 18},${height} 18,${height} 0,${height / 2}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'swimlane':
        return <g><rect width={width} height={height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} /><line x1="0" y1="28" x2={width} y2="28" stroke={stroke} strokeWidth={strokeWidth} /></g>;
      case 'note':
        return <path d={`M0 0 H${width - 16} L${width} 16 V${height} H0 Z M${width - 16} 0 V16 H${width}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      case 'package':
        return <g><path d={`M0 16 H48 L58 0 H${width} V${height} H0 Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} /></g>;
      case 'box':
      default:
        return <rect width={width} height={height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
    }
  };

  const offsetX = labelOffset?.x || 0;
  const offsetY = labelOffset?.y || 0;

  return (
    <g className={`shape node ${selected ? 'selected' : ''}`} onMouseDown={onMouseDown} transform={`translate(${x}, ${y})`}>
      {renderShape()}
      <text x={width / 2 + offsetX} y={height / 2 - 6 + offsetY} textAnchor="middle" fontSize={style?.fontSize || 14} fontWeight={style?.fontWeight || 'bold'} fontFamily={style?.fontFamily || 'Arial'} fill="#000" cursor="move" onMouseDown={onLabelMouseDown}>{label}</text>
      {subtitle ? <text x={width / 2 + offsetX} y={height / 2 + 12 + offsetY} textAnchor="middle" fontSize={Math.max(10, (style?.fontSize || 14) - 4)} fontFamily={style?.fontFamily || 'Arial'} fill="#666">{subtitle}</text> : null}
    </g>
  );
}

function VisualCanvas({ diagram, onElementTranslate, onEdgeUpdate, onTextMove, onImageMove, onLabelMove, selectedId, selectedIds, onSelect, onSelectMultiple }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [draggingType, setDraggingType] = useState('node');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [draggingLabel, setDraggingLabel] = useState(null);
  const [labelStartPos, setLabelStartPos] = useState(null);
  const [draggingCP, setDraggingCP] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const nodes = diagram?.nodes || [];
  const edges = diagram?.edges || [];
  const texts = diagram?.texts || [];
  const images = diagram?.images || [];
  const viewportBounds = getDiagramBounds(diagram, 320);
  const viewBoxX = viewportBounds.x - pan.x / zoom;
  const viewBoxY = viewportBounds.y - pan.y / zoom;
  const viewBoxWidth = viewportBounds.width / zoom;
  const viewBoxHeight = viewportBounds.height / zoom;

  const screenToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }, []);

  const getNodeAnchor = useCallback((node, direction) => {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    switch (direction) {
      case 'left': return { x: node.x, y: cy };
      case 'right': return { x: node.x + node.width, y: cy };
      case 'top': return { x: cx, y: node.y };
      case 'bottom': return { x: cx, y: node.y + node.height };
      default: return { x: node.x + node.width, y: cy };
    }
  }, []);

  const getBestAnchor = useCallback((fromNode, toNode, fromDir, toDir) => {
    if (fromDir !== 'auto' && toDir !== 'auto') {
      return { start: getNodeAnchor(fromNode, fromDir), end: getNodeAnchor(toNode, toDir) };
    }
    const dx = (toNode.x + toNode.width / 2) - (fromNode.x + fromNode.width / 2);
    const dy = (toNode.y + toNode.height / 2) - (fromNode.y + fromNode.height / 2);
    if (Math.abs(dx) > Math.abs(dy)) {
      return {
        start: getNodeAnchor(fromNode, dx > 0 ? 'right' : 'left'),
        end: getNodeAnchor(toNode, dx > 0 ? 'left' : 'right')
      };
    }
    return {
      start: getNodeAnchor(fromNode, dy > 0 ? 'bottom' : 'top'),
      end: getNodeAnchor(toNode, dy > 0 ? 'top' : 'bottom')
    };
  }, [getNodeAnchor]);

  const getEdgePath = useCallback((edge) => {
    const fromNode = nodes.find((node) => node.id === edge.from);
    const toNode = nodes.find((node) => node.id === edge.to);
    if (!fromNode || !toNode) return { path: '', start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
    const { start, end } = getBestAnchor(fromNode, toNode, edge.fromDir || 'auto', edge.toDir || 'auto');
    const controlPoints = edge.controlPoints || [];
    if (edge.curveType === 'manual' && controlPoints.length > 0) {
      return { path: `M ${start.x} ${start.y} ${controlPoints.map((point) => `L ${point.x} ${point.y}`).join(' ')} L ${end.x} ${end.y}`, start, end };
    }
    if (edge.curveType === 'bezier' && controlPoints.length > 0) {
      return { path: `M ${start.x} ${start.y} Q ${controlPoints[0].x} ${controlPoints[0].y} ${end.x} ${end.y}`, start, end };
    }
    if (edge.curveType === 'bezier2' && controlPoints.length > 1) {
      return { path: `M ${start.x} ${start.y} C ${controlPoints[0].x} ${controlPoints[0].y} ${controlPoints[1].x} ${controlPoints[1].y} ${end.x} ${end.y}`, start, end };
    }
    if (edge.curveType === 'straight') {
      return { path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`, start, end };
    }
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const cp1x = Math.abs(dx) > Math.abs(dy) ? start.x + dx * 0.5 : start.x;
    const cp1y = Math.abs(dx) > Math.abs(dy) ? start.y : start.y + dy * 0.5;
    const cp2x = Math.abs(dx) > Math.abs(dy) ? end.x - dx * 0.5 : end.x;
    const cp2y = Math.abs(dx) > Math.abs(dy) ? end.y : end.y - dy * 0.5;
    return { path: `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`, start, end };
  }, [getBestAnchor, nodes]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((value) => Math.max(0.25, Math.min(3, Number((value + (e.deltaY > 0 ? -0.1 : 0.1)).toFixed(2)))));
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
      if (isSelecting && selectionBox) {
        const point = screenToSvg(e.clientX, e.clientY);
        setSelectionBox((prev) => ({ ...prev, x2: point.x, y2: point.y }));
      }
      if (draggingCP) {
        const point = screenToSvg(e.clientX, e.clientY);
        const edge = edges.find((item) => item.id === draggingCP.edgeId);
        if (edge) {
          const controlPoints = [...(edge.controlPoints || [])];
          controlPoints[draggingCP.index] = point;
          onEdgeUpdate({ ...edge, controlPoints });
        }
      }
      if (draggingLabel && labelStartPos) {
        const point = screenToSvg(e.clientX, e.clientY);
        onLabelMove(draggingLabel.id, draggingLabel.kind, point.x - labelStartPos.x, point.y - labelStartPos.y);
        setLabelStartPos(point);
      }
      if (dragging) {
        const point = screenToSvg(e.clientX, e.clientY);
        if (draggingType === 'node') {
          onElementTranslate('node', dragging.id, point.x - offset.x, point.y - offset.y);
        } else if (draggingType === 'text') {
          onElementTranslate('text', dragging.id, point.x - offset.x, point.y - offset.y);
        } else if (draggingType === 'image') {
          onElementTranslate('image', dragging.id, point.x - offset.x, point.y - offset.y);
        } else if (draggingType === 'image-resize') {
          const image = dragging.item;
          const minSize = 32;
          let x = image.x;
          let y = image.y;
          let width = image.width;
          let height = image.height;
          if (dragging.handle.includes('e')) width = Math.max(minSize, point.x - image.x);
          if (dragging.handle.includes('s')) height = Math.max(minSize, point.y - image.y);
          if (dragging.handle.includes('w')) {
            width = Math.max(minSize, image.x + image.width - point.x);
            x = image.x + image.width - width;
          }
          if (dragging.handle.includes('n')) {
            height = Math.max(minSize, image.y + image.height - point.y);
            y = image.y + image.height - height;
          }
          onImageMove({ ...image, x, y, width, height });
        }
      }
    };

    const handleUp = () => {
      if (isSelecting && selectionBox) {
        const box = {
          x: Math.min(selectionBox.x1, selectionBox.x2),
          y: Math.min(selectionBox.y1, selectionBox.y2),
          width: Math.abs(selectionBox.x2 - selectionBox.x1),
          height: Math.abs(selectionBox.y2 - selectionBox.y1)
        };
        const isIntersecting = (a, b) => !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
        const selected = [
          ...nodes.filter((node) => isIntersecting(box, getNodeBounds(node))).map((node) => node.id),
          ...texts.filter((text) => isIntersecting(box, getTextBounds(text))).map((text) => text.id),
          ...images.filter((image) => isIntersecting(box, getImageBounds(image))).map((image) => image.id)
        ];
        onSelectMultiple(selected);
        if (selected[0]) onSelect(selected[0]);
      }
      setDragging(null);
      setDraggingType('node');
      setDraggingLabel(null);
      setDraggingCP(null);
      setIsPanning(false);
      setIsSelecting(false);
      setSelectionBox(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, draggingCP, draggingLabel, draggingType, edges, images, isPanning, isSelecting, labelStartPos, nodes, offset, onEdgeUpdate, onElementTranslate, onImageMove, onLabelMove, onSelect, onSelectMultiple, onTextMove, panStart, screenToSvg, selectionBox, texts]);

  if (!diagram) {
    return <div className="canvas-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#666' }}>Loading...</span></div>;
  }

  const allElements = [
    ...edges.map((edge) => ({ type: 'edge', data: edge, zIndex: edge.zIndex || 0 })),
    ...nodes.map((node) => ({ type: 'node', data: node, zIndex: node.zIndex || 0 })),
    ...texts.map((text) => ({ type: 'text', data: text, zIndex: text.zIndex || 0 })),
    ...images.map((image) => ({ type: 'image', data: image, zIndex: image.zIndex || 0 }))
  ].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="canvas-container" style={{ position: 'relative', background: '#e9eef5' }}>
      <svg ref={svgRef} viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ width: '100%', height: '100%', background: diagram.canvas?.background || '#fff', cursor: isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'default' }} onMouseDown={(e) => { if (e.button === 1 || (e.button === 0 && e.altKey)) { e.preventDefault(); setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return; } if (e.button !== 0 && e.button !== 2) return; e.preventDefault(); const target = e.target; const tag = target.tagName; if (target === svgRef.current || tag === 'svg' || tag === 'defs' || tag === 'rect' || tag === 'pattern') { const point = screenToSvg(e.clientX, e.clientY); setSelectionBox({ x1: point.x, y1: point.y, x2: point.x, y2: point.y }); setIsSelecting(true); if (!e.shiftKey) { onSelect(null); onSelectMultiple([]); } } }} onContextMenu={(e) => e.preventDefault()}>
        <defs>
          <pattern id="grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#d6dde8" strokeWidth="1" />
          </pattern>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
          {images.map((image) => {
            const crop = image.crop || { x: 0, y: 0, width: 1, height: 1 };
            return <clipPath key={`clip-${image.id}`} id={`clip-${image.id}`}><rect x={image.x} y={image.y} width={image.width} height={image.height} /></clipPath>;
          })}
        </defs>
        <rect x={viewBoxX} y={viewBoxY} width={viewBoxWidth} height={viewBoxHeight} fill="url(#grid-pattern)" />

        {allElements.map((item) => {
          if (item.type === 'edge') {
            const edge = item.data;
            const edgeData = getEdgePath(edge);
            const fromNode = nodes.find((node) => node.id === edge.from);
            const toNode = nodes.find((node) => node.id === edge.to);
            const midX = fromNode && toNode ? (fromNode.x + fromNode.width / 2 + toNode.x + toNode.width / 2) / 2 : 0;
            const midY = fromNode && toNode ? (fromNode.y + fromNode.height / 2 + toNode.y + toNode.height / 2) / 2 : 0;
            const dash = edge.style === 'dashed' ? '8,4' : edge.style === 'dotted' ? '2,2' : 'none';
            return <g key={edge.id} className={selectedId === edge.id ? 'selected' : ''} onClick={(e) => { e.stopPropagation(); onSelect(edge.id); }}><path d={edgeData.path} stroke={edge.strokeColor || '#333'} strokeWidth={selectedId === edge.id ? (edge.strokeWidth || 1.5) * 1.5 : (edge.strokeWidth || 1.5)} strokeDasharray={dash} fill="none" markerEnd="url(#arrowhead)" />{(edge.controlPoints || []).map((point, index) => <circle key={`${edge.id}-${index}`} cx={point.x} cy={point.y} r="7" fill="#fff" stroke="#007acc" strokeWidth="2" style={{ cursor: 'move' }} onMouseDown={(e) => { e.stopPropagation(); setDraggingCP({ edgeId: edge.id, index }); onSelect(edge.id); }} />)}{edge.label ? <text x={midX + (edge.labelOffset?.x || 0)} y={midY - 8 + (edge.labelOffset?.y || 0)} textAnchor="middle" fontSize={edge.labelStyle?.fontSize || 12} fontWeight={edge.labelStyle?.fontWeight || 'normal'} fontFamily={edge.labelStyle?.fontFamily || 'Arial'} fill={edge.labelColor || '#333'} cursor="move" onMouseDown={(e) => { e.stopPropagation(); setDraggingLabel({ id: edge.id, kind: 'edge' }); setLabelStartPos(screenToSvg(e.clientX, e.clientY)); onSelect(edge.id); }}>{edge.label}</text> : null}</g>;
          }
          if (item.type === 'node') {
            return <NodeShape key={item.data.id} node={item.data} selected={selectedId === item.data.id || selectedIds.includes(item.data.id)} onMouseDown={(e) => { e.stopPropagation(); const point = screenToSvg(e.clientX, e.clientY); setDragging({ id: item.data.id, item: item.data }); setDraggingType('node'); setOffset({ x: point.x - item.data.x, y: point.y - item.data.y }); onSelect(item.data.id); }} onLabelMouseDown={(e) => { e.stopPropagation(); setDraggingLabel({ id: item.data.id, kind: 'node' }); setLabelStartPos(screenToSvg(e.clientX, e.clientY)); onSelect(item.data.id); }} />;
          }
          if (item.type === 'text') {
            const text = item.data;
            const bounds = getTextBounds(text);
            return <g key={text.id} onMouseDown={(e) => { e.stopPropagation(); const point = screenToSvg(e.clientX, e.clientY); setDragging({ id: text.id, item: text }); setDraggingType('text'); setOffset({ x: point.x - text.x, y: point.y - text.y }); onSelect(text.id); }}><text x={text.x} y={text.y} fontSize={text.fontSize || 14} fontWeight={text.fontWeight || 'normal'} fontFamily={text.fontFamily || 'Arial'} fill={text.color || '#000'}>{text.content}</text>{selectedId === text.id ? <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="none" stroke="#007acc" strokeWidth="1" strokeDasharray="4,2" /> : null}</g>;
          }
          const image = item.data;
          const selected = selectedId === image.id || selectedIds.includes(image.id);
          const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
          return <g key={image.id} onMouseDown={(e) => { e.stopPropagation(); const point = screenToSvg(e.clientX, e.clientY); setDragging({ id: image.id, item: image }); setDraggingType('image'); setOffset({ x: point.x - image.x, y: point.y - image.y }); onSelect(image.id); }}><foreignObject x={image.x} y={image.y} width={image.width} height={image.height} clipPath={`url(#clip-${image.id})`} style={{ opacity: image.opacity || 1, pointerEvents: 'none' }}><div xmlns="http://www.w3.org/1999/xhtml" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}><img src={image.src} alt="diagram-image" style={{ ...getImageCss(image), pointerEvents: 'none', userSelect: 'none' }} draggable="false" /></div></foreignObject><rect x={image.x} y={image.y} width={image.width} height={image.height} fill="transparent" stroke="none" pointerEvents="all" />{selected ? <rect className="image-selection-outline" x={image.x} y={image.y} width={image.width} height={image.height} fill="none" stroke="#007acc" strokeWidth="2" strokeDasharray="6,3" pointerEvents="none" /> : null}{selected ? handles.map((handle) => { const pos = getImageResizeHandlePosition(image, handle); return <rect key={`${image.id}-${handle}`} className="image-resize-handle" x={pos.x - 4} y={pos.y - 4} width="8" height="8" fill="#fff" stroke="#007acc" strokeWidth="2" style={{ cursor: getCursorForHandle(handle) }} onMouseDown={(e) => { e.stopPropagation(); setDragging({ id: image.id, item: image, handle }); setDraggingType('image-resize'); onSelect(image.id); }} />; }) : null}</g>;
        })}

        {selectionBox ? <rect className="selection-overlay" x={Math.min(selectionBox.x1, selectionBox.x2)} y={Math.min(selectionBox.y1, selectionBox.y2)} width={Math.abs(selectionBox.x2 - selectionBox.x1)} height={Math.abs(selectionBox.y2 - selectionBox.y1)} fill="rgba(0,122,204,0.1)" stroke="#007acc" strokeWidth="1" strokeDasharray="4,2" /> : null}
      </svg>

      <div className="zoom-controls">
        <button className="zoom-btn" onClick={() => setZoom((value) => Math.min(3, value + 0.1))}>+</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="zoom-btn" onClick={() => setZoom((value) => Math.max(0.25, value - 0.1))}>-</button>
        <button className="zoom-btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>1:1</button>
      </div>
    </div>
  );
}

export default App;
