import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/forgot-password`, { 
                email: email 
            });
            setMessage(response.data.message || "Instruksionet u dërguan!");
            setEmail('');
        } catch (err) {
            setError(err.response?.data || "Ndodhi një gabim gjatë dërgimit.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Logo Section */}
            <div style={styles.logoWrapper}>
                <div style={styles.logoIcon}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                    </svg>
                </div>
                <h1 style={styles.brandTitle}>ExamGuard</h1>
            </div>

            {/* Card Section */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Rivendos fjalëkalimin</h2>
                <p style={styles.cardSubtitle}>
                    Shkruaj email-in tënd për të marrë linkun
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            placeholder="email@shembull.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    {message && <div style={styles.success}>{message}</div>}
                    {error && <div style={styles.error}>{error}</div>}

                    <button 
                        type="submit" 
                        disabled={loading} 
                        style={loading ? styles.buttonDisabled : styles.button}
                    >
                        {loading ? "Duke u dërguar..." : "Dërgo linkun"}
                    </button>
                </form>

                <div style={styles.footer}>
                    <Link to="/login" style={styles.link}>
                        <span style={{marginRight: '8px'}}>←</span> Kthehu te hyrja
                    </Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F8F9FB', // Sfondi i lehtë si në foto
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    logoWrapper: {
        textAlign: 'center',
        marginBottom: '24px'
    },
    logoIcon: {
        backgroundColor: '#2563EB',
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto 12px auto',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    brandTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        margin: 0
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid #F3F4F6'
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '8px',
        textAlign: 'left'
    },
    cardSubtitle: {
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '24px',
        textAlign: 'left'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        fontSize: '14px',
        backgroundColor: '#F9FAFB', // Ngjyra e inputit si në foto
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    button: {
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#2563EB',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '8px'
    },
    buttonDisabled: {
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#93C5FD',
        color: '#ffffff',
        cursor: 'not-allowed',
        marginTop: '8px'
    },
    footer: {
        marginTop: '24px',
        textAlign: 'center'
    },
    link: {
        color: '#2563EB',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center'
    },
    success: { color: '#065F46', fontSize: '13px', backgroundColor: '#D1FAE5', padding: '10px', borderRadius: '6px' },
    error: { color: '#991B1B', fontSize: '13px', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '6px' }
};

export default ForgotPassword;
