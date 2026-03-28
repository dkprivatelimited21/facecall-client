import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getSocket, disconnectSocket } from '../utils/socket.js';
import { WebRTCManager } from '../utils/webrtc.js';
import { FaceSwapEngine } from '../utils/faceSwap.js';
import ControlBar from '../components/ControlBar.jsx';
import VideoTile from '../components/VideoTile.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import RoomInfo from '../components/RoomInfo.jsx';

export default function CallPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userName = location.state?.userName || 'Anonymous';

  // Refs
  const localVideoRef = useRef(null);
  const localCanvasRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const rtcRef = useRef(null);
  const faceEngineRef = useRef(null);
  const localStreamRef = useRef(null);

  // State
  const [status, setStatus] = useState('connecting'); // connecting | waiting | in-call | ended
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [blurBg, setBlurBg] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [overlayImage, setOverlayImage] = useState(null);
  const [faceEngineReady, setFaceEngineReady] = useState(false);
  const [connectionState, setConnectionState] = useState('');
  const [remoteUser, setRemoteUser] = useState(null);
  const [copied, setCopied] = useState(false);

  // ── Camera setup ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }
      return stream;
    } catch (e) {
      console.error('[Camera]', e);
      throw e;
    }
  }, []);

  // ── Face engine setup ─────────────────────────────────────────────────────
  const initFaceEngine = useCallback(async () => {
    if (!localVideoRef.current || !localCanvasRef.current) return;
    try {
      const engine = new FaceSwapEngine({
        videoEl: localVideoRef.current,
        canvasEl: localCanvasRef.current,
        onFaceDetected: (detected) => setFaceDetected(detected),
      });
      await engine.init();
      faceEngineRef.current = engine;
      engine.start();
      setFaceEngineReady(true);
      console.log('[FaceEngine] Ready');
    } catch (e) {
      console.warn('[FaceEngine] Failed to init:', e);
    }
  }, []);

  // ── Main setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    let socket;
    let destroyed = false;

    (async () => {
      try {
        const stream = await startCamera();
        if (destroyed) return;

        // Short delay so video element is ready
        await new Promise((r) => setTimeout(r, 500));
        if (destroyed) return;

        await initFaceEngine();
        if (destroyed) return;

        socket = getSocket();
        const rtc = new WebRTCManager({
          socket,
          onRemoteStream: (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          },
          onConnectionStateChange: (state) => {
            setConnectionState(state);
            if (state === 'connected') setStatus('in-call');
            if (state === 'disconnected' || state === 'failed') setStatus('waiting');
          },
        });
        rtc.setLocalStream(stream);
        rtcRef.current = rtc;

        // ── Socket events ──────────────────────────────────────────────────
        socket.on('room-joined', ({ users, isInitiator }) => {
          setStatus(isInitiator ? 'waiting' : 'connecting');
        });

        socket.on('user-joined', async ({ socketId, userName: remName }) => {
          setRemoteUser({ socketId, userName: remName });
          setStatus('in-call');
          // Send canvas stream to peer
          const canvasStream = faceEngineRef.current?.getCanvasStream(30);
          if (canvasStream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) canvasStream.addTrack(audioTrack);
            rtc.setLocalStream(canvasStream);
          }
          await rtc.createOffer(socketId);
        });

        socket.on('offer', async (data) => {
          setStatus('in-call');
          const canvasStream = faceEngineRef.current?.getCanvasStream(30);
          if (canvasStream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) canvasStream.addTrack(audioTrack);
            rtc.setLocalStream(canvasStream);
          }
          await rtc.handleOffer(data);
        });

        socket.on('answer', (data) => rtc.handleAnswer(data));
        socket.on('ice-candidate', (data) => rtc.handleIceCandidate(data));

        socket.on('user-left', ({ userName: leftName }) => {
          setRemoteUser(null);
          setStatus('waiting');
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          setConnectionState('');
        });

        socket.on('room-full', () => {
          alert('Room is full!');
          navigate('/');
        });

        socket.emit('join-room', { roomId, userName });
      } catch (e) {
        console.error('[Setup]', e);
      }
    })();

    return () => {
      destroyed = true;
      socket?.emit('leave-room');
      rtcRef.current?.destroy();
      faceEngineRef.current?.destroy();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      disconnectSocket();
    };
  }, [roomId, userName]);

  // ── Filter toggle → replace peer video track ──────────────────────────────
  useEffect(() => {
    if (!faceEngineRef.current) return;
    faceEngineRef.current.setFilterEnabled(filterEnabled);

    if (rtcRef.current && localStreamRef.current) {
      const canvasStream = faceEngineRef.current.getCanvasStream(30);
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack && !canvasStream.getAudioTracks().length) {
        canvasStream.addTrack(audioTrack);
      }
      const newVideoTrack = canvasStream.getVideoTracks()[0];
      if (newVideoTrack) rtcRef.current.replaceVideoTrack(newVideoTrack);
    }
  }, [filterEnabled]);

  useEffect(() => {
    faceEngineRef.current?.setBlurBackground(blurBg);
  }, [blurBg]);

  useEffect(() => {
    if (!overlayImage || !faceEngineRef.current) return;
    const img = new Image();
    img.onload = () => faceEngineRef.current.setOverlayImage(img);
    img.src = overlayImage;
  }, [overlayImage]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  const toggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const handleLeave = () => {
    getSocket().emit('leave-room');
    navigate('/');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabels = {
    connecting: 'Connecting…',
    waiting: 'Waiting for someone to join…',
    'in-call': remoteUser ? `In call with ${remoteUser.userName}` : 'In call',
    ended: 'Call ended',
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 glass border-b border-white/6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-sm hidden sm:block">FaceCall</span>
        </div>

        <RoomInfo roomId={roomId} status={status} statusLabel={statusLabels[status]} copied={copied} onCopy={copyLink} />

        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="status-dot live" />
          <span className="hidden sm:block">{userName}</span>
        </div>
      </header>

      {/* Video grid */}
      <main className="flex-1 p-3 md:p-4 grid gap-3 md:gap-4" style={{
        gridTemplateColumns: status === 'in-call' ? '1fr 1fr' : '1fr',
        gridTemplateRows: 'auto',
        maxHeight: 'calc(100vh - 160px)',
      }}>
        {/* Local video */}
        <VideoTile
          label={userName}
          sublabel="You"
          isLocal
          filterActive={filterEnabled}
          faceDetected={faceDetected}
          faceEngineReady={faceEngineReady}
          videoRef={localVideoRef}
          canvasRef={localCanvasRef}
          showCanvas={true}
        />

        {/* Remote video */}
        {status === 'in-call' && (
          <VideoTile
            label={remoteUser?.userName || 'Connecting…'}
            sublabel="Remote"
            videoRef={remoteVideoRef}
            showCanvas={false}
            connectionState={connectionState}
          />
        )}

        {/* Waiting state */}
        {status === 'waiting' && (
          <div className="video-tile flex flex-col items-center justify-center gap-4 p-8 min-h-[200px]">
            <div className="w-16 h-16 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center animate-pulse-slow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="rgba(99,102,241,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-sm font-medium">Waiting for someone to join</p>
              <p className="text-white/30 text-xs mt-1">Share the room code to invite</p>
            </div>
            <button
              onClick={copyLink}
              className="btn-neon flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600/20 border border-brand-600/30 text-brand-300 text-sm font-mono hover:bg-brand-600/30 transition"
            >
              <span>{copied ? '✓ Copied!' : roomId}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* Filter panel */}
      {filterPanelOpen && (
        <FilterPanel
          filterEnabled={filterEnabled}
          blurBg={blurBg}
          overlayImage={overlayImage}
          faceEngineReady={faceEngineReady}
          faceDetected={faceDetected}
          onToggleFilter={() => setFilterEnabled((v) => !v)}
          onToggleBlur={() => setBlurBg((v) => !v)}
          onImageUpload={setOverlayImage}
          onClose={() => setFilterPanelOpen(false)}
        />
      )}

      {/* Control bar */}
      <ControlBar
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        filterEnabled={filterEnabled}
        filterPanelOpen={filterPanelOpen}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleFilter={() => {
          if (!filterPanelOpen) setFilterPanelOpen(true);
          else setFilterEnabled((v) => !v);
        }}
        onOpenFilterPanel={() => setFilterPanelOpen((v) => !v)}
        onLeave={handleLeave}
      />
    </div>
  );
}
