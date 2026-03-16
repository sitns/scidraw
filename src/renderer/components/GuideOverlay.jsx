import React, { useState, useEffect } from 'react';
import { t } from '../utils/i18n';

function GuideOverlay({ locale, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { key: 'step1', highlight: 'editor' },
    { key: 'step2', highlight: 'canvas' },
    { key: 'step3', highlight: 'canvas' },
    { key: 'step4', highlight: 'toolbar' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const step = steps[currentStep];
  const totalSteps = steps.length;

  return (
    <div className="guide-overlay">
      <div className="guide-content">
        <div className="guide-header">
          <span className="guide-step-badge">
            {currentStep + 1} / {totalSteps}
          </span>
          <button className="guide-close" onClick={onClose}>×</button>
        </div>

        <div className="guide-body">
          <h3 className="guide-title">{t(`guide.${step.key}.title`, locale)}</h3>
          <p className="guide-text">{t(`guide.${step.key}.content`, locale)}</p>
        </div>

        <div className="guide-footer">
          <div className="guide-dots">
            {steps.map((_, i) => (
              <span 
                key={i} 
                className={`guide-dot ${i === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(i)}
              />
            ))}
          </div>
          
          <div className="guide-buttons">
            <button 
              className="guide-btn secondary" 
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              {locale === 'zh' ? '上一步' : 'Previous'}
            </button>
            <button className="guide-btn primary" onClick={handleNext}>
              {currentStep === totalSteps - 1 
                ? (locale === 'zh' ? '完成' : 'Done')
                : (locale === 'zh' ? '下一步' : 'Next')
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .guide-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .guide-content {
          background: #2d2d2d;
          border-radius: 16px 16px 0 0;
          width: 100%;
          max-width: 500px;
          padding: 24px;
          color: #fff;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .guide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .guide-step-badge {
          background: #007acc;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .guide-close {
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .guide-close:hover {
          color: #fff;
        }

        .guide-body {
          margin-bottom: 24px;
        }

        .guide-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .guide-text {
          font-size: 14px;
          color: #aaa;
          line-height: 1.6;
        }

        .guide-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .guide-dots {
          display: flex;
          gap: 8px;
        }

        .guide-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #555;
          cursor: pointer;
          transition: background 0.2s;
        }

        .guide-dot.active {
          background: #007acc;
        }

        .guide-dot:hover:not(.active) {
          background: #777;
        }

        .guide-buttons {
          display: flex;
          gap: 12px;
        }

        .guide-btn {
          padding: 8px 20px;
          font-size: 14px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .guide-btn.primary {
          background: #007acc;
          color: #fff;
        }

        .guide-btn.primary:hover {
          background: #0098ff;
        }

        .guide-btn.secondary {
          background: #3e3e3e;
          color: #fff;
        }

        .guide-btn.secondary:hover:not(:disabled) {
          background: #4e4e4e;
        }

        .guide-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default GuideOverlay;
