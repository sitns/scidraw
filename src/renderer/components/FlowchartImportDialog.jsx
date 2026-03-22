import React, { useState, useRef, useEffect } from 'react';

function FlowchartImportDialog({ isOpen, onClose, onImport, locale }) {
  const [code, setCode] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (code.trim()) {
      onImport(code);
      setCode('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flowchart-dialog-overlay" onKeyDown={handleKeyDown}>
      <div className="flowchart-dialog">
        <div className="flowchart-dialog-header">
          <span>{locale === 'zh' ? '导入流程图代码' : 'Import Flowchart Code'}</span>
          <button className="flowchart-dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="flowchart-dialog-body">
          <p className="flowchart-dialog-hint">
            {locale === 'zh' 
              ? '支持 Mermaid 流程图语法。请粘贴代码到下方文本框中。'
              : 'Supports Mermaid flowchart syntax. Paste code into the text box below.'}
          </p>
          <textarea
            ref={textareaRef}
            className="flowchart-dialog-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作1]
    B -->|否| D[执行操作2]
    C --> E[结束]
    D --> E`}
          />
        </div>
        <div className="flowchart-dialog-footer">
          <button className="flowchart-dialog-btn cancel" onClick={onClose}>
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button className="flowchart-dialog-btn import" onClick={handleImport}>
            {locale === 'zh' ? '导入' : 'Import'}
          </button>
        </div>
      </div>
      <style>{`
        .flowchart-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .flowchart-dialog {
          background: #2d2d2d;
          border-radius: 8px;
          width: 600px;
          max-width: 90%;
          max-height: 80%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .flowchart-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #3e3e3e;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .flowchart-dialog-close {
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .flowchart-dialog-close:hover {
          color: #fff;
        }
        .flowchart-dialog-body {
          padding: 20px;
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .flowchart-dialog-hint {
          color: #999;
          font-size: 13px;
          margin: 0 0 12px 0;
        }
        .flowchart-dialog-textarea {
          flex: 1;
          min-height: 300px;
          background: #1e1e1e;
          border: 1px solid #3e3e3e;
          border-radius: 4px;
          color: #d4d4d4;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          padding: 12px;
          resize: none;
          outline: none;
        }
        .flowchart-dialog-textarea:focus {
          border-color: #007acc;
        }
        .flowchart-dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #3e3e3e;
        }
        .flowchart-dialog-btn {
          padding: 8px 20px;
          font-size: 13px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .flowchart-dialog-btn.cancel {
          background: #3e3e3e;
          color: #d4d4d4;
        }
        .flowchart-dialog-btn.cancel:hover {
          background: #4e4e4e;
        }
        .flowchart-dialog-btn.import {
          background: #0e639c;
          color: #fff;
        }
        .flowchart-dialog-btn.import:hover {
          background: #1177bb;
        }
      `}</style>
    </div>
  );
}

export default FlowchartImportDialog;
