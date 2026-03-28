export default function RoomInfo({ roomId, status, statusLabel, copied, onCopy }) {
  const statusColors = {
    connecting: 'text-yellow-400',
    waiting: 'text-blue-400',
    'in-call': 'text-green-400',
    ended: 'text-red-400',
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={onCopy}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition group"
        title="Copy room link"
      >
        <span className="font-mono text-sm font-bold text-white/80 tracking-widest">{roomId}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/30 group-hover:text-white/60 transition">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
        </svg>
        {copied && <span className="text-green-400 text-xs">Copied!</span>}
      </button>
      <p className={`text-[10px] ${statusColors[status] || 'text-white/40'}`}>{statusLabel}</p>
    </div>
  );
}
