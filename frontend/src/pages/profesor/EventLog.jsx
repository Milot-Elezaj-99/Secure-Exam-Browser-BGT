import React, { useState, useEffect } from 'react';
import {
  GraduationCap, LayoutDashboard, PlusCircle, Users,
  Monitor, ClipboardList, LogOut, Search, Trash2, AlertOctagon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EventLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/Logs/my-exams-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Gabim rrjeti:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDisqualify = async (examId, studentId, studentName) => {
    if (!window.confirm(`A jeni i sigurt që dëshironi ta përjashtoni ${studentName} nga provimi? Ky veprim nuk zhbëhet.`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/Exam/disqualify-student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ examId, studentId })
      });

      if (response.ok) {
        toast.success("Studenti u përjashtua!");
        fetchLogs();
      } else {
        toast.error("Dështoi përjashtimi. Kontrolloni Backend-in.");
      }
    } catch (err) {
      console.error("Gabim:", err);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.isLive && (
      log.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.examTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#2563EB', color: 'white', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px' }}>
            <Monitor size={18} /> <span style={{ fontWeight: '600' }}>Live Monitoring</span>
          </div>
          <SidebarLink icon={ClipboardList} label="Raportet" onClick={() => navigate('/reports')} />
          <SidebarLink icon={Users} label="Rezultatet" onClick={() => navigate('/results')} />
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #1E293B' }}>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', fontSize: '14px' }}>
            <LogOut size={18} /> Dil nga sistemi
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Live Monitoring</h1>
            <p style={{ color: '#64748B', marginTop: '4px' }}>Monitorimi i shkeljeve dhe përjashtimi i studentëve.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Kërko student ose provim..."
              style={{ padding: '12px 15px 12px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', width: '300px', outline: 'none' }}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </header>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>REZULTATET (PIKËT)</th>
                <th style={thStyle}>PROVIMI</th>
                <th style={thStyle}>SHKELJET</th>
                <th style={thStyle}>RREZIKU</th>
                <th style={thStyle}>KOHA</th>
                <th style={thStyle}>VEPRIMET</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Duke ngarkuar të dhënat...</td></tr>
              ) : currentLogs.length > 0 ? (
                currentLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.2s' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', color: '#0F172A' }}>{log.studentName}</span>
                        <span style={{ fontSize: '12px', color: '#2563EB' }}>Nota: {log.score ?? 0}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{log.examTitle}</td>
                    <td style={tdStyle}>
                      {log.description.split(';').filter(v => v.trim()).map((v, i) => (
                        <span key={i} style={{
                          fontSize: '11px', backgroundColor: '#F1F5F9', padding: '2px 8px',
                          borderRadius: '4px', marginRight: '4px', borderLeft: '2px solid #64748B'
                        }}>
                          {v.trim()}
                        </span>
                      ))}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                        backgroundColor: log.violationType === 'GRAVE' ? '#FEE2E2' : '#FEF3C7',
                        color: log.violationType === 'GRAVE' ? '#B91C1C' : '#92400E'
                      }}>{log.violationType}</span>
                    </td>
                    <td style={{ ...tdStyle, color: '#94A3B8' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDisqualify(log.examId, log.studentId, log.studentName)}
                        style={{
                          backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '8px 14px',
                          borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <AlertOctagon size={14} /> Përjashto
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Nuk u gjet asnjë shkelje live.</td></tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION UI */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '20px', borderTop: '1px solid #E2E8F0', backgroundColor: 'white' }}>
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
      </main>
    </div>
  );
};

const paginationButtonStyle = {
  padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0',
  backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', color: '#64748B', transition: 'all 0.2s'
};

const thStyle = { padding: '16px 20px', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '18px 20px', color: '#1E293B', fontSize: '14px' };

const SidebarLink = ({ icon: Icon, label, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', color: '#94A3B8', marginBottom: '4px' }}>
    <Icon size={18} /> <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
  </div>
);

export default EventLogs;