export default function VideoTile({
  label, sublabel, isLocal, filterActive, faceDetected,
  faceEngineReady, videoRef, canvasRef, showCanvas, connectionState,
}) {
  return (
    <div className="video-tile relative animate-fade-in min-h-[200px] md:min-h-[300px]">
      {/* Video (always rendered, hidden when canvas shown) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          position: showCanvas && filterActive ? 'absolute' : 'relative',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isLocal ? 'scaleX(-1)' : 'none',
          opacity: showCanvas && filterActive ? 0 : 1,
          display: !showCanvas && !isLocal ? 'block' : 'block',
        }}
      />

      {/* Canvas overlay (face filter output) */}
      {showCanvas && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      {/* Face filter indicator */}
      {isLocal && faceEngineReady && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10">
          {filterActive && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-brand-600/80 text-white backdrop-blur-sm">
              <span className="status-dot live w-1.5 h-1.5" />
              Filter ON
            </span>
          )}
          {filterActive && !faceDetected && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/80 text-white backdrop-blur-sm">
              ⚠ No face
            </span>
          )}
        </div>
      )}

      {/* Connection state for remote */}
      {!isLocal && connectionState && connectionState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-white/70 text-sm capitalize">{connectionState}</p>
          </div>
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-600/80 flex items-center justify-center text-white text-xs font-bold">
            {label?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white text-xs font-semibold leading-none">{label}</p>
            {sublabel && <p className="text-white/40 text-[10px] mt-0.5">{sublabel}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
