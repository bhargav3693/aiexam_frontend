import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';

export default function SessionDetails() {
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [showAnswers, setShowAnswers] = useState(true); // Default to true to show answers and explanations immediately for history view

  useEffect(() => {
    api.get(`exams/sessions/${sessionId}/results/`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load session details. It may not exist.');
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner" style={{ margin: '50px auto' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', marginTop: 60 }}>
        <h2 style={{ color: '#ef4444' }}>Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>{error || 'Session not found'}</p>
        <Link to="/history" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>Back to History</Link>
      </div>
    );
  }

  const { score, detailed_results, is_locked_out, violation_count } = data;
  
  const total_questions = detailed_results.length;
  const attempted_count = detailed_results.filter(q => q.user_answer && q.user_answer !== 'Unattempted').length;
  const correct_count = detailed_results.filter(q => q.is_correct).length;
  
  const incorrect_count = attempted_count - correct_count;
  const unattempted_count = total_questions - attempted_count;

  const grade =
    is_locked_out ? { label: 'Exam Void (Violation)', color: '#ef4444' } :
    score >= 90 ? { label: 'Excellent!', color: '#10b981' } :
    score >= 75 ? { label: 'Well Done!', color: '#6366f1' } :
    score >= 60 ? { label: 'Good Effort', color: '#f59e0b' } :
    { label: 'Keep Practicing', color: '#ef4444' };

  const pieData = [
    { name: 'Correct', value: correct_count, color: '#10b981' },
    { name: 'Incorrect', value: incorrect_count > 0 ? incorrect_count : 0, color: '#ef4444' },
    { name: 'Unattempted', value: unattempted_count > 0 ? unattempted_count : 0, color: '#64748b' }
  ].filter(item => item.value > 0);

  const accuracy = attempted_count > 0 ? Math.round((correct_count / attempted_count) * 100) : 0;
  const completion = total_questions > 0 ? Math.round((attempted_count / total_questions) * 100) : 0;

  const barData = [
    { name: 'Score %', value: Math.round(score), fill: '#6366f1' },
    { name: 'Accuracy %', value: accuracy, fill: '#10b981' },
    { name: 'Completed %', value: completion, fill: '#f59e0b' }
  ];

  return (
    <main className="page-container animate-fade" style={{ maxWidth: 900 }}>
      <div className="results-card" style={{ padding: 40 }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1>
            {is_locked_out ? '🛑 Exam Terminated' : '📊 Exam Session Detailed Report'}
          </h1>
          <p className="subtitle">Historical Session #{sessionId} &mdash; Comprehensive Breakdown</p>
        </div>

        {is_locked_out && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: 16, borderRadius: 12, marginBottom: 32, textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontWeight: 600 }}>Lockdown Violation Detected</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
              You violated the exam rules ({violation_count} times). Your score was recorded as-is or voided.
            </p>
          </div>
        )}

        {/* Top Level Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 40 }}>
          <div style={{ textAlign: 'center', padding: 24, background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Final Score</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: grade.color, margin: '8px 0' }}>{Math.round(score)}%</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: grade.color }}>{grade.label}</div>
          </div>

          <div style={{ padding: 24, background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <h3 style={{ fontSize: 14, margin: '0 0 16px 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Question Breakdown</h3>
             <div style={{ width: '100%', height: 160 }}>
               <ResponsiveContainer>
                 <PieChart>
                   <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={4}>
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div style={{ padding: 24, background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: 14, margin: '0 0 16px 0', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center' }}>Performance Metrics</h3>
             <div style={{ width: '100%', height: 160 }}>
               <ResponsiveContainer>
                 <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                   <XAxis type="number" domain={[0, 100]} hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} />
                   <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                   <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Detailed Review Section */}
        {detailed_results.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              📋 Detailed Review & Explanations
            </h2>
            
            <div style={{ display: 'grid', gap: 24 }}>
              {detailed_results.map((q, idx) => {
                const isCorrect = q.is_correct;
                const isUnattempted = !q.user_answer || q.user_answer === 'Unattempted';
                
                const getOptionText = (letter) => {
                   if (letter === 'A') return `A. ${q.option_a}`;
                   if (letter === 'B') return `B. ${q.option_b}`;
                   if (letter === 'C') return `C. ${q.option_c}`;
                   if (letter === 'D') return `D. ${q.option_d}`;
                   return letter;
                };

                return (
                  <div key={idx} style={{ 
                    padding: 24, 
                    borderRadius: 16, 
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.4)' : (isUnattempted ? 'var(--border)' : 'rgba(239, 68, 68, 0.4)')}`,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    {/* Question Header */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                      <span style={{ 
                        background: isCorrect ? '#10b981' : (isUnattempted ? '#64748b' : '#ef4444'), 
                        color: '#fff', 
                        padding: '4px 10px', 
                        borderRadius: 6, 
                        fontSize: 14, 
                        fontWeight: 700,
                        height: 'fit-content',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        Q{idx + 1}
                      </span>
                      <strong style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--text-primary)' }}>{q.text}</strong>
                    </div>

                    {/* Answers Overview */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginLeft: 48, marginBottom: 20 }}>
                      {/* User Answer */}
                      <div>
                        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>Your Answer</div>
                        <div style={{ 
                          padding: '12px 16px', 
                          borderRadius: 10, 
                          background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : (isUnattempted ? 'rgba(255,255,255,0.03)' : 'rgba(239, 68, 68, 0.1)'),
                          color: isCorrect ? '#10b981' : (isUnattempted ? 'var(--text-muted)' : '#ef4444'),
                          border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : (isUnattempted ? 'var(--border)' : 'rgba(239, 68, 68, 0.3)')}`,
                          fontWeight: 500
                        }}>
                          {isUnattempted ? '⚠️ Unattempted' : getOptionText(q.user_answer)}
                        </div>
                      </div>
                      
                      {/* Correct Answer (always show to compare) */}
                      {!isCorrect && (
                        <div>
                          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>Correct Answer</div>
                          <div style={{ 
                            padding: '12px 16px', 
                            borderRadius: 10, 
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontWeight: 500
                          }}>
                            ✓ {getOptionText(q.correct_option)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Insights: Explanations and Tricks */}
                    <div style={{ marginLeft: 48, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: 15, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        💡 Teacher&apos;s Insights
                      </h4>
                      
                      {q.explanation ? (
                        <div style={{ background: 'rgba(99, 102, 241, 0.05)', borderRadius: 10, padding: 16, borderLeft: '4px solid #6366f1', marginBottom: 16 }}>
                          <strong style={{ color: '#818cf8', fontSize: 13, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Explanation</strong>
                          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q.explanation}</p>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>No explanation available for this question.</p>
                      )}

                      {q.trick && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.05)', borderRadius: 10, padding: 16, borderLeft: '4px solid #f59e0b' }}>
                          <strong style={{ color: '#fbbf24', fontSize: 13, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>⚡ Quick Trick</strong>
                          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q.trick}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 48 }}>
          <Link to="/history" className="btn btn-secondary" style={{ padding: '16px 40px', fontSize: 16 }}>
             ← Back to History
          </Link>
        </div>
      </div>
    </main>
  );
}
