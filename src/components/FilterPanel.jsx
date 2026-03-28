import { useRef, useState } from 'react';

const SAMPLE_FILTERS = [
  { id: 'cat', label: 'Cat', emoji: '🐱', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cat&backgroundColor=ffd5dc' },
  { id: 'robot', label: 'Robot', emoji: '🤖', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot1&backgroundColor=b6e3f4' },
  { id: 'alien', label: 'Alien', emoji: '👽', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=alien&backgroundColor=c0aede' },
  { id: 'ninja', label: 'Ninja', emoji: '🥷', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ninja&backgroundColor=d1d4f9' },
];

export default function FilterPanel({
  filterEnabled, blurBg, overlayImage, faceEngineReady, faceDetected,
  onToggleFilter, onToggleBlur, onImageUpload, onClose,
}) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedSample, setSelectedSample] = useState(null);

  const handleFile = (file) => {
    setUploadError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, PNG, WEBP supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Max file size: 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageUpload(e.target.result);
      setSelectedSample(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSample = (sample) => {
    setSelectedSample(sample.id);
    // Convert SVG URL to dataURL
    fetch(sample.url)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => onImageUpload(e.target.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => setUploadError('Failed to load preset filter'));
  };

  return (
    <div className="glass border-t border-white/6 px-4 py-5 animate-slide-up">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <span>🎭</span> Face Filter Settings
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition text-lg leading-none">×</button>
        </div>

        {!faceEngineReady && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs flex items-center gap-2">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
            </svg>
            Loading AI face engine…
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Upload */}
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-2">Upload Face Image</p>
            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/10 hover:border-brand-500/40 hover:bg-white/3'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {overlayImage && !selectedSample ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={overlayImage} alt="Overlay" className="w-16 h-16 rounded-full object-cover border-2 border-brand-500/50" />
                  <p className="text-xs text-white/50">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/30">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-xs text-white/40">Drop image or click<br/><span className="text-white/20">JPG · PNG · WEBP · max 10MB</span></p>
                </div>
              )}
            </div>
            {uploadError && <p className="text-red-400 text-xs mt-1.5">{uploadError}</p>}
          </div>

          {/* Right: Presets + toggles */}
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-2">Quick Presets</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {SAMPLE_FILTERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSample(s)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                    selectedSample === s.id
                      ? 'border-brand-500 bg-brand-500/20'
                      : 'border-white/8 hover:border-white/20 bg-white/3'
                  }`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-[10px] text-white/50">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-700 border border-white/6">
                <div>
                  <p className="text-xs font-medium text-white">Face Filter</p>
                  <p className="text-[10px] text-white/30">Overlay uploaded face</p>
                </div>
                <Toggle value={filterEnabled} onChange={onToggleFilter} disabled={!overlayImage || !faceEngineReady} />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-700 border border-white/6">
                <div>
                  <p className="text-xs font-medium text-white">Blur Background</p>
                  <p className="text-[10px] text-white/30">Bokeh effect around face</p>
                </div>
                <Toggle value={blurBg} onChange={onToggleBlur} disabled={!faceEngineReady} />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        {faceEngineReady && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`status-dot ${faceDetected ? 'live' : 'bg-orange-400'}`} />
            <span className="text-white/40">
              {faceDetected ? 'Face detected' : 'No face in frame'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
        value ? 'bg-brand-600' : 'bg-surface-400'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-5.5' : 'left-0.5'}`}
        style={{ left: value ? '22px' : '2px' }}
      />
    </button>
  );
}
