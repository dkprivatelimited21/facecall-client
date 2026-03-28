import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, checkRoom } from '../utils/api.js';

export default function HomePage() {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('join'); // 'join' | 'create'

  const handleCreate = async () => {
    if (!userName.trim()) { setError('Please enter your name'); return; }
    setLoading(true); setError('');
    try {
      const { roomId } = await createRoom();
      navigate(`/room/${roomId}`, { state: { userName: userName.trim() } });
    } catch {
      setError('Could not create room. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const id = roomInput.trim().toUpperCase();
    if (!id) { setError('Enter a room code'); return; }
    if (!userName.trim()) { setError('Enter your name'); return; }
    setLoading(true); setError('');
    try {
      const { exists, full } = await checkRoom(id);
      if (!exists) { setError('Room not found. Check the code.'); setLoading(false); return; }
      if (full) { setError('Room is full (max 2 participants).'); setLoading(false); return; }
      navigate(`/room/${id}`, { state: { userName: userName.trim() } });
    } catch {
      setError('Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
      {/* Logo / header */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display text-3xl font-bold tracking-tight text-white">FaceCall</span>
        </div>
        <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">
          Real-time video calls with live AI face filters. Privacy-first, no account required.
        </p>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-6 bg-surface-700 p-1">
          {['join', 'create'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t ? 'bg-brand-600 text-white shadow-md' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t === 'join' ? '🔗 Join Room' : '✨ New Room'}
            </button>
          ))}
        </div>

        {/* Name field */}
        <div className="mb-4">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Your Name</label>
          <input
            type="text"
            placeholder="Enter display name…"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-surface-700 border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition"
            maxLength={30}
          />
        </div>

        {tab === 'join' && (
          <div className="mb-6">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">Room Code</label>
            <input
              type="text"
              placeholder="e.g. A1B2C3D4"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="w-full bg-surface-700 border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition tracking-widest"
              maxLength={8}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          onClick={tab === 'join' ? handleJoin : handleCreate}
          disabled={loading}
          className="btn-neon w-full py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
              </svg>
              {tab === 'join' ? 'Joining…' : 'Creating…'}
            </span>
          ) : tab === 'join' ? 'Join Call →' : 'Create & Start →'}
        </button>

        <div className="mt-6 pt-6 border-t border-white/6 flex items-center justify-between text-xs text-white/30">
          <span>🔒 No account required</span>
          <a href="/api-docs" className="text-brand-400 hover:text-brand-300 transition">API Docs →</a>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex gap-3 mt-8 flex-wrap justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
        {['🎭 Live Face Filters', '🔐 E2E Privacy', '⚡ Low Latency', '📱 Mobile Ready'].map((f) => (
          <span key={f} className="px-3 py-1.5 rounded-full text-xs glass text-white/50 border border-white/6">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
