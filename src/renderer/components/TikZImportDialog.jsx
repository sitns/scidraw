import React, { useState, useRef, useEffect } from 'react';

function TikZImportDialog({ isOpen, onClose, onImport, locale }) {
  const [tikzCode, setTikzCode] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (tikzCode.trim()) {
      onImport(tikzCode);
      setTikzCode('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="tikz-dialog-overlay" onKeyDown={handleKeyDown}>
      <div className="tikz-dialog">
        <div className="tikz-dialog-header">
          <span>{locale === 'zh' ? '导入 TikZ 代码' : 'Import TikZ Code'}</span>
          <button className="tikz-dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="tikz-dialog-body">
          <p className="tikz-dialog-hint">
            {locale === 'zh' 
              ? '请粘贴TikZ代码到下方文本框中，然后点击导入按钮。'
              : 'Paste TikZ code into the text box below, then click Import.'}
          </p>
          <textarea
            ref={textareaRef}
            className="tikz-dialog-textarea"
            value={tikzCode}
            onChange={(e) => setTikzCode(e.target.value)}
            placeholder={locale === 'zh' 
              ? '\\begin{tikzpicture}\n  \\node[draw] (A) at (0,0) {A};\n  \\node[draw] (B) at (3,0) {B};\n  \\draw[->] (A) -- (B);\n\\end{tikzpicture}'
              : '\\begin{tikzpicture}\n  \\node[draw] (A) at (0,0) {A};\n  \\node[draw] (B) at (3,0) {B};\n  \\draw[->] (A) -- (B);\n\\end{tikzpicture}'}
          />
        </div>
        <div className="tikz-dialog-footer">
          <button className="tikz-dialog-btn cancel" onClick={onClose}>
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button className="tikz-dialog-btn import" onClick={handleImport}>
            {locale === 'zh' ? '导入' : 'Import'}
          </button>
        </div>
      </div>
      <style>{`
        .tikz-dialog-overlay {
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
        .tikz-dialog {
          background: #2d2d2d;
          border-radius: 8px;
          width: 600px;
          max-width: 90%;
          max-height: 80%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .tikz-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #3e3e3e;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .tikz-dialog-close {
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .tikz-dialog-close:hover {
          color: #fff;
        }
        .tikz-dialog-body {
          padding: 20px;
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .tikz-dialog-hint {
          color: #999;
          font-size: 13px;
          margin: 0 0 12px 0;
        }
        .tikz-dialog-textarea {
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
        .tikz-dialog-textarea:focus {
          border-color: #007acc;
        }
        .tikz-dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #3e3e3e;
        }
        .tikz-dialog-btn {
          padding: 8px 20px;
          font-size: 13px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .tikz-dialog-btn.cancel {
          background: #3e3e3e;
          color: #d4d4d4;
        }
        .tikz-dialog-btn.cancel:hover {
          background: #4e4e4e;
        }
        .tikz-dialog-btn.import {
          background: #0e639c;
          color: #fff;
        }
        .tikz-dialog-btn.import:hover {
          background: #1177bb;
        }
      `}</style>
    </div>
  );
}

export default TikZImportDialog;
