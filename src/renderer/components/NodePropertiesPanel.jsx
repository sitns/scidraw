import React, { useState, useEffect } from 'react';
import { t } from '../utils/i18n';

function NodePropertiesPanel({ 
  locale, 
  selectedNode,
  selectedEdge,
  onUpdateNode, 
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
  nodes 
}) {
  const [nodeFormData, setNodeFormData] = useState({});
  const [edgeFormData, setEdgeFormData] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setNodeFormData({
        width: selectedNode.width || 120,
        height: selectedNode.height || 60,
        fill: selectedNode.style?.fill || '#ffffff',
        stroke: selectedNode.style?.stroke || '#000000',
        strokeWidth: selectedNode.style?.strokeWidth || 2,
        label: selectedNode.label || '',
        subtitle: selectedNode.subtitle || ''
      });
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      setEdgeFormData({
        label: selectedEdge.label || '',
        style: selectedEdge.style || 'solid',
        fromDir: selectedEdge.fromDir || 'auto',
        toDir: selectedEdge.toDir || 'auto'
      });
    }
  }, [selectedEdge]);

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
    
    const newData = { ...edgeFormData, [field]: value };
    setEdgeFormData(newData);

    const updatedEdge = { ...selectedEdge, [field]: value };
    onUpdateEdge(updatedEdge);
  };

  if (!selectedNode && !selectedEdge) {
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
