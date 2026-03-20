import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function CountdownTimer({ totalSeconds, onExpire }) {
  const [secs, setSecs] = useState(totalSeconds);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [onExpire]);

  const mins = Math.floor(secs / 60);
  const ss = secs % 60;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = secs / totalSeconds;
  const strokeDash = circumference * progress;
  const color = secs < 60 ? '#ef4444' : secs < 300 ? '#f59e0b' : '#6366f1';

  return (
    <div className="timer-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius}
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
        />
      </svg>
      <div className="timer-text">
        <div className="timer-minutes" style={{ color }}>
          {String(mins).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </div>
        <div className="timer-label">left</div>
      </div>
    </div>
  );
}

export default function ExamTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Translation State
  const [targetLang, setTargetLang] = useState('en');
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState({});
  
  // Lockdown Tracking
  const [violations, setViolations] = useState(0);
  const isSubmitting = useRef(false);

  // Fetch Session and Questions
  useEffect(() => {
    Promise.all([
      api.get(`exams/sessions/${id}/`),
      api.get(`exams/sessions/${id}/questions/`)
    ])
      .then(([sessRes, qRes]) => {
        setSession(sessRes.data);
        setQuestions(qRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        navigate('/dashboard');
      });
  }, [id, navigate]);

  // Submission handler
  const submitExam = useCallback(async (forced = false, timeout = false, lockedOut = false) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    
    try {
      const payload = {
        answers,
        violation_count: lockedOut ? violations + 1 : violations,
        is_locked_out: lockedOut
      };
      const { data } = await api.post(`exams/sessions/${id}/submit/`, payload);
      navigate(`/exam/${id}/results`, { state: { result: data, timeout, lockedOut } });
    } catch (err) {
      console.error('Failed to submit exam', err);
      // Fallback
      navigate(`/dashboard`);
    }
  }, [answers, id, navigate, violations]);

  // Lockdown Features
  useEffect(() => {
    if (loading) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      alert("Right-click is disabled during the exam.");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(v => v + 1);
        alert("Warning: You left the exam tab. Your exam will be auto-submitted upon repeated violations.");
        // Immediate lockout on blur/visibility change is very strict. We will auto-submit.
        submitExam(true, false, true);
      }
    };

    const handleBlur = () => {
      submitExam(true, false, true);
    };

    const handleKeyDown = (e) => {
      // Prevent F12, Ctrl+C, Ctrl+V, etc.
      if (e.key === 'F12' || (e.ctrlKey && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);

    // Prompt user before closing tab
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, submitExam]);

  const handleSelect = (idx) => {
    setAnswers((prev) => ({ ...prev, [questions[current].id]: idx })); // Store selected index 0-3
  };

  const handleTranslate = async (question, lang) => {
    setTargetLang(lang);
    if (lang === 'en') return;
    
    const cacheKey = `${question.id}_${lang}`;
    if (translations[cacheKey]) return;

    setTranslating(true);
    try {
      const { data } = await api.post('exams/translate/', { question, language: lang });
      setTranslations(prev => ({ ...prev, [cacheKey]: data }));
    } catch (err) {
      console.error('CRITICAL ERROR: Translation API failed:', err.response?.data || err.message);
      alert("Translation Failed: " + (err.response?.data?.error || err.message));
    } finally {
      setTranslating(false);
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      const nextQ = questions[current + 1];
      setCurrent(current + 1);
      if (targetLang !== 'en') {
        handleTranslate(nextQ, targetLang);
      }
    } else {
      submitExam();
    }
  };

  if (loading || !session) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ marginTop: 20 }}>Setting up secure exam environment...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <h2>No questions could be generated.</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  const q = questions[current];
  const totalQ = questions.length;
  const progress = ((current + 1) / totalQ) * 100;
  const selectedAnswer = answers[q.id];

  const displayQ = (targetLang !== 'en' && translations[`${q.id}_${targetLang}`]) 
    ? translations[`${q.id}_${targetLang}`] 
    : q;

  const options = [displayQ.option_a, displayQ.option_b, displayQ.option_c, displayQ.option_d];

  return (
    <div className="exam-layout" style={{ userSelect: 'none' }}>
      {/* Header */}
      <div className="exam-header">
        <div className="exam-title">
          <span style={{color: '#ef4444', marginRight: 8}}>🔴 LOCKED</span>
          Exam Session #{id}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Question {current + 1} / {totalQ}
          </span>
          <CountdownTimer
            totalSeconds={session.time_limit_minutes * 60}
            onExpire={() => submitExam(true, true, false)}
          />
          <button className="btn btn-danger" onClick={() => submitExam(false, false, false)}>Submit</button>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="page-container" style={{ paddingTop: 0 }}>
        <div className="question-card animate-fade" key={current}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="question-number" style={{ marginBottom: 0 }}>Question {current + 1} of {totalQ}</div>
            
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select 
                value={targetLang} 
                onChange={(e) => handleTranslate(q, e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}
                disabled={translating}
              >
                <option value="en">English (Original)</option>
                <option value="te">Telugu</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="hi">Hindi</option>
                <option value="ar">Arabic</option>
              </select>
              {translating && <span style={{ fontSize: 12, color: 'var(--primary)', fontStyle: 'italic' }}>Translating...</span>}
            </div>
          </div>
          
          {translating ? (
            <div className="question-text" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              ⏳ Loading Translation...
            </div>
          ) : (
            <>
              <div className="question-text">{displayQ.text}</div>
    
              <div className="options-list">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`option-item ${selectedAnswer === idx ? 'selected' : ''}`}
                    onClick={() => handleSelect(idx)}
                  >
                    <div className="option-label">{String.fromCharCode(65 + idx)}</div>
                    <div className="option-text">{opt}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', padding: '13px 28px', marginLeft: 'auto' }}
              onClick={handleNext}
            >
              {current < totalQ - 1 ? 'Next Question →' : 'Finish Exam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
