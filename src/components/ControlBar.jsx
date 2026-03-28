export default function ControlBar({
  audioEnabled, videoEnabled, filterEnabled, filterPanelOpen,
  onToggleAudio, onToggleVideo, onToggleFilter, onOpenFilterPanel, onLeave,
}) {
  return (
    <div className="sticky bottom-0 z-20 px-4 py-4 flex items-center justify-center gap-3 glass border-t border-white/6">
      {/* Mic */}
      <button
        onClick={onToggleAudio}
        className={`ctrl-btn ${!audioEnabled ? 'bg-red-500/20 border-red-500/40' : ''}`}
        title={audioEnabled ? 'Mute' : 'Unmute'}
      >
        {audioEnabled ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Camera */}
      <button
        onClick={onToggleVideo}
        className={`ctrl-btn ${!videoEnabled ? 'bg-red-500/20 border-red-500/40' : ''}`}
        title={videoEnabled ? 'Stop Camera' : 'Start Camera'}
      >
        {videoEnabled ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Face filter */}
      <button
        onClick={onOpenFilterPanel}
        className={`ctrl-btn ${filterEnabled ? 'active' : ''} ${filterPanelOpen ? 'ring-2 ring-brand-500/50' : ''}`}
        title="Face Filter"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8"/>
          <path d="M9 8h.01M15 8h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9.5 11s.5 1.5 2.5 1.5 2.5-1.5 2.5-1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Screen share placeholder */}
      <button
        className="ctrl-btn opacity-40 cursor-not-allowed"
        title="Screen share (coming soon)"
        disabled
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="white" strokeWidth="1.8"/>
          <path d="M8 21h8M12 17v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M10 10l2-2 2 2M12 8v5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Leave */}
      <button
        onClick={onLeave}
        className="ctrl-btn danger ml-2"
        title="Leave call"
        style={{ width: 56 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 012 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.19 19.79 19.79 0 01.36 0.56 2 2 0 012.35 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.32 7.91a16 16 0 004.36 5.4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
