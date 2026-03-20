import React, { useState, useEffect } from 'react';
import { t } from '../utils/i18n';

function NodePropertiesPanel({ 
  locale, 
  selectedNode,
  selectedEdge,
  selectedText,
  onUpdateNode, 
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
  onUpdateText,
  onDeleteText,
  nodes 
}) {
  const [nodeFormData, setNodeFormData] = useState({});
  const [edgeFormData, setEdgeFormData] = useState({});
  const [textFormData, setTextFormData] = useState({});

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
        labelOffsetX: selectedNode.labelOffset?.x || 0,
        labelOffsetY: selectedNode.labelOffset?.y || 0
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
        fromDir: selectedEdge.fromDir || 'auto',
        toDir: selectedEdge.toDir || 'auto',
        curveType: selectedEdge.curveType || 'auto',
        controlPoints: selectedEdge.controlPoints || [],
        labelOffsetX: selectedEdge.labelOffset?.x || 0,
        labelOffsetY: selectedEdge.labelOffset?.y || 0
      });
    }
  }, [selectedEdge]);

  useEffect(() => {
    if (selectedText) {
      setTextFormData({
        content: selectedText.content || '',
        fontSize: selectedText.fontSize || 14,
        fontWeight: selectedText.fontWeight || 'normal',
        color: selectedText.color || '#000000',
        backgroundColor: selectedText.backgroundColor || 'transparent'
      });
    }
  }, [selectedText]);

  const handleNodeChange = (field, value) => {
    if (!selectedNode) return;
    
    const newData = { ...nodeFormData, [field]: value };
    setNodeFormData(newData);

    const updatedNode = { ...selectedNode };
    
    if (field === 'width' || field === 'height') {
      updatedNode[field] = parseInt(value) || 60;
    } else if (field === 'strokeWidth') {
      updatedNode.style = {
        ...updatedNode.style,
        strokeWidth: parseInt(value) || 2
      };
    } else if (field === 'strokeDasharray') {
      updatedNode.style = {
        ...updatedNode.style,
        strokeDasharray: value
      };
    } else if (field === 'fill' || field === 'stroke') {
      updatedNode.style = {
        ...updatedNode.style,
        [field]: value
      };
    } else if (field === 'label') {
      updatedNode.label = value;
    } else if (field === 'subtitle') {
      updatedNode.subtitle = value;
    }
    
    onUpdateNode(updatedNode);
  };

  const handleEdgeChange = (field, value) => {
    if (!selectedEdge) return;

    let newValue = value;

    if (field === 'strokeWidth') {
      newValue = parseFloat(value) || 1.5;
    }

    if (field === 'curveType' && (value === 'bezier' || value === 'bezier2' || value === 'manual')) {
      const currentCps = edgeFormData.controlPoints || [];
      if (currentCps.length === 0) {
        newValue = value;
        const fromNode = nodes.find(n => n.id === selectedEdge.from);
        const toNode = nodes.find(n => n.id === selectedEdge.to);
        let defaultCps = [];
        if (fromNode && toNode) {
          const midX = (fromNode.x + fromNode.width/2 + toNode.x + toNode.width/2) / 2;
          const midY = (fromNode.y + fromNode.height/2 + toNode.y + toNode.height/2) / 2;
          if (value === 'bezier' || value === 'manual') {
            defaultCps = [{ x: midX, y: midY - 30 }];
          } else if (value === 'bezier2') {
            defaultCps = [{ x: midX - 30, y: midY - 30 }, { x: midX + 30, y: midY - 30 }];
          }
        }
        const newData = { ...edgeFormData, curveType: value, controlPoints: defaultCps };
        setEdgeFormData(newData);
        const updatedEdge = { ...selectedEdge, curveType: value, controlPoints: defaultCps };
        onUpdateEdge(updatedEdge);
        return;
      }
    }
    
    const newData = { ...edgeFormData, [field]: newValue };
    setEdgeFormData(newData);

    const updatedEdge = { ...selectedEdge, [field]: newValue };
    onUpdateEdge(updatedEdge);
  };

  const handleTextChange = (field, value) => {
    if (!selectedText) return;
    
    let newValue = value;
    
    if (field === 'fontSize') {
      newValue = parseInt(value) || 14;
    }

    const newData = { ...textFormData, [field]: newValue };
    setTextFormData(newData);

    const updatedText = { ...selectedText, [field]: newValue };
    onUpdateText(updatedText);
  };

  if (!selectedNode && !selectedEdge && !selectedText) {
    return (
      <div className="properties-panel">
        <div className="properties-header">
          <span>{locale === 'zh' ? '属性' : 'Properties'}</span>
        </div>
        <div className="properties-empty">
          {locale === 'zh' ? '选择一个节点或连线查看属性' : 'Select a node or edge to view properties'}
        </div>
        <style>{`
          .properties-panel {
            width: 220px;
            background: #252526;
            border-left: 1px solid #3e3e3e;
            display: flex;
            flex-direction: column;
          }
          .properties-header {
            padding: 10px 12px;
            background: #2d2d2d;
            border-bottom: 1px solid #3e3e3e;
            font-size: 12px;
            font-weight: 600;
            color: #969696;
          }
          .properties-empty {
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        `}</style>
      </div>
    );
  }

  if (selectedEdge) {
    const fromNode = nodes.find(n => n.id === selectedEdge.from);
    const toNode = nodes.find(n => n.id === selectedEdge.to);
    
    return (
      <div className="properties-panel">
        <div className="properties-header">
          <span>{locale === 'zh' ? '连线属性' : 'Edge Properties'}</span>
        </div>
        <div className="properties-content">
          
          <div className="prop-group">
            <label className="prop-label">ID</label>
            <input 
              type="text" 
              value={selectedEdge.id} 
              disabled 
              className="prop-input disabled"
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '从节点' : 'From Node'}
            </label>
            <input 
              type="text" 
              value={fromNode?.label || selectedEdge.from} 
              disabled 
              className="prop-input disabled"
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '到节点' : 'To Node'}
            </label>
            <input 
              type="text" 
              value={toNode?.label || selectedEdge.to} 
              disabled 
              className="prop-input disabled"
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '连线标签' : 'Edge Label'}
            </label>
            <input 
              type="text" 
              value={edgeFormData.label || ''} 
              onChange={(e) => handleEdgeChange('label', e.target.value)}
              className="prop-input"
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '线条样式' : 'Line Style'}
            </label>
            <select
              value={edgeFormData.style || 'solid'}
              onChange={(e) => handleEdgeChange('style', e.target.value)}
              className="prop-input"
            >
              <option value="solid">{locale === 'zh' ? '实线' : 'Solid'}</option>
              <option value="dashed">{locale === 'zh' ? '虚线' : 'Dashed'}</option>
              <option value="dotted">{locale === 'zh' ? '点线' : 'Dotted'}</option>
            </select>
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '线条粗细' : 'Line Width'}
            </label>
            <input
              type="number"
              value={edgeFormData.strokeWidth || 1.5}
              onChange={(e) => handleEdgeChange('strokeWidth', e.target.value)}
              className="prop-input"
              min="0.5"
              max="10"
              step="0.5"
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '线条颜色' : 'Line Color'}
            </label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={edgeFormData.strokeColor || '#333333'}
                onChange={(e) => handleEdgeChange('strokeColor', e.target.value)}
                className="color-input"
              />
              <input
                type="text"
                value={edgeFormData.strokeColor || '#333333'}
                onChange={(e) => handleEdgeChange('strokeColor', e.target.value)}
                className="color-text"
              />
            </div>
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '起点方向' : 'Start Direction'}
            </label>
            <select 
              value={edgeFormData.fromDir || 'auto'} 
              onChange={(e) => handleEdgeChange('fromDir', e.target.value)}
              className="prop-input"
            >
              <option value="auto">{locale === 'zh' ? '自动' : 'Auto'}</option>
              <option value="left">{locale === 'zh' ? '左' : 'Left'}</option>
              <option value="right">{locale === 'zh' ? '右' : 'Right'}</option>
              <option value="top">{locale === 'zh' ? '上' : 'Top'}</option>
              <option value="bottom">{locale === 'zh' ? '下' : 'Bottom'}</option>
            </select>
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '终点方向' : 'End Direction'}
            </label>
            <select 
              value={edgeFormData.toDir || 'auto'} 
              onChange={(e) => handleEdgeChange('toDir', e.target.value)}
              className="prop-input"
            >
              <option value="auto">{locale === 'zh' ? '自动' : 'Auto'}</option>
              <option value="left">{locale === 'zh' ? '左' : 'Left'}</option>
              <option value="right">{locale === 'zh' ? '右' : 'Right'}</option>
              <option value="top">{locale === 'zh' ? '上' : 'Top'}</option>
              <option value="bottom">{locale === 'zh' ? '下' : 'Bottom'}</option>
            </select>
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '曲线类型' : 'Curve Type'}
            </label>
            <select 
              value={edgeFormData.curveType || 'auto'} 
              onChange={(e) => handleEdgeChange('curveType', e.target.value)}
              className="prop-input"
            >
              <option value="auto">{locale === 'zh' ? '自动曲线' : 'Auto Curve'}</option>
              <option value="straight">{locale === 'zh' ? '直线' : 'Straight Line'}</option>
              <option value="bezier">{locale === 'zh' ? '单贝塞尔曲线' : 'Single Bezier'}</option>
              <option value="bezier2">{locale === 'zh' ? '双贝塞尔曲线' : 'Double Bezier'}</option>
              <option value="manual">{locale === 'zh' ? '手动控制点' : 'Manual Points'}</option>
            </select>
          </div>

          {(edgeFormData.curveType === 'bezier' || edgeFormData.curveType === 'bezier2' || edgeFormData.curveType === 'manual') && (
            <div className="prop-group">
              <label className="prop-label">
                {locale === 'zh' ? '控制点' : 'Control Points'}
              </label>
              <div className="control-points-list">
                {(edgeFormData.controlPoints || []).map((cp, idx) => (
                  <div key={idx} className="control-point-row">
                    <span className="cp-label">{idx + 1}:</span>
                    <input 
                      type="number" 
                      value={Math.round(cp.x)} 
                      onChange={(e) => {
                        const newCps = [...edgeFormData.controlPoints];
                        newCps[idx] = { ...newCps[idx], x: parseInt(e.target.value) || 0 };
                        handleEdgeChange('controlPoints', newCps);
                      }}
                      className="prop-input cp-input"
                      placeholder="X"
                    />
                    <input 
                      type="number" 
                      value={Math.round(cp.y)} 
                      onChange={(e) => {
                        const newCps = [...edgeFormData.controlPoints];
                        newCps[idx] = { ...newCps[idx], y: parseInt(e.target.value) || 0 };
                        handleEdgeChange('controlPoints', newCps);
                      }}
                      className="prop-input cp-input"
                      placeholder="Y"
                    />
                    <button 
                      className="cp-delete"
                      onClick={() => {
                        const newCps = edgeFormData.controlPoints.filter((_, i) => i !== idx);
                        handleEdgeChange('controlPoints', newCps);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  className="cp-add"
                  onClick={() => {
                    const newCps = [...(edgeFormData.controlPoints || []), { x: 100, y: 100 }];
                    handleEdgeChange('controlPoints', newCps);
                  }}
                >
                  {locale === 'zh' ? '+ 添加控制点' : '+ Add Control Point'}
                </button>
              </div>
            </div>
          )}

          <div className="prop-actions">
            <button 
              className="prop-btn delete"
              onClick={() => onDeleteEdge(selectedEdge.id)}
            >
              {locale === 'zh' ? '删除连线' : 'Delete Edge'}
            </button>
          </div>

        </div>

        <style>{`
          .properties-panel {
            width: 220px;
            background: #252526;
            border-left: 1px solid #3e3e3e;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
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
          }
          .prop-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .prop-label {
            font-size: 11px;
            color: #969696;
            text-transform: uppercase;
          }
          .prop-input {
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
            transition: background 0.2s;
          }
          .prop-btn.delete {
            background: #c62828;
            color: #fff;
          }
          .prop-btn.delete:hover {
            background: #d32f2f;
          }
          .control-points-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .control-point-row {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .cp-label {
            font-size: 11px;
            color: #969696;
            width: 20px;
          }
          .cp-input {
            width: 50px !important;
            padding: 4px !important;
            font-size: 11px !important;
          }
          .cp-delete {
            width: 20px;
            height: 20px;
            padding: 0;
            background: #c62828;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
          }
          .cp-add {
            margin-top: 6px;
            padding: 6px;
            background: #0e639c;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
          }
          .cp-add:hover {
            background: #1177bb;
          }
          .color-input-wrapper {
            display: flex;
            gap: 6px;
            align-items: center;
          }
          .color-input {
            width: 32px;
            height: 28px;
            padding: 0;
            border: 1px solid #555;
            border-radius: 3px;
            cursor: pointer;
          }
          .color-text {
            flex: 1;
            padding: 6px 8px;
            background: #3e3e3e;
            border: 1px solid #555;
            color: #d4d4d4;
            border-radius: 3px;
            font-size: 12px;
            font-family: monospace;
          }
        `}</style>
      </div>
    );
  }

  if (selectedText) {
    return (
      <div className="properties-panel">
        <div className="properties-header">
          <span>{locale === 'zh' ? '文本属性' : 'Text Properties'}</span>
        </div>
        <div className="properties-content">
          
          <div className="prop-group">
            <label className="prop-label">ID</label>
            <input 
              type="text" 
              value={selectedText.id} 
              disabled 
              className="prop-input disabled"
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '文本内容' : 'Text Content'}
            </label>
            <textarea 
              value={textFormData.content || ''} 
              onChange={(e) => handleTextChange('content', e.target.value)}
              className="prop-input"
              rows={3}
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '字号' : 'Font Size'}
            </label>
            <input 
              type="number" 
              value={textFormData.fontSize || 14} 
              onChange={(e) => handleTextChange('fontSize', e.target.value)}
              className="prop-input"
              min="8"
              max="72"
            />
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '字体粗细' : 'Font Weight'}
            </label>
            <select 
              value={textFormData.fontWeight || 'normal'} 
              onChange={(e) => handleTextChange('fontWeight', e.target.value)}
              className="prop-input"
            >
              <option value="normal">{locale === 'zh' ? '正常' : 'Normal'}</option>
              <option value="bold">{locale === 'zh' ? '粗体' : 'Bold'}</option>
            </select>
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '文字颜色' : 'Text Color'}
            </label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                value={textFormData.color || '#000000'} 
                onChange={(e) => handleTextChange('color', e.target.value)}
                className="color-input"
              />
              <input 
                type="text" 
                value={textFormData.color || '#000000'} 
                onChange={(e) => handleTextChange('color', e.target.value)}
                className="color-text"
              />
            </div>
          </div>

          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '背景颜色' : 'Background Color'}
            </label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                value={textFormData.backgroundColor || '#ffffff'} 
                onChange={(e) => handleTextChange('backgroundColor', e.target.value)}
                className="color-input"
              />
              <select 
                value={textFormData.backgroundColor || 'transparent'} 
                onChange={(e) => handleTextChange('backgroundColor', e.target.value)}
                className="prop-input"
                style={{ flex: 1 }}
              >
                <option value="transparent">{locale === 'zh' ? '透明' : 'Transparent'}</option>
              </select>
            </div>
          </div>

          <div className="prop-row">
            <div className="prop-group">
              <label className="prop-label">X</label>
              <input 
                type="number" 
                value={Math.round(selectedText.x) || 0} 
                onChange={(e) => onUpdateText({ ...selectedText, x: parseInt(e.target.value) || 0 })}
                className="prop-input"
                min="0"
              />
            </div>
            <div className="prop-group">
              <label className="prop-label">Y</label>
              <input 
                type="number" 
                value={Math.round(selectedText.y) || 0} 
                onChange={(e) => onUpdateText({ ...selectedText, y: parseInt(e.target.value) || 0 })}
                className="prop-input"
                min="0"
              />
            </div>
          </div>

          <div className="prop-actions">
            <button 
              className="prop-btn delete"
              onClick={() => onDeleteText(selectedText.id)}
            >
              {locale === 'zh' ? '删除文本' : 'Delete Text'}
            </button>
          </div>

        </div>

        <style>{`
          .properties-panel {
            width: 220px;
            background: #252526;
            border-left: 1px solid #3e3e3e;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
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
          }
          .prop-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .prop-row {
            display: flex;
            gap: 8px;
          }
          .prop-row .prop-group {
            flex: 1;
          }
          .prop-label {
            font-size: 11px;
            color: #969696;
            text-transform: uppercase;
          }
          .prop-input {
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
          }
          .color-input {
            width: 32px;
            height: 28px;
            padding: 0;
            border: 1px solid #555;
            border-radius: 3px;
            cursor: pointer;
          }
          .color-text {
            flex: 1;
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
            transition: background 0.2s;
          }
          .prop-btn.delete {
            background: #c62828;
            color: #fff;
          }
          .prop-btn.delete:hover {
            background: #d32f2f;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <span>{locale === 'zh' ? '节点属性' : 'Node Properties'}</span>
      </div>
      <div className="properties-content">
        
        <div className="prop-group">
          <label className="prop-label">ID</label>
          <input 
            type="text" 
            value={selectedNode.id} 
            disabled 
            className="prop-input disabled"
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">
            {locale === 'zh' ? '标签文本' : 'Label'}
          </label>
          <input 
            type="text" 
            value={nodeFormData.label || ''} 
            onChange={(e) => handleNodeChange('label', e.target.value)}
            className="prop-input"
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">
            {locale === 'zh' ? '副标题' : 'Subtitle'}
          </label>
          <input 
            type="text" 
            value={nodeFormData.subtitle || ''} 
            onChange={(e) => handleNodeChange('subtitle', e.target.value)}
            className="prop-input"
          />
        </div>

        <div className="prop-row">
          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '宽度' : 'Width'}
            </label>
            <input 
              type="number" 
              value={nodeFormData.width || 120} 
              onChange={(e) => handleNodeChange('width', e.target.value)}
              className="prop-input"
              min="20"
              max="800"
            />
          </div>
          <div className="prop-group">
            <label className="prop-label">
              {locale === 'zh' ? '高度' : 'Height'}
            </label>
            <input 
              type="number" 
              value={nodeFormData.height || 60} 
              onChange={(e) => handleNodeChange('height', e.target.value)}
              className="prop-input"
              min="20"
              max="800"
            />
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">
            {locale === 'zh' ? '填充颜色' : 'Fill Color'}
          </label>
          <div className="color-input-wrapper">
            <input 
              type="color" 
              value={nodeFormData.fill || '#ffffff'} 
              onChange={(e) => handleNodeChange('fill', e.target.value)}
              className="color-input"
            />
            <input 
              type="text" 
              value={nodeFormData.fill || '#ffffff'} 
              onChange={(e) => handleNodeChange('fill', e.target.value)}
              className="color-text"
            />
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">
            {locale === 'zh' ? '边框颜色' : 'Border Color'}
          </label>
          <div className="color-input-wrapper">
            <input 
              type="color" 
              value={nodeFormData.stroke || '#000000'} 
              onChange={(e) => handleNodeChange('stroke', e.target.value)}
              className="color-input"
            />
            <input 
              type="text" 
              value={nodeFormData.stroke || '#000000'} 
              onChange={(e) => handleNodeChange('stroke', e.target.value)}
              className="color-text"
            />
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">
            {locale === 'zh' ? '边框宽度' : 'Border Width'}
          </label>
          <input
            type="number"
            value={nodeFormData.strokeWidth || 2}
            onChange={(e) => handleNodeChange('strokeWidth', e.target.value)}
            className="prop-input"
            min="0"
            max="10"
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">
            {locale === 'zh' ? '边框样式' : 'Border Style'}
          </label>
          <select
            value={nodeFormData.strokeDasharray || 'solid'}
            onChange={(e) => handleNodeChange('strokeDasharray', e.target.value)}
            className="prop-input"
          >
            <option value="solid">{locale === 'zh' ? '实线' : 'Solid'}</option>
            <option value="dashed">{locale === 'zh' ? '虚线' : 'Dashed'}</option>
            <option value="dotted">{locale === 'zh' ? '点线' : 'Dotted'}</option>
          </select>
        </div>

        <div className="prop-group">
          <label className="prop-label">X</label>
          <input 
            type="number" 
            value={Math.round(selectedNode.x) || 0} 
            onChange={(e) => onUpdateNode({ ...selectedNode, x: parseInt(e.target.value) || 0 })}
            className="prop-input"
            min="0"
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">Y</label>
          <input 
            type="number" 
            value={Math.round(selectedNode.y) || 0} 
            onChange={(e) => onUpdateNode({ ...selectedNode, y: parseInt(e.target.value) || 0 })}
            className="prop-input"
            min="0"
          />
        </div>

        <div className="prop-actions">
          <button 
            className="prop-btn delete"
            onClick={() => onDeleteNode(selectedNode.id)}
          >
            {locale === 'zh' ? '删除节点' : 'Delete Node'}
          </button>
        </div>

      </div>

      <style>{`
        .properties-panel {
          width: 220px;
          background: #252526;
          border-left: 1px solid #3e3e3e;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
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
        }
        .prop-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .prop-row {
          display: flex;
          gap: 8px;
        }
        .prop-row .prop-group {
          flex: 1;
        }
        .prop-label {
          font-size: 11px;
          color: #969696;
          text-transform: uppercase;
        }
        .prop-input {
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
        }
        .color-input {
          width: 32px;
          height: 28px;
          padding: 0;
          border: 1px solid #555;
          border-radius: 3px;
          cursor: pointer;
        }
        .color-text {
          flex: 1;
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
          transition: background 0.2s;
        }
        .prop-btn.delete {
          background: #c62828;
          color: #fff;
        }
        .prop-btn.delete:hover {
          background: #d32f2f;
        }
      `}</style>
    </div>
  );
}

export default NodePropertiesPanel;
