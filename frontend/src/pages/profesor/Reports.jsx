import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, LayoutDashboard, PlusCircle, Users, 
  Monitor, ClipboardList, LogOut, ChevronDown, ChevronUp, 
  FileText, Calendar, User, AlertTriangle, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExam, setExpandedExam] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/Logs/my-exams-logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Gabim gjatë marrjes së raporteve:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Grupimi i shkeljeve sipas titullit të provimit
  const groupedExams = logs.reduce((acc, log) => {
    if (!acc[log.examTitle]) {
      acc[log.examTitle] = {
        title: log.examTitle,
        subject: log.subject,
        incidents: []
      };
    }
    acc[log.examTitle].incidents.push(log);
    return acc;
  }, {});

  const examList = Object.values(groupedExams).filter(exam => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExams = examList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(examList.length / itemsPerPage);

  const toggleExam = (title) => {
    setExpandedExam(expandedExam === title ? null : title);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, backgroundColor: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#0F172A', color: '#94A3B8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ backgroundColor: '#2563EB', padding: '8px', borderRadius: '6px' }}><GraduationCap color="white" size={20} /></div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '19px' }}>ExamGuard</span>
        </div>
        <nav style={{ flex: 1, padding: '20px' }}>
          <SidebarLink icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('/professor')} />
          <SidebarLink icon={PlusCircle} label="Krijo Provim" onClick={() => navigate('/create-exam')} />
          <SidebarLink icon={Monitor} label="Live Monitoring" onClick={() => navigate('/logs')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#2563EB', color: 'white', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px' }}>
            <ClipboardList size={18} /> <span style={{ fontWeight: '600' }}>Raportet (Logs)</span>
          </div>
          <SidebarLink icon={Users} label="Rezultatet" onClick={() => navigate('/results')} />
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #1E293B' }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
            <LogOut size={18} /> Dil nga sistemi
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Arkiva e Raporteve</h1>
            <p style={{ color: '#64748B', marginTop: '8px' }}>Historiku i shkeljeve të klasifikuara sipas provimeve.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} size={18} />
            <input 
              type="text" 
              placeholder="Kërko provimin..." 
              style={{ padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', width: '250px', outline: 'none' }}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Duke ngarkuar të dhënat nga serveri...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentExams.length > 0 ? currentExams.map((exam) => (
              <div key={exam.title} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                
                {/* Header i Dropdown-it */}
                <div 
                  onClick={() => toggleExam(exam.title)}
                  style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedExam === exam.title ? '#F8FAFC' : 'white' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: '#EEF2FF', color: '#4338CA', padding: '10px', borderRadius: '8px' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{exam.title}</h3>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>{exam.subject} • {exam.incidents.length} incidente</span>
                    </div>
                  </div>
                  {expandedExam === exam.title ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                </div>

                {/* Përmbajtja që hapet (Tabela e shkeljeve) */}
                {expandedExam === exam.title && (
                  <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid #F1F5F9' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #EDF2F7' }}>
                          <th style={thStyle}>Studenti</th>
                          <th style={thStyle}>Lloji</th>
                          <th style={thStyle}>Përshkrimi</th>
                          <th style={thStyle}>Koha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.incidents.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                            <td style={tdStyle}><strong>{log.studentName}</strong></td>
                            <td style={tdStyle}>
                              <span style={{ 
                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                                backgroundColor: log.violationType === 'GRAVE' ? '#FEE2E2' : '#FEF3C7',
                                color: log.violationType === 'GRAVE' ? '#B91C1C' : '#92400E'
                              }}>
                                {log.violationType}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              {log.description.split(';').filter(v => v.trim()).map((v, i) => (
                                <div key={i} style={{ 
                                  fontSize: '13px', 
                                  backgroundColor: '#F1F5F9', 
                                  padding: '4px 10px', 
                                  borderRadius: '6px', 
                                  marginBottom: '4px',
                                  display: 'inline-block',
                                  marginRight: '6px',
                                  borderLeft: '3px solid #64748B'
                                }}>
                                  {v.trim()}
                                </div>
                              ))}
                            </td>
                            <td style={tdStyle}>{new Date(log.timestamp).toLocaleString('sq-AL')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
                Nuk u gjet asnjë raport.
              </div>
            )}

            {/* PAGINATION UI */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={paginationButtonStyle}
                >Para</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      ...paginationButtonStyle,
                      backgroundColor: currentPage === i + 1 ? '#2563EB' : 'white',
                      color: currentPage === i + 1 ? 'white' : '#64748B',
                      fontWeight: currentPage === i + 1 ? '800' : '500'
                    }}
                  >{i + 1}</button>
                ))}
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={paginationButtonStyle}
                >Pas</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const paginationButtonStyle = {
  padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', 
  backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', color: '#64748B', transition: 'all 0.2s'
};

const thStyle = { padding: '12px 8px', color: '#64748B', fontSize: '12px', fontWeight: '600' };
const tdStyle = { padding: '16px 8px', fontSize: '14px', color: '#334155' };

const SidebarLink = ({ icon: Icon, label, onClick }) => (
  <div 
    onClick={onClick} 
    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px' }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    <Icon size={18} /> <span style={{ fontSize: '14px' }}>{label}</span>
  </div>
);

export default Reports;
