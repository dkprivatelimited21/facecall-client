const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export class WebRTCManager {
  constructor({ socket, onRemoteStream, onConnectionStateChange }) {
    this.socket = socket;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.pc = null;
    this.localStream = null;
    this.remoteSocketId = null;
  }

  async createPeerConnection(remoteSocketId) {
    this.remoteSocketId = remoteSocketId;
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });
    }

    // Remote stream
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream?.(event.streams[0]);
      }
    };

    // ICE candidates → signal
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('[ICE]', this.pc.iceConnectionState);
    };

    return this.pc;
  }

  async createOffer(remoteSocketId) {
    await this.createPeerConnection(remoteSocketId);
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    this.socket.emit('offer', { to: remoteSocketId, offer });
  }

  async handleOffer({ from, offer }) {
    this.remoteSocketId = from;
    await this.createPeerConnection(from);
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.socket.emit('answer', { to: from, answer });
  }

  async handleAnswer({ answer }) {
    if (this.pc && this.pc.signalingState !== 'stable') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate({ candidate }) {
    if (this.pc && candidate) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[ICE] Failed to add candidate', e);
      }
    }
  }

  setLocalStream(stream) {
    this.localStream = stream;
    // Replace tracks if PC already exists
    if (this.pc) {
      const senders = this.pc.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          this.pc.addTrack(track, stream);
        }
      });
    }
  }

  async replaceVideoTrack(newTrack) {
    if (!this.pc) return;
    const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && newTrack) {
      await sender.replaceTrack(newTrack);
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  destroy() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }
}
