import React from 'react';
import { t } from '../utils/i18n';

function WelcomeScreen({ locale, onLocaleChange, onClose, onTryExample }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-header">
        <div className="welcome-lang">
          <select 
            value={locale} 
            onChange={(e) => onLocaleChange(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="zh" style={{ color: '#000' }}>中文</option>
            <option value="en" style={{ color: '#000' }}>English</option>
          </select>
        </div>
      </div>

      <div className="welcome-content">
        <h1 className="welcome-title">{t('welcome.title', locale)}</h1>
        <p className="welcome-subtitle">{t('welcome.subtitle', locale)}</p>
        <p className="welcome-desc">{t('welcome.description', locale)}</p>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>{t('welcome.features.codeEditor.title', locale)}</h3>
            <p>{t('welcome.features.codeEditor.desc', locale)}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>{t('welcome.features.visualEditor.title', locale)}</h3>
            <p>{t('welcome.features.visualEditor.desc', locale)}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>{t('welcome.features.export.title', locale)}</h3>
            <p>{t('welcome.features.export.desc', locale)}</p>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={onTryExample}>
            {t('welcome.tryIt', locale)}
          </button>
          <button className="welcome-btn" onClick={onClose}>
            {t('welcome.skip', locale)}
          </button>
        </div>
      </div>

      <style>{`
        .welcome-screen {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #5c6bc0 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          position: relative;
        }

        .welcome-header {
          position: absolute;
          top: 20px;
          right: 20px;
        }

        .welcome-content {
          text-align: center;
          max-width: 700px;
          padding: 40px;
        }

        .welcome-title {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .welcome-subtitle {
          font-size: 24px;
          font-weight: 300;
          opacity: 0.9;
          margin-bottom: 16px;
        }

        .welcome-desc {
          font-size: 16px;
          opacity: 0.8;
          margin-bottom: 40px;
        }

        .welcome-features {
          display: flex;
          gap: 24px;
          margin-bottom: 48px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .feature-card {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 24px;
          width: 200px;
          backdrop-filter: blur(10px);
          transition: transform 0.3s, background 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.2);
        }

        .feature-icon {
          font-size: 36px;
          margin-bottom: 12px;
        }

        .feature-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .feature-card p {
          font-size: 13px;
          opacity: 0.8;
          line-height: 1.5;
        }

        .welcome-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .welcome-btn {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 500;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .welcome-btn.primary {
          background: #fff;
          color: #1a237e;
        }

        .welcome-btn.primary:hover {
          background: #f0f0f0;
          transform: scale(1.02);
        }

        .welcome-btn:not(.primary) {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }

        .welcome-btn:not(.primary):hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}

export default WelcomeScreen;
