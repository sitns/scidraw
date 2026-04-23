import React, { useEffect, useRef, useState } from 'react';

function DrawioImportDialog({ isOpen, onClose, onImport, locale }) {
  const [code, setCode] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (code.trim()) {
      onImport(code);
      onClose();
    }
  };

  return (
    <div className="drawio-dialog-overlay" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="drawio-dialog">
        <div className="drawio-dialog-header">
          <span>{locale === 'zh' ? '导入 draw.io XML' : 'Import draw.io XML'}</span>
          <button className="drawio-dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="drawio-dialog-body">
          <p className="drawio-dialog-hint">
            {locale === 'zh'
              ? '粘贴未压缩的 draw.io / diagrams.net XML。当前版本支持 mxGraph XML 和未压缩 .drawio 内容。'
              : 'Paste uncompressed draw.io / diagrams.net XML. This version supports mxGraph XML and uncompressed .drawio content.'}
          </p>
          <textarea
            ref={textareaRef}
            className="drawio-dialog-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="<mxfile>...</mxfile>"
          />
        </div>
        <div className="drawio-dialog-footer">
          <button className="drawio-dialog-btn cancel" onClick={onClose}>{locale === 'zh' ? '取消' : 'Cancel'}</button>
          <button className="drawio-dialog-btn import" onClick={handleImport}>{locale === 'zh' ? '导入' : 'Import'}</button>
        </div>
      </div>
      <style>{`
        .drawio-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .drawio-dialog {
          background: #2d2d2d;
          border-radius: 8px;
          width: 760px;
          max-width: 92%;
          max-height: 85%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .drawio-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #3e3e3e;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .drawio-dialog-close {
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
        }
        .drawio-dialog-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .drawio-dialog-hint {
          color: #999;
          font-size: 13px;
          margin: 0 0 12px 0;
        }
        .drawio-dialog-textarea {
          flex: 1;
          min-height: 320px;
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
        .drawio-dialog-textarea:focus {
          border-color: #007acc;
        }
        .drawio-dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #3e3e3e;
        }
        .drawio-dialog-btn {
          padding: 8px 20px;
          font-size: 13px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .drawio-dialog-btn.cancel {
          background: #3e3e3e;
          color: #d4d4d4;
        }
        .drawio-dialog-btn.import {
          background: #0e639c;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

export default DrawioImportDialog;
