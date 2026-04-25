import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { api } from './services/api';
import { LogOut, Plus, Calendar, MapPin, Trash2, Mail, Lock, Loader2, Sparkles, Inbox } from 'lucide-react';
import { format } from 'date-fns';

type View = 'auth' | 'dashboard';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}

function App() {
  const [view, setView] = useState<View>('auth');
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
              <Sparkles size={40} color="var(--primary)" />
            </div>
            <h1>Event Vault</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {isOtpSent ? 'Enter the code sent to your email' : 'Sign in to manage your events'}
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}

          {!isOtpSent ? (
            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label>Gmail Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>One-Time Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="000000"
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
                {loading ? <div className="spinner"></div> : 'Verify & Login'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsOtpSent(false)} 
                disabled={loading}
                style={{ background: 'transparent', marginTop: '1rem', fontWeight: '400', fontSize: '0.875rem', color: 'var(--text-muted)' }}
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={24} color="var(--primary)" /> My Events
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {loading ? 'Refreshing events...' : `${events.length} upcoming events`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowModal(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Event
          </button>
          <button onClick={handleLogout} style={{ width: 'auto', background: 'var(--glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {loading && events.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={40} className="spinner" style={{ animationDuration: '2s' }} />
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <Inbox size={48} className="empty-state-icon" />
          <h3>No events yet</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Your event vault is empty. Start by creating your first event!</p>
          <button onClick={() => setShowModal(true)} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
            Create First Event
          </button>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Music Festival"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Tell us about the event..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Central Park, NY"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowModal(false)} disabled={loading} style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? <div className="spinner"></div> : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
