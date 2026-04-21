import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, LayoutDashboard, PlusCircle, 
  Monitor, ClipboardList, LogOut, Bell, User, BookOpen, 
  AlertTriangle, X, FileCheck, Search, Filter, ChevronLeft, 
  ChevronRight, RefreshCw, Users 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

// 1. MODALI I KONFIRMIMIT (I PËRGJITHSHËM)
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Fillo Tani", color = "#2563EB" }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20}/></button>
        </div>
        <p style={{ color: '#64748B', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontWeight: '600', cursor: 'pointer' }}>Anulo</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: color, color: 'white', fontWeight: '600', cursor: 'pointer' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// 2. MODALI PËR RESETIMIN E STUDENTËVE (RITAKE)
const ManageStudentsModal = ({ isOpen, onClose, examId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Exam/${examId}/students-status`);
      setStudents(res.data);
    } catch (err) { console.error("Gabim gjatë marrjes së studentëve:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isOpen && examId) fetchStudents();
  }, [isOpen, examId]);

  const handleResetStudent = async (studentId) => {
    if (!window.confirm("A jeni i sigurt? Kjo do t'i lejojë studentit të hyjë përsëri në provim nga fillimi.")) return;
    try {
      await api.post(`/Exam/reset-student-attempt`, { examId, studentId });
      fetchStudents(); // Refresh listën pas resetit
    } catch (err) { console.error(err); }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '600px', borderRadius: '16px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '800', margin: 0 }}>Menaxho Aksesin e Studentëve</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
        </div>
        
        {loading ? <p>Duke u ngarkuar...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {students.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8' }}>Nuk ka studentë që kanë nisur provimin.</p>}
            {students.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '10px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700' }}>{s.fullName}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Statusi: {s.isFinished ? 'Përfunduar' : 'Në proces / I bllokuar'}</div>
                </div>
                <button 
                  onClick={() => handleResetStudent(s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F59E0B', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                >
                  <RefreshCw size={14} /> Lejo Ritake
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 3. COMPONENTI KRYESOR
const ProfessorDashboard = () => {
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({ activeExams: 0, totalStudents: 0, liveMonitoring: 0, violations: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modalData, setModalData] = useState({ isOpen: false, examId: null });
  const [manageModal, setManageModal] = useState({ isOpen: false, examId: null });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const examsPerPage = 8;

  const isFetching = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
        clearInterval(timer);
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const [examRes, logRes] = await Promise.all([
        api.get('/Exam/my-exams'),
        api.get('/Logs/my-exams-logs')
      ]);

      const examData = examRes.data;
      const logData = logRes.data;
      
      examData.sort((a, b) => (b.id || b.Id) - (a.id || a.Id));
      setExams(examData);
      
      const liveCount = examData.filter(e => getExamStatus(e).status === 'LIVE').length;
      setStats({
        activeExams: examData.length,
        totalStudents: [...new Set(logData.map(l => l.studentId))].length,
        liveMonitoring: liveCount,
        violations: logData.filter(l => l.violationType === "GRAVE").length
      });
    } catch (err) { 
        console.error(err); 
        if (err.response?.status === 401) navigate('/login');
    }
    finally { setLoading(false); isFetching.current = false; }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getExamStatus = (exam) => {
    const startTimeRaw = exam.startTime || exam.StartTime;
    const duration = exam.duration || exam.Duration || 0;
    if (!startTimeRaw || startTimeRaw.startsWith('0001-01-01')) return { status: 'READY' };
    let start = new Date(startTimeRaw.endsWith('Z') ? startTimeRaw : startTimeRaw + 'Z');
    const end = new Date(start.getTime() + duration * 60000);
    if (currentTime < start) return { status: 'READY' };
    if (currentTime >= start && currentTime <= end) {
      const diff = end - currentTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return { status: 'LIVE', timeLeft: `${mins}:${secs < 10 ? '0' : ''}${secs}` };
    }
    return { status: 'FINISHED' };
  };

  const handleStartExam = async () => {
    const examId = modalData.examId;
    setModalData({ isOpen: false, examId: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/Exam/start/${examId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredExams = exams.filter(exam => {
    const title = (exam.title || exam.Title || "").toLowerCase();
    const subject = (exam.subject || exam.Subject || "").toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || subject.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || getExamStatus(exam).status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentExams = filteredExams.slice((currentPage - 1) * examsPerPage, currentPage * examsPerPage);
  const totalPages = Math.ceil(filteredExams.length / examsPerPage);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: '#64748B' }}>Duke ngarkuar...</div>;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, backgroundColor: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#0F172A', color: '#94A3B8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ backgroundColor: '#2563EB', padding: '8px', borderRadius: '6px' }}><GraduationCap color="white" size={20} /></div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '19px' }}>ExamGuard</span>
        </div>
        <nav style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <SidebarLink icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('/professor')} active />
          <SidebarLink icon={PlusCircle} label="Krijo Provim" onClick={() => navigate('/create-exam')} />
          <SidebarLink icon={Monitor} label="Live Monitoring" onClick={() => navigate('/logs')} />
          <SidebarLink icon={ClipboardList} label="Raportet (Logs)" onClick={() => navigate('/reports')} />
          <SidebarLink icon={FileCheck} label="Rezultatet" onClick={() => navigate('/results')} />
          <div style={{ marginTop: 'auto', borderTop: '1px solid #1E293B', paddingTop: '15px' }}>
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', fontSize: '14px', padding: '12px' }}>
              <LogOut size={18} /> Dil nga sistemi
            </button>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{ height: '64px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ color: '#64748B', fontSize: '14px' }}>Paneli i Profesorit</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Bell size={20} color="#94A3B8" />
            <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    style={{ width: '32px', height: '32px', backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <User size={16} color="white" />
                </div>
                
                {showProfileDropdown && (
                    <div style={{ position: 'absolute', top: '45px', right: 0, width: '220px', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', overflow: 'hidden', zIndex: 100 }}>
                        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ width: '48px', height: '48px', margin: '0 auto 10px auto', backgroundColor: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={24} color="#2563EB" />
                            </div>
                            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '15px' }}>{localStorage.getItem('username') || 'Profesor'}</div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{localStorage.getItem('role') || 'PROFESSOR'}</div>
                        </div>
                        <div>
                            <button 
                                onClick={() => { localStorage.clear(); navigate('/login'); }}
                                style={{ width: '100%', padding: '12px', border: 'none', backgroundColor: '#FFF1F2', color: '#E11D48', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}
                            >
                                <LogOut size={16} /> Dil nga llogaria
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Mirëseerdhët!</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '32px' }}>
            <StatCard icon={BookOpen} label="Provime" value={stats.activeExams} color="#2563EB" />
            <StatCard icon={FileCheck} label="Rezultatet" value={stats.totalStudents} color="#10B981" onClick={() => navigate('/results')} />
            <StatCard icon={Monitor} label="LIVE" value={stats.liveMonitoring} color="#06B6D4" onClick={() => navigate('/logs')} />
            <StatCard icon={AlertTriangle} label="Shkelje" value={stats.violations} color="#EF4444" onClick={() => navigate('/reports')} />
          </div>

          <div style={{ marginTop: '40px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontWeight: '800', fontSize: '18px' }}>Provimet tuaja</span>
                <button onClick={() => navigate('/create-exam')} style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>+ Krijo të ri</button>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                  <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Kërko me titull ose lëndë..." 
                    value={searchTerm}
                    onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                    style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '4px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <Filter size={16} color="#64748B" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => {setStatusFilter(e.target.value); setCurrentPage(1);}}
                    style={{ border: 'none', backgroundColor: 'transparent', padding: '6px', fontSize: '14px', outline: 'none', cursor: 'pointer', color: '#64748B', fontWeight: '500' }}
                  >
                    <option value="ALL">Gjithë Statuset</option>
                    <option value="LIVE">Live</option>
                    <option value="READY">Gati</option>
                    <option value="FINISHED">Përfunduar</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div style={{ minHeight: '300px' }}>
              {currentExams.length > 0 ? currentExams.map((exam) => {
                const { status, timeLeft } = getExamStatus(exam);
                const exId = exam.id || exam.Id;
                return (
                  <div key={exId} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{exam.title || exam.Title}</div>
                      <div style={{ fontSize: '13px', color: '#64748B' }}>{exam.subject || 'Lënda'} • {exam.code || 'Kodi'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {status === 'READY' && (
                        <button 
                          onClick={() => setModalData({ isOpen: true, examId: exId })} 
                          style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                        >Fillo</button>
                      )}
                      {(status === 'LIVE' || status === 'FINISHED') && (
                        <button 
                          onClick={() => setManageModal({ isOpen: true, examId: exId })} 
                          title="Menaxho studentët (Ritake)"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                        >
                          <Users size={16} /> Aksesi
                        </button>
                      )}
                      {status === 'LIVE' && (
                        <div style={{ backgroundColor: '#F0FDF4', color: '#16A34A', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', backgroundColor: '#16A34A', borderRadius: '50%' }}></span>
                          LIVE: {timeLeft}
                        </div>
                      )}
                      <button 
                        onClick={() => navigate('/results')} 
                        style={{ border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: 'white', color: '#475569' }}
                      >Rezultatet</button>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Nuk u gjet asnjë provim.</div>
              )}
            </div>

            {/* PAGINATION UI */}
            {totalPages > 1 && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
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
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={paginationButtonStyle}
                    >Pas</button>
                </div>
            )}
          </div>
        </div>
      </main>

      {/* MODALET */}
      <ConfirmModal 
        isOpen={modalData.isOpen} 
        onClose={() => setModalData({ isOpen: false, examId: null })}
        onConfirm={handleStartExam}
        title="Nis Provimin?"
        message="Studentët do të mund të hyjnë menjëherë në provim."
      />

      <ManageStudentsModal 
        isOpen={manageModal.isOpen}
        examId={manageModal.examId}
        onClose={() => setManageModal({ isOpen: false, examId: null })}
      />
    </div>
  );
};

const SidebarLink = ({ icon: Icon, label, onClick, active }) => (
  <div 
    onClick={onClick} 
    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', transition: 'background 0.2s', backgroundColor: active ? '#2563EB' : 'transparent', color: active ? 'white' : '#94A3B8' }}
  >
    <Icon size={18} /> <span style={{ fontSize: '14px', fontWeight: active ? '600' : '400' }}>{label}</span>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div 
    onClick={onClick} 
    style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '18px', cursor: onClick ? 'pointer' : 'default' }}
  >
    <div style={{ backgroundColor: `${color}10`, padding: '12px', borderRadius: '12px', color: color }}><Icon size={26} /></div>
    <div><div style={{ fontSize: '22px', fontWeight: '800' }}>{value}</div><div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>{label}</div></div>
  </div>
);

const paginationButtonStyle = {
    padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', color: '#64748B', transition: 'all 0.2s'
};

export default ProfessorDashboard;