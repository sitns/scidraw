import React, { useEffect, useState } from 'react';

function PanelShell({ width, title, children }) {
  return (
    <div className="properties-panel" style={{ width: `${width || 260}px` }}>
      <div className="properties-header"><span>{title}</span></div>
      <div className="properties-content">{children}</div>
      <style>{`
        .properties-panel {
          background: #252526;
          border-left: 1px solid #3e3e3e;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .properties-header {
          padding: 10px 12px;
          background: #2d2d2d;
          border-bottom: 1px solid #3e3e3e;
          font-size: 12px;
          font-weight: 600;
          color: #969696;
        }
        .properties-content {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }
        .prop-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .prop-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .prop-label {
          font-size: 11px;
          color: #969696;
          text-transform: uppercase;
        }
        .prop-input {
          width: 100%;
          box-sizing: border-box;
          padding: 6px 8px;
          background: #3e3e3e;
          border: 1px solid #555;
          color: #d4d4d4;
          border-radius: 3px;
          font-size: 12px;
        }
        .prop-input:focus {
          outline: none;
          border-color: #007acc;
        }
        .prop-input.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .color-input-wrapper {
          display: flex;
          gap: 6px;
          align-items: center;
          width: 100%;
          min-width: 0;
          flex-wrap: wrap;
        }
        .color-input {
          width: 32px;
          min-width: 32px;
          height: 28px;
          padding: 0;
          border: 1px solid #555;
          border-radius: 3px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .color-text {
          flex: 1;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          padding: 6px 8px;
          background: #3e3e3e;
          border: 1px solid #555;
          color: #d4d4d4;
          border-radius: 3px;
          font-size: 12px;
          font-family: monospace;
        }
        .prop-actions {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid #3e3e3e;
        }
        .prop-btn {
          width: 100%;
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .prop-btn.delete {
          background: #c62828;
          color: #fff;
        }
        .hint-text {
          font-size: 12px;
          color: #777;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}

function EmptyState({ locale, width }) {
  return <PanelShell width={width} title={locale === 'zh' ? '属性' : 'Properties'}><div className="hint-text">{locale === 'zh' ? '选择一个元素查看属性' : 'Select an element to view properties'}</div></PanelShell>;
}

function NodePropertiesPanel({ locale, width, selectedNode, selectedEdge, selectedText, selectedImage, nodes, onUpdateNode, onDeleteNode, onUpdateEdge, onDeleteEdge, onUpdateText, onDeleteText, onUpdateImage, onDeleteImage }) {
  const [nodeFormData, setNodeFormData] = useState({});
  const [edgeFormData, setEdgeFormData] = useState({});
  const [textFormData, setTextFormData] = useState({});
  const [imageFormData, setImageFormData] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setNodeFormData({
        width: selectedNode.width || 120,
        height: selectedNode.height || 60,
        fill: selectedNode.style?.fill || '#ffffff',
        stroke: selectedNode.style?.stroke || '#000000',
        strokeWidth: selectedNode.style?.strokeWidth || 2,
        strokeDasharray: selectedNode.style?.strokeDasharray || 'solid',
        label: selectedNode.label || '',
        subtitle: selectedNode.subtitle || '',
        fontSize: selectedNode.style?.fontSize || 14,
        fontWeight: selectedNode.style?.fontWeight || 'bold',
        fontFamily: selectedNode.style?.fontFamily || 'Arial'
      });
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      setEdgeFormData({
        label: selectedEdge.label || '',
        style: selectedEdge.style || 'solid',
        strokeWidth: selectedEdge.strokeWidth || 1.5,
        strokeColor: selectedEdge.strokeColor || '#333333',
        labelColor: selectedEdge.labelColor || '#333333',
        fromDir: selectedEdge.fromDir || 'auto',
        toDir: selectedEdge.toDir || 'auto',
        curveType: selectedEdge.curveType || 'auto',
        fontSize: selectedEdge.labelStyle?.fontSize || 12,
        fontWeight: selectedEdge.labelStyle?.fontWeight || 'normal',
        fontFamily: selectedEdge.labelStyle?.fontFamily || 'Arial'
      });
    }
  }, [selectedEdge]);

  useEffect(() => {
    if (selectedText) {
      setTextFormData({
        content: selectedText.content || '',
        fontSize: selectedText.fontSize || 14,
        fontWeight: selectedText.fontWeight || 'normal',
        fontFamily: selectedText.fontFamily || 'Arial',
        color: selectedText.color || '#000000',
        backgroundColor: selectedText.backgroundColor || 'transparent'
      });
    }
  }, [selectedText]);

  useEffect(() => {
    if (selectedImage) {
      setImageFormData({
        x: selectedImage.x || 0,
        y: selectedImage.y || 0,
        width: selectedImage.width || 200,
        height: selectedImage.height || 150,
        opacity: selectedImage.opacity || 1,
        fit: selectedImage.fit || 'cover',
        cropX: selectedImage.crop?.x || 0,
        cropY: selectedImage.crop?.y || 0,
        cropWidth: selectedImage.crop?.width || 1,
        cropHeight: selectedImage.crop?.height || 1
      });
    }
  }, [selectedImage]);

  const handleNodeChange = (field, value) => {
    if (!selectedNode) return;
    const next = { ...nodeFormData, [field]: value };
    setNodeFormData(next);
    const updated = { ...selectedNode, style: { ...selectedNode.style } };
    if (field === 'width' || field === 'height') updated[field] = parseInt(value, 10) || 60;
    else if (field === 'label' || field === 'subtitle') updated[field] = value;
    else if (field === 'fill' || field === 'stroke') updated.style[field] = value;
    else if (field === 'strokeWidth' || field === 'fontSize') updated.style[field] = parseInt(value, 10) || 1;
    else updated.style[field] = value;
    onUpdateNode(updated);
  };

  const handleEdgeChange = (field, value) => {
    if (!selectedEdge) return;
    const next = { ...edgeFormData, [field]: value };
    setEdgeFormData(next);
    const updated = { ...selectedEdge, labelStyle: { ...selectedEdge.labelStyle } };
    if (field === 'fontSize') updated.labelStyle.fontSize = parseInt(value, 10) || 12;
    else if (field === 'fontWeight' || field === 'fontFamily') updated.labelStyle[field] = value;
    else if (field === 'strokeWidth') updated[field] = parseFloat(value) || 1.5;
    else updated[field] = value;
    onUpdateEdge(updated);
  };

  const handleTextChange = (field, value) => {
    if (!selectedText) return;
    const next = { ...textFormData, [field]: value };
    setTextFormData(next);
    onUpdateText({ ...selectedText, [field]: field === 'fontSize' ? parseInt(value, 10) || 14 : value });
  };

  const handleImageChange = (field, value) => {
    if (!selectedImage) return;
    const next = { ...imageFormData, [field]: value };
    setImageFormData(next);
    const updated = {
      ...selectedImage,
      x: field === 'x' ? parseFloat(value) || 0 : parseFloat(next.x) || 0,
      y: field === 'y' ? parseFloat(value) || 0 : parseFloat(next.y) || 0,
      width: field === 'width' ? Math.max(32, parseFloat(value) || 32) : Math.max(32, parseFloat(next.width) || 32),
      height: field === 'height' ? Math.max(32, parseFloat(value) || 32) : Math.max(32, parseFloat(next.height) || 32),
      opacity: field === 'opacity' ? Math.max(0.05, Math.min(1, parseFloat(value) || 1)) : Math.max(0.05, Math.min(1, parseFloat(next.opacity) || 1)),
      fit: field === 'fit' ? value : next.fit,
      crop: {
        x: Math.max(0, Math.min(0.95, parseFloat(field === 'cropX' ? value : next.cropX) || 0)),
        y: Math.max(0, Math.min(0.95, parseFloat(field === 'cropY' ? value : next.cropY) || 0)),
        width: Math.max(0.05, Math.min(1, parseFloat(field === 'cropWidth' ? value : next.cropWidth) || 1)),
        height: Math.max(0.05, Math.min(1, parseFloat(field === 'cropHeight' ? value : next.cropHeight) || 1))
      }
    };
    onUpdateImage(updated);
  };

  if (!selectedNode && !selectedEdge && !selectedText && !selectedImage) {
    return <EmptyState locale={locale} width={width} />;
  }

  if (selectedImage) {
    return (
      <PanelShell width={width} title={locale === 'zh' ? '图片属性' : 'Image Properties'}>
        <div className="prop-group"><label className="prop-label">X</label><input className="prop-input" type="number" value={Math.round(imageFormData.x || 0)} onChange={(e) => handleImageChange('x', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">Y</label><input className="prop-input" type="number" value={Math.round(imageFormData.y || 0)} onChange={(e) => handleImageChange('y', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '宽度' : 'Width'}</label><input className="prop-input" type="number" min="32" value={Math.round(imageFormData.width || 0)} onChange={(e) => handleImageChange('width', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '高度' : 'Height'}</label><input className="prop-input" type="number" min="32" value={Math.round(imageFormData.height || 0)} onChange={(e) => handleImageChange('height', e.target.value)} /></div>
        <div className="prop-group">
          <label className="prop-label">{locale === 'zh' ? '填充模式' : 'Fit Mode'}</label>
          <select className="prop-input" value={imageFormData.fit || 'cover'} onChange={(e) => handleImageChange('fit', e.target.value)}>
            <option value="cover">{locale === 'zh' ? '裁切填充' : 'Cover'}</option>
            <option value="contain">{locale === 'zh' ? '完整显示' : 'Contain'}</option>
            <option value="fill">{locale === 'zh' ? '拉伸填满' : 'Stretch Fill'}</option>
          </select>
        </div>
        <div className="prop-group">
          <label className="prop-label">{locale === 'zh' ? '透明度' : 'Opacity'}</label>
          <input className="prop-input" type="number" min="0.05" max="1" step="0.05" value={imageFormData.opacity || 1} onChange={(e) => handleImageChange('opacity', e.target.value)} />
        </div>
        <div className="prop-group">
          <label className="prop-label">{locale === 'zh' ? '裁剪区域' : 'Crop Region'}</label>
          <div className="prop-group"><label className="prop-label">X</label><input className="prop-input" type="number" min="0" max="0.95" step="0.01" value={imageFormData.cropX ?? 0} onChange={(e) => handleImageChange('cropX', e.target.value)} /></div>
          <div className="prop-group"><label className="prop-label">Y</label><input className="prop-input" type="number" min="0" max="0.95" step="0.01" value={imageFormData.cropY ?? 0} onChange={(e) => handleImageChange('cropY', e.target.value)} /></div>
          <div className="prop-group"><label className="prop-label">W</label><input className="prop-input" type="number" min="0.05" max="1" step="0.01" value={imageFormData.cropWidth ?? 1} onChange={(e) => handleImageChange('cropWidth', e.target.value)} /></div>
          <div className="prop-group"><label className="prop-label">H</label><input className="prop-input" type="number" min="0.05" max="1" step="0.01" value={imageFormData.cropHeight ?? 1} onChange={(e) => handleImageChange('cropHeight', e.target.value)} /></div>
          <div className="hint-text">{locale === 'zh' ? '裁剪值使用 0 到 1 的相对比例。Cover 模式下会按裁剪区域显示。' : 'Crop values are normalized from 0 to 1. In cover mode the visible area follows this crop box.'}</div>
        </div>
        <div className="prop-actions"><button className="prop-btn delete" onClick={() => onDeleteImage(selectedImage.id)}>{locale === 'zh' ? '删除图片' : 'Delete Image'}</button></div>
      </PanelShell>
    );
  }

  if (selectedText) {
    return (
      <PanelShell width={width} title={locale === 'zh' ? '文本属性' : 'Text Properties'}>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '内容' : 'Content'}</label><textarea className="prop-input" rows={4} value={textFormData.content || ''} onChange={(e) => handleTextChange('content', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '字号' : 'Font Size'}</label><input className="prop-input" type="number" value={textFormData.fontSize || 14} onChange={(e) => handleTextChange('fontSize', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '粗细' : 'Weight'}</label><select className="prop-input" value={textFormData.fontWeight || 'normal'} onChange={(e) => handleTextChange('fontWeight', e.target.value)}><option value="normal">{locale === 'zh' ? '正常' : 'Normal'}</option><option value="bold">{locale === 'zh' ? '粗体' : 'Bold'}</option></select></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '字体' : 'Font Family'}</label><input className="prop-input" value={textFormData.fontFamily || 'Arial'} onChange={(e) => handleTextChange('fontFamily', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '文字颜色' : 'Text Color'}</label><div className="color-input-wrapper"><input className="color-input" type="color" value={textFormData.color || '#000000'} onChange={(e) => handleTextChange('color', e.target.value)} /><input className="color-text" value={textFormData.color || '#000000'} onChange={(e) => handleTextChange('color', e.target.value)} /></div></div>
        <div className="prop-actions"><button className="prop-btn delete" onClick={() => onDeleteText(selectedText.id)}>{locale === 'zh' ? '删除文本' : 'Delete Text'}</button></div>
      </PanelShell>
    );
  }

  if (selectedEdge) {
    return (
      <PanelShell width={width} title={locale === 'zh' ? '连线属性' : 'Edge Properties'}>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '标签' : 'Label'}</label><input className="prop-input" value={edgeFormData.label || ''} onChange={(e) => handleEdgeChange('label', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '线型' : 'Line Style'}</label><select className="prop-input" value={edgeFormData.style || 'solid'} onChange={(e) => handleEdgeChange('style', e.target.value)}><option value="solid">{locale === 'zh' ? '实线' : 'Solid'}</option><option value="dashed">{locale === 'zh' ? '虚线' : 'Dashed'}</option><option value="dotted">{locale === 'zh' ? '点线' : 'Dotted'}</option></select></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '粗细' : 'Width'}</label><input className="prop-input" type="number" step="0.5" value={edgeFormData.strokeWidth || 1.5} onChange={(e) => handleEdgeChange('strokeWidth', e.target.value)} /></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '曲线类型' : 'Curve Type'}</label><select className="prop-input" value={edgeFormData.curveType || 'auto'} onChange={(e) => handleEdgeChange('curveType', e.target.value)}><option value="auto">{locale === 'zh' ? '自动' : 'Auto'}</option><option value="straight">{locale === 'zh' ? '直线' : 'Straight'}</option><option value="bezier">Bezier</option><option value="bezier2">Bezier 2</option><option value="manual">{locale === 'zh' ? '手动控制点' : 'Manual'}</option></select></div>
        <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '线条颜色' : 'Stroke Color'}</label><div className="color-input-wrapper"><input className="color-input" type="color" value={edgeFormData.strokeColor || '#333333'} onChange={(e) => handleEdgeChange('strokeColor', e.target.value)} /><input className="color-text" value={edgeFormData.strokeColor || '#333333'} onChange={(e) => handleEdgeChange('strokeColor', e.target.value)} /></div></div>
        <div className="prop-actions"><button className="prop-btn delete" onClick={() => onDeleteEdge(selectedEdge.id)}>{locale === 'zh' ? '删除连线' : 'Delete Edge'}</button></div>
      </PanelShell>
    );
  }

  return (
    <PanelShell width={width} title={locale === 'zh' ? '节点属性' : 'Node Properties'}>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '标签' : 'Label'}</label><input className="prop-input" value={nodeFormData.label || ''} onChange={(e) => handleNodeChange('label', e.target.value)} /></div>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '副标题' : 'Subtitle'}</label><input className="prop-input" value={nodeFormData.subtitle || ''} onChange={(e) => handleNodeChange('subtitle', e.target.value)} /></div>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '宽度' : 'Width'}</label><input className="prop-input" type="number" value={nodeFormData.width || 120} onChange={(e) => handleNodeChange('width', e.target.value)} /></div>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '高度' : 'Height'}</label><input className="prop-input" type="number" value={nodeFormData.height || 60} onChange={(e) => handleNodeChange('height', e.target.value)} /></div>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '填充颜色' : 'Fill Color'}</label><div className="color-input-wrapper"><input className="color-input" type="color" value={nodeFormData.fill || '#ffffff'} onChange={(e) => handleNodeChange('fill', e.target.value)} /><input className="color-text" value={nodeFormData.fill || '#ffffff'} onChange={(e) => handleNodeChange('fill', e.target.value)} /></div></div>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '边框颜色' : 'Stroke Color'}</label><div className="color-input-wrapper"><input className="color-input" type="color" value={nodeFormData.stroke || '#000000'} onChange={(e) => handleNodeChange('stroke', e.target.value)} /><input className="color-text" value={nodeFormData.stroke || '#000000'} onChange={(e) => handleNodeChange('stroke', e.target.value)} /></div></div>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '线宽' : 'Stroke Width'}</label><input className="prop-input" type="number" value={nodeFormData.strokeWidth || 2} onChange={(e) => handleNodeChange('strokeWidth', e.target.value)} /></div>
      <div className="prop-group"><label className="prop-label">{locale === 'zh' ? '边框样式' : 'Stroke Style'}</label><select className="prop-input" value={nodeFormData.strokeDasharray || 'solid'} onChange={(e) => handleNodeChange('strokeDasharray', e.target.value)}><option value="solid">{locale === 'zh' ? '实线' : 'Solid'}</option><option value="dashed">{locale === 'zh' ? '虚线' : 'Dashed'}</option><option value="dotted">{locale === 'zh' ? '点线' : 'Dotted'}</option></select></div>
      <div className="prop-actions"><button className="prop-btn delete" onClick={() => onDeleteNode(selectedNode.id)}>{locale === 'zh' ? '删除节点' : 'Delete Node'}</button></div>
    </PanelShell>
  );
}

export default NodePropertiesPanel;
