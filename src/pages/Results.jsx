import { useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Results() {
  const { id } = useParams();
  const { state } = useLocation();

  if (!state || !state.result) {
    return <Navigate to="/dashboard" replace />;
  }

  const { result, timeout, lockedOut } = state;
  const { score, correct_count, total_questions, attempted_count = 0, violation_count, is_locked_out, detailed_results = [] } = result;

  const deg = Math.round((score / 100) * 360);
  const incorrect_count = attempted_count - correct_count;
  const unattempted_count = total_questions - attempted_count;

  const grade =
    is_locked_out || lockedOut ? { label: 'Exam Void (Violation)', color: '#ef4444' } :
    score >= 90 ? { label: 'Excellent!', color: '#10b981' } :
    score >= 75 ? { label: 'Well Done!', color: '#6366f1' } :
    score >= 60 ? { label: 'Good Effort', color: '#f59e0b' } :
    { label: 'Keep Practicing', color: '#ef4444' };

  // Data for Charts
  const pieData = [
    { name: 'Correct', value: correct_count, color: '#10b981' },
    { name: 'Incorrect', value: incorrect_count > 0 ? incorrect_count : 0, color: '#ef4444' },
    { name: 'Unattempted', value: unattempted_count > 0 ? unattempted_count : 0, color: '#64748b' }
  ].filter(item => item.value > 0);

  const accuracy = attempted_count > 0 ? Math.round((correct_count / attempted_count) * 100) : 0;
  const completion = Math.round((attempted_count / total_questions) * 100);

  const barData = [
    { name: 'Score %', value: Math.round(score), fill: '#6366f1' },
    { name: 'Accuracy %', value: accuracy, fill: '#10b981' },
    { name: 'Completed %', value: completion, fill: '#f59e0b' }
  ];

  return (
    <>
      <main className="page-container animate-fade" style={{ maxWidth: 900 }}>
        <div className="results-card" style={{ padding: 40 }}>
          <div className="page-header" style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1>
              {is_locked_out || lockedOut ? '🛑 Exam Terminated' :
               timeout ? '⏰ Time&apos;s Up!' : '📊 Exam Analytics Report'}
            </h1>
            <p className="subtitle">Session #{id} &mdash; Comprehensive Breakdown</p>
          </div>

          {(is_locked_out || lockedOut) && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: 16, borderRadius: 12, marginBottom: 32, textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontWeight: 600 }}>Lockdown Violation Detected</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                You violated the exam rules ({violation_count} times). Your score has been recorded as-is or voided.
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

            {/* Pie Chart */}
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

            {/* Bar Chart */}
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
                📋 Detailed Review
              </h2>
              
              <div style={{ display: 'grid', gap: 20 }}>
                {detailed_results.map((q, idx) => (
                  <div key={idx} style={{ 
                    padding: 24, 
                    borderRadius: 12, 
                    background: q.is_correct ? 'rgba(16, 185, 129, 0.03)' : (q.user_answer === 'Unattempted' ? 'rgba(100, 116, 139, 0.05)' : 'rgba(239, 68, 68, 0.03)'),
                    border: `1px solid ${q.is_correct ? 'rgba(16, 185, 129, 0.2)' : (q.user_answer === 'Unattempted' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(239, 68, 68, 0.2)')}` 
                  }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <span style={{ 
                        background: q.is_correct ? '#10b981' : (q.user_answer === 'Unattempted' ? '#64748b' : '#ef4444'), 
                        color: '#fff', 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 12, 
                        fontWeight: 600,
                        height: 'fit-content'
                      }}>
                        Q{idx + 1}
                      </span>
                      <strong style={{ fontSize: 16, lineHeight: 1.5 }}>{q.text}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginLeft: 44 }}>
                      <div>
                        <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Your Answer</div>
                        <div style={{ 
                          padding: '10px 16px', 
                          borderRadius: 8, 
                          background: q.is_correct ? 'rgba(16, 185, 129, 0.1)' : (q.user_answer === 'Unattempted' ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.1)'),
                          color: q.is_correct ? '#10b981' : (q.user_answer === 'Unattempted' ? 'var(--text-secondary)' : '#ef4444'),
                          border: `1px solid ${q.is_correct ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}`
                        }}>
                          {q.user_answer === 'A' ? `A. ${q.option_a}` :
                           q.user_answer === 'B' ? `B. ${q.option_b}` :
                           q.user_answer === 'C' ? `C. ${q.option_c}` :
                           q.user_answer === 'D' ? `D. ${q.option_d}` : '⚠️ Unattempted'}
                        </div>
                      </div>
                      
                      {!q.is_correct && (
                        <div>
                          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Correct Answer</div>
                          <div style={{ 
                            padding: '10px 16px', 
                            borderRadius: 8, 
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            {q.correct_answer === 'A' ? `A. ${q.option_a}` :
                             q.correct_answer === 'B' ? `B. ${q.option_b}` :
                             q.correct_answer === 'C' ? `C. ${q.option_c}` :
                             q.correct_answer === 'D' ? `D. ${q.option_d}` : q.correct_answer}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 48 }}>
            <Link
              to="/exam/setup"
              className="btn btn-primary"
              style={{ width: 'auto', padding: '16px 40px', fontSize: 16 }}
            >
              Take Another Exam
            </Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '16px 40px', fontSize: 16 }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
