import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { api } from './services/api';
import { LogOut, Plus, Calendar, MapPin, Trash2, Mail, Lock, Loader2, Sparkles, Inbox, MessageSquare, LayoutDashboard, Users, Trophy } from 'lucide-react';
import { format } from 'date-fns';

type View = 'auth' | 'dashboard';
type Tab = 'events' | 'participants' | 'achievements';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

function App() {
  const [view, setView] = useState<View>('auth');
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '' });

  useEffect(() => {
    if (token) {
      setView('dashboard');
      fetchEvents(token);
    }
  }, [token]);

  const fetchEvents = async (authToken: string) => {
    setLoading(true);
    try {
      const data = await api.getEvents(authToken);
      setEvents(data);
    } catch (err) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.requestOtp(email);
      setIsOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.verifyOtp(email, otp);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('auth');
    setIsOtpSent(false);
    setEmail('');
    setOtp('');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await api.createEvent(token, newEvent);
      setShowModal(false);
      setNewEvent({ title: '', description: '', date: '', location: '' });
      fetchEvents(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.deleteEvent(token, id);
      fetchEvents(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (view === 'auth') {
    return (
      <div className="auth-container">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="auth-card">
          <div className="auth-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '1rem' }}>
                <Lock size={40} color="var(--primary)" />
              </div>
            </div>
            <h1>Event Vault</h1>
            <p style={{ color: 'var(--text-muted)' }}>Organizer Login Portal</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}

          {!isOtpSent ? (
            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label>Institutional Gmail</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    placeholder="organizer@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Send Login Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>Verification Code</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Verify & Access Dashboard'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsOtpSent(false)} 
                disabled={loading}
                style={{ background: 'transparent', marginTop: '1rem', fontWeight: '400', fontSize: '0.875rem', color: 'var(--text-muted)' }}
              >
                Change Email Address
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="branding-header">
        <p className="institution-name">B.V.V. Sangha's BGMIT, Bagalkot</p>
        <h1 className="event-title-main">SIDDHISOPANAM 2K26</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <span style={{ padding: '0.25rem 1rem', background: 'var(--glass)', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600' }}>
            🚀 POWERED BY EVENT VAULT
          </span>
          <span style={{ padding: '0.25rem 1rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
            ✓ ORGANIZER VERIFIED
          </span>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="tab-nav">
          <div className={`tab-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            📅 My Events
          </div>
          <div className={`tab-item ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>
            👥 Participants
          </div>
          <div className={`tab-item ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>
            🏆 Achievements
          </div>
        </div>

        {activeTab === 'events' && (
          <>
            <div className="action-grid">
              <div className="action-card" onClick={() => setShowModal(true)}>
                <div className="action-icon">➕</div>
                <div className="action-label">Create New Event</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Launch a new activity or competition</p>
              </div>
              <div className="action-card">
                <div className="action-icon">⌛</div>
                <div className="action-label">Past Events</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View history and final results</p>
              </div>
              <div className="action-card" onClick={handleLogout}>
                <div className="action-icon">🔑</div>
                <div className="action-label">Sign Out</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Securely exit organizer session</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Active Event Catalog</h2>
              <button onClick={() => fetchEvents(token!)} className="btn-content" style={{ width: 'auto', background: 'var(--glass)', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <LayoutDashboard size={16} /> Refresh Data
              </button>
            </div>

            {loading && events.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 size={40} className="spinner" />
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <Inbox size={48} className="empty-state-icon" />
                <h3>No Active Events</h3>
                <p style={{ marginTop: '0.5rem' }}>Your event catalog is currently empty.</p>
              </div>
            ) : (
              <div className="event-grid">
                {events.map((event) => (
                  <div key={event.id} className="event-card glass-panel">
                    <h2 className="event-title">{event.title}</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9375rem' }}>{event.description}</p>
                    <div className="event-details">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} /> {format(new Date(event.date), 'PPP p')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} /> {event.location}
                      </span>
                    </div>
                    <div className="event-actions">
                      <button onClick={() => handleDeleteEvent(event.id)} className="btn-danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'participants' && (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <h3>Participant Records</h3>
            <p>Select an event to view registered participants and volunteers.</p>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="empty-state">
            <Trophy size={48} className="empty-state-icon" />
            <h3>Hall of Fame</h3>
            <p>Leaderboards and winners will appear here after event completion.</p>
          </div>
        )}
      </div>

      <button className="chatbot-fab" title="EventVault AI Chatbot">
        🤖
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Event Configuration</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Activity Title</label>
                <input
                  type="text"
                  placeholder="Enter event name"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Detailed Description</label>
                <input
                  type="text"
                  placeholder="Rules, requirements, or agenda..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Schedule (Date & Time)</label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Auditorium"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button type="submit">Publish Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
