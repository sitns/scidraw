import React, { useState } from 'react';
import { t } from '../utils/i18n';

const NODE_PRESETS = [
  {
    type: 'box',
    name: { zh: '矩形', en: 'Box' },
    icon: '▭',
    style: { width: 120, height: 60, fill: '#e3f2fd', stroke: '#2196f3', label: '' }
  },
  {
    type: 'rounded',
    name: { zh: '圆角矩形', en: 'Rounded' },
    icon: '▢',
    style: { width: 120, height: 60, fill: '#e8f5e9', stroke: '#4caf50', label: '' }
  },
  {
    type: 'diamond',
    name: { zh: '菱形', en: 'Diamond' },
    icon: '◇',
    style: { width: 100, height: 100, fill: '#fff3e0', stroke: '#ff9800', label: '' }
  },
  {
    type: 'circle',
    name: { zh: '圆形', en: 'Circle' },
    icon: '○',
    style: { width: 80, height: 80, fill: '#fce4ec', stroke: '#e91e63', label: '' }
  },
  {
    type: 'process',
    name: { zh: '流程', en: 'Process' },
    icon: '▷',
    style: { width: 140, height: 50, fill: '#f3e5f5', stroke: '#9c27b0', label: '' }
  },
  {
    type: 'data',
    name: { zh: '数据', en: 'Data' },
    icon: '≡',
    style: { width: 100, height: 70, fill: '#e0f7fa', stroke: '#00bcd4', label: '' }
  }
];

function NodeToolbar({ locale, nodes, selectedId, onAddNode, onAddEdge, onDeleteNode }) {
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');

  const handleAddNode = (preset) => {
    const label = preset.name[locale] || preset.name.zh;
    onAddNode(preset.type, {
      ...preset.style,
      label: label
    });
  };

  const handleAddEdge = () => {
    if (edgeFrom && edgeTo) {
      onAddEdge(edgeFrom, edgeTo);
      setShowAddEdge(false);
      setEdgeFrom('');
      setEdgeTo('');
    }
  };

  return (
    <div className="node-toolbar">
      <div className="toolbar-section">
        <div className="toolbar-section-title">
          {locale === 'zh' ? '添加节点' : 'Add Node'}
        </div>
        <div className="node-presets">
          {NODE_PRESETS.map((preset, i) => (
            <button
              key={i}
              className="preset-btn"
              onClick={() => handleAddNode(preset)}
              title={preset.name[locale] || preset.name.zh}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-name">{preset.name[locale] || preset.name.zh}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-section-title">
          {locale === 'zh' ? '连线' : 'Edges'}
        </div>
        <button 
          className="preset-btn edge-btn"
          onClick={() => setShowAddEdge(!showAddEdge)}
        >
          <span className="preset-icon">→</span>
          <span className="preset-name">
            {locale === 'zh' ? '添加连线' : 'Add Edge'}
          </span>
        </button>

        {showAddEdge && (
          <div className="edge-form">
            <select 
              value={edgeFrom} 
              onChange={(e) => setEdgeFrom(e.target.value)}
              className="edge-select"
            >
              <option value="">
                {locale === 'zh' ? '从...' : 'From...'}
              </option>
              {nodes.map(node => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
            <span className="edge-arrow">→</span>
            <select 
              value={edgeTo} 
              onChange={(e) => setEdgeTo(e.target.value)}
              className="edge-select"
            >
              <option value="">
                {locale === 'zh' ? '到...' : 'To...'}
              </option>
              {nodes.filter(n => n.id !== edgeFrom).map(node => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
            <button className="edge-confirm" onClick={handleAddEdge}>+</button>
          </div>
        )}
      </div>

      {selectedId && (
        <div className="toolbar-section">
          <div className="toolbar-section-title">
            {locale === 'zh' ? '操作' : 'Actions'}
          </div>
          <button 
            className="preset-btn delete-btn"
            onClick={() => onDeleteNode(selectedId)}
          >
            <span className="preset-icon">🗑</span>
            <span className="preset-name">
              {locale === 'zh' ? '删除选中' : 'Delete Selected'}
            </span>
          </button>
        </div>
      )}

      <style>{`
        .node-toolbar {
          width: 180px;
          background: #252526;
          border-right: 1px solid #3e3e3e;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .toolbar-section {
          padding: 12px;
          border-bottom: 1px solid #3e3e3e;
        }

        .toolbar-section-title {
          font-size: 11px;
          font-weight: 600;
          color: #969696;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .node-presets {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .preset-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #3e3e3e;
          border: none;
          border-radius: 4px;
          color: #d4d4d4;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }

        .preset-btn:hover {
          background: #4e4e4e;
        }

        .preset-icon {
          font-size: 16px;
          width: 24px;
          text-align: center;
        }

        .preset-name {
          font-size: 12px;
        }

        .edge-btn {
          background: #0e639c;
        }

        .edge-btn:hover {
          background: #1177bb;
        }

        .edge-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
          padding: 10px;
          background: #1e1e1e;
          border-radius: 4px;
        }

        .edge-select {
          padding: 6px 8px;
          background: #3e3e3e;
          border: 1px solid #555;
          color: #d4d4d4;
          border-radius: 3px;
          font-size: 12px;
        }

        .edge-arrow {
          text-align: center;
          color: #888;
        }

        .edge-confirm {
          padding: 6px;
          background: #4caf50;
          border: none;
          border-radius: 3px;
          color: #fff;
          cursor: pointer;
          font-size: 16px;
        }

        .edge-confirm:hover {
          background: #66bb6a;
        }

        .delete-btn {
          background: #c62828;
        }

        .delete-btn:hover {
          background: #d32f2f;
        }
      `}</style>
    </div>
  );
}

export default NodeToolbar;
