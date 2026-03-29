import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function ExamSetup() {
  const [topics, setTopics] = useState([
    { id: 1, name: 'Quantitative Aptitude', difficulty: 'hard', icon: '🧮' },
    { id: 2, name: 'General Intelligence & Reasoning', difficulty: 'hard', icon: '🧩' },
    { id: 3, name: 'General Awareness', difficulty: 'medium', icon: '🌍' },
    { id: 4, name: 'Current Affairs', difficulty: 'medium', icon: '📰' },
    { id: 5, name: 'Indian History & Culture', difficulty: 'easy', icon: '🏺' },
    { id: 6, name: 'Geography of India & World', difficulty: 'medium', icon: '🗺️' },
    { id: 7, name: 'General Science (Physics, Chem, Bio)', difficulty: 'medium', icon: '🧪' },
    { id: 8, name: 'Indian Polity & Constitution', difficulty: 'medium', icon: '🏛️' },
    { id: 9, name: 'Indian Economy', difficulty: 'medium', icon: '📈' },
    { id: 10, name: 'Computer & Application Basics', difficulty: 'easy', icon: '💻' },
    { id: 11, name: 'Static GK', difficulty: 'easy', icon: '📚' },
    { id: 12, name: 'Data Interpretation', difficulty: 'hard', icon: '📊' }
  ]);
  const [selected, setSelected] = useState([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   api.get('exams/topics/')
  //     .then(({ data }) => setTopics(data))
  //     .catch(() => setError('Failed to load topics.'))
  //     .finally(() => setLoading(false));
  // }, []);

  const toggleTopic = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    if (selected.length === 0) {
      setError('Please select at least one topic.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const selectedNames = selected.map(id => topics.find(t => t.id === id)?.name).filter(Boolean);
      
      // Explicitly pull token for bulletproof auth injection
      const token = localStorage.getItem('access');
      
      const { data } = await api.post('exams/force-start/', {
        topic_names: selectedNames, // Backend God Mode handles names better
        topic_ids: selected,
        time_limit_minutes: timeLimit,
        language: language,
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // God Mode backend returns 200+{error} on failure, 201+{id} on success
      if (data.error) {
        console.error('BACKEND ERROR:', data.error);
        
        if (data.error.includes('429') || data.error.includes('RESOURCE_EXHAUSTED')) {
          setError('Server is busy or API quota reached. Please wait 1 minute and try again.');
        } else {
          setError(`Backend error: ${data.error}`);
        }
        return;
      }

      navigate(`/exam/${data.id}`);
    } catch (err) {
      console.error('API CALL FAILED:', err.response?.data);
      
      const djangoDetail = err.response?.data?.detail;
      const djangoErrors = err.response?.data;
      
      if (err.response?.status === 429 || (typeof djangoDetail === 'string' && djangoDetail.includes('429'))) {
        setError('Server is busy or API quota reached. Please wait for 1 minute and try again.');
      } else if (djangoDetail) {
        setError(djangoDetail);
      } else if (djangoErrors && typeof djangoErrors === 'object') {
        // Flatten all field errors into a readable string
        const msg = Object.entries(djangoErrors)
          .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join(' | ');
        setError(msg || 'Failed to create exam session.');
      } else {
        setError('Failed to create exam session.');
      }
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <>
      <main className="page-container animate-fade" style={{ overflowX: 'hidden' }}>
        <div className="page-header">
          <h1>Set Up Your Exam</h1>
          <p className="subtitle">Choose topics and set a time limit to begin</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="section-title">Select Topics</div>
        <div className="topics-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
          {topics && topics.length > 0 ? (
            topics.map((topic) => (
              <div
                key={topic.id || topic.name}
                id={`topic-${topic.id || topic.name}`}
                className={`topic-chip${selected.includes(topic.id) ? ' selected' : ''}`}
                onClick={() => toggleTopic(topic.id)}
                role="checkbox"
                aria-checked={selected.includes(topic.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleTopic(topic.id)}
              >
                <div className="topic-icon" style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)' }}>{topic.icon}</div>
                <div className="topic-name">{topic.name}</div>
                {topic.difficulty && (
                  <div className="topic-meta">
                    <span className={`badge badge-${topic.difficulty}`}>
                      {DIFFICULTY_LABELS[topic.difficulty]}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Loading topics...</p>
          )}
        </div>

        <div className="section-title">Exam Language</div>
        <div style={{ marginBottom: 30 }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 16 }}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
            <option value="Marathi">Marathi (मराठी)</option>
            <option value="Bengali">Bengali (বাংলা)</option>
            <option value="Gujarati">Gujarati (ગુજરાતી)</option>
            <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
            <option value="Malayalam">Malayalam (മലയാളം)</option>
            <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
            <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="Urdu">Urdu (اردو)</option>
          </select>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>The AI will generate all questions directly in this language.</p>
        </div>

        <div className="section-title">Time Limit</div>
        <div className="time-control">
          <label>Set your exam duration</label>
          <div className="time-display">
            {timeLimit}<span>min</span>
          </div>
          <input
            id="time-slider"
            type="range"
            min={5} max={120} step={5}
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>5 min</span><span>120 min</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            id="start-exam-btn"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '15px 40px' }}
            onClick={handleStart}
            disabled={submitting || selected.length === 0}
          >
            {submitting ? 'Starting…' : `Start Exam (${selected.length} topic${selected.length !== 1 ? 's' : ''})`}
          </button>
          {selected.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setSelected([])}>
              Clear selection
            </button>
          )}
        </div>
      </main>
    </>
  );
}
