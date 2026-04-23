import React, { useMemo, useRef, useState } from 'react';
import { SHAPE_GROUPS } from '../utils/shapeLibrary';

function NodeToolbar({ locale, nodes, selectedId, selectedIds = [], selectedGroupId, onAddNode, onAddEdge, onDeleteNode, onDeleteSelected, onAddText, onAddImage, onLayerAction, onBindSelected, onUnbindSelected }) {
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [activeGroup, setActiveGroup] = useState(SHAPE_GROUPS[0].id);
  const fileInputRef = useRef(null);

  const activeShapes = useMemo(() => {
    return SHAPE_GROUPS.find((group) => group.id === activeGroup)?.shapes || SHAPE_GROUPS[0].shapes;
  }, [activeGroup]);

  const handleAddNode = (preset) => {
    const label = preset.name[locale] || preset.name.zh;
    onAddNode(preset.type, {
      ...preset.style,
      label
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 420;
          const maxHeight = 320;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }

          onAddImage({
            src: event.target.result,
            width: Math.round(width),
            height: Math.round(height),
            naturalWidth: img.width,
            naturalHeight: img.height
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="node-toolbar">
      <div className="shape-library-header">
        <div className="toolbar-section-title">{locale === 'zh' ? '形状' : 'Shapes'}</div>
        <div className="shape-group-tabs">
          {SHAPE_GROUPS.map((group) => (
            <button
              key={group.id}
              className={`shape-group-tab ${activeGroup === group.id ? 'active' : ''}`}
              onClick={() => setActiveGroup(group.id)}
              title={group.label[locale] || group.label.zh}
            >
              {group.label[locale] || group.label.zh}
            </button>
          ))}
        </div>
      </div>

      <div className="shape-palette-grid">
        {activeShapes.map((preset) => (
          <button
            key={preset.type}
            className="shape-card"
            onClick={() => handleAddNode(preset)}
            title={preset.name[locale] || preset.name.zh}
          >
            <span className="shape-card-icon">{preset.icon}</span>
            <span className="shape-card-name">{preset.name[locale] || preset.name.zh}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-section compact">
        <div className="toolbar-section-title">{locale === 'zh' ? '插入' : 'Insert'}</div>
        <div className="quick-actions">
          <button className="quick-action-btn text-btn" onClick={() => onAddText?.(locale === 'zh' ? '文本' : 'Text')}>
            <span className="shape-card-icon">T</span>
            <span>{locale === 'zh' ? '文本框' : 'Text Box'}</span>
          </button>
          <button className="quick-action-btn image-btn" onClick={() => fileInputRef.current?.click()}>
            <span className="shape-card-icon">🖼</span>
            <span>{locale === 'zh' ? '插入图片' : 'Insert Image'}</span>
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
      </div>

      <div className="toolbar-section compact">
        <div className="toolbar-section-title">{locale === 'zh' ? '连线' : 'Edges'}</div>
        <button className="preset-btn edge-btn" onClick={() => setShowAddEdge(!showAddEdge)}>
          <span className="preset-icon">→</span>
          <span className="preset-name">{locale === 'zh' ? '添加连线' : 'Add Edge'}</span>
        </button>

        {showAddEdge && (
          <div className="edge-form">
            <select value={edgeFrom} onChange={(e) => setEdgeFrom(e.target.value)} className="edge-select">
              <option value="">{locale === 'zh' ? '从...' : 'From...'}</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
            <span className="edge-arrow">→</span>
            <select value={edgeTo} onChange={(e) => setEdgeTo(e.target.value)} className="edge-select">
              <option value="">{locale === 'zh' ? '到...' : 'To...'}</option>
              {nodes.filter((node) => node.id !== edgeFrom).map((node) => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
            <button className="edge-confirm" onClick={handleAddEdge}>+</button>
          </div>
        )}
      </div>

      {selectedId && (
        <div className="toolbar-section compact">
          <div className="toolbar-section-title">{locale === 'zh' ? '操作' : 'Actions'}</div>
          <button className="preset-btn delete-btn" onClick={() => onDeleteSelected ? onDeleteSelected() : onDeleteNode(selectedId)}>
            <span className="preset-icon">🗑</span>
            <span className="preset-name">{locale === 'zh' ? '删除选中' : 'Delete Selected'}</span>
          </button>

          {selectedIds.length > 1 && (
            <button className="preset-btn bind-btn" onClick={() => onBindSelected?.()}>
              <span className="preset-icon">⛓</span>
              <span className="preset-name">{locale === 'zh' ? '绑定选中' : 'Bind Selected'}</span>
            </button>
          )}

          {selectedGroupId && (
            <button className="preset-btn unbind-btn" onClick={() => onUnbindSelected?.()}>
              <span className="preset-icon">🔓</span>
              <span className="preset-name">{locale === 'zh' ? '解绑组' : 'Unbind Group'}</span>
            </button>
          )}

          <div className="toolbar-section-title layer-title">{locale === 'zh' ? '图层' : 'Layer'}</div>
          <div className="layer-buttons">
            <button className="layer-btn" onClick={() => onLayerAction('bringToFront')} title={locale === 'zh' ? '置于顶层' : 'Bring to Front'}>⬆️⬆</button>
            <button className="layer-btn" onClick={() => onLayerAction('bringForward')} title={locale === 'zh' ? '上移一层' : 'Bring Forward'}>⬆️</button>
            <button className="layer-btn" onClick={() => onLayerAction('sendBackward')} title={locale === 'zh' ? '下移一层' : 'Send Backward'}>⬇️</button>
            <button className="layer-btn" onClick={() => onLayerAction('sendToBack')} title={locale === 'zh' ? '置于底层' : 'Send to Back'}>⬇️⬇</button>
          </div>
        </div>
      )}

      <style>{`
        .node-toolbar {
          width: 248px;
          background: #f7f8fb;
          border-right: 1px solid #d7dce5;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          color: #1f2937;
        }

        .shape-library-header,
        .toolbar-section {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .toolbar-section.compact {
          background: #fff;
        }

        .toolbar-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 10px;
          letter-spacing: 0.04em;
        }

        .shape-group-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .shape-group-tab {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          background: #fff;
          color: #374151;
          border-radius: 999px;
          font-size: 12px;
          cursor: pointer;
        }

        .shape-group-tab.active {
          background: #dbeafe;
          border-color: #60a5fa;
          color: #1d4ed8;
        }

        .shape-palette-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 12px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }

        .shape-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 74px;
          padding: 10px 8px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          color: #111827;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .shape-card:hover,
        .quick-action-btn:hover,
        .preset-btn:hover,
        .layer-btn:hover {
          border-color: #60a5fa;
          background: #eff6ff;
        }

        .bind-btn {
          margin-top: 8px;
        }

        .unbind-btn {
          margin-top: 8px;
        }

        .shape-card-icon {
          font-size: 22px;
          line-height: 1;
        }

        .shape-card-name {
          font-size: 12px;
          text-align: center;
        }

        .quick-actions {
          display: grid;
          gap: 8px;
        }

        .quick-action-btn,
        .preset-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 10px;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #111827;
          cursor: pointer;
          text-align: left;
        }

        .preset-icon {
          width: 22px;
          text-align: center;
        }

        .preset-name {
          font-size: 12px;
        }

        .edge-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
          padding: 10px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .edge-select {
          padding: 7px 8px;
          background: #fff;
          border: 1px solid #d1d5db;
          color: #111827;
          border-radius: 6px;
          font-size: 12px;
        }

        .edge-arrow {
          text-align: center;
          color: #6b7280;
        }

        .edge-confirm {
          padding: 7px;
          background: #2563eb;
          border: none;
          border-radius: 6px;
          color: #fff;
          cursor: pointer;
          font-size: 16px;
        }

        .layer-title {
          margin-top: 12px;
        }

        .layer-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .layer-btn {
          flex: 1;
          min-width: 40px;
          padding: 8px 6px;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #111827;
          cursor: pointer;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

export default NodeToolbar;
