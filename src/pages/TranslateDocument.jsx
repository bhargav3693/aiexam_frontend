import { useState } from 'react';
import api from '../api/axios';

export default function TranslateDocument() {
  const [file, setFile] = useState(null);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');

  const handleDownload = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translated_${targetLang}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTranslate = async () => {
    if (!file) {
      setTranslateError('Please select a PDF file first.');
      return;
    }
    setTranslateError('');
    setIsTranslating(true);
    setTranslatedText('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', targetLang);
    
    try {
      const { data } = await api.post('/exams/translate-document/', formData);
      setTranslatedText(data.translated_text);
    } catch (err) {
      setTranslateError(err.response?.data?.error || 'Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <main className="page-container animate-fade">
      <div className="page-header">
        <h1>Translate PDF Documents</h1>
        <p className="subtitle">Upload an exam paper or PDF document to translate it into your preferred language instantly.</p>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
        <div className="dash-card" style={{ 
          '--card-gradient': 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(147,51,234,0.1))', 
          '--card-border': 'rgba(168,85,247,0.3)', 
          gridColumn: '1 / -1',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          
          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files[0])} 
                style={{
                  background: 'var(--bg-secondary)', padding: '10px', 
                  borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)'
                }}
              />
              <select 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)', padding: '12px', 
                  borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="German">German</option>
                <option value="Tamil">Tamil</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="English">English</option>
              </select>
              <button 
                onClick={handleTranslate} 
                disabled={isTranslating}
                className="btn btn-primary"
                style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
              >
                {isTranslating ? 'Translating...' : 'Translate to ' + targetLang}
              </button>
            </div>
            
            {translateError && <div style={{ color: '#ef4444', marginTop: '8px' }}>{translateError}</div>}
            
            {translatedText && (
              <div style={{ 
                marginTop: '16px', padding: '16px', background: 'var(--bg-dark)', 
                borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap',
                maxHeight: '400px', overflowY: 'auto', color: 'var(--text-primary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: 'var(--primary)', margin: 0 }}>Translated Text result:</h4>
                  <button onClick={handleDownload} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                    ⬇️ Download Translation
                  </button>
                </div>
                {translatedText}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
