export interface VideoCallConfig {
  audio: boolean;
  video: boolean;
}

export interface CallParticipant {
  id: string;
  name: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export class VideoCallService {
  private localStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private remoteStream: MediaStream | null = null;
  private participants: Map<string, CallParticipant> = new Map();
  private isCallActive = false;
  private onCallStateChange?: (state: 'connecting' | 'connected' | 'disconnected') => void;
  private onParticipantsChange?: (participants: CallParticipant[]) => void;

  // Initialize local media stream
  async initializeMedia(config: VideoCallConfig = { audio: true, video: true }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: config.audio,
        video: config.video ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        } : false,
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }

  // Start a call
  async startCall(doctorId: string, config?: VideoCallConfig): Promise<void> {
    if (this.isCallActive) {
      throw new Error('A call is already active');
    }

    try {
      // Initialize media
      await this.initializeMedia(config);

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.onCallStateChange?.('connected');
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer (in a real app, via signaling server)
          console.log('ICE candidate:', event.candidate);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('Connection state:', state);

        if (state === 'connected') {
          this.onCallStateChange?.('connected');
        } else if (state === 'disconnected' || state === 'closed' || state === 'failed') {
          this.onCallStateChange?.('disconnected');
          this.endCall();
        }
      };

      this.isCallActive = true;

      // Add current user as participant
      this.participants.set('current', {
        id: 'current',
        name: 'You',
        stream: this.localStream || undefined,
        isMuted: false,
        isVideoOff: !config?.video,
      });

      // Add emergency contact as participant
      this.participants.set('emergency', {
        id: 'emergency',
        name: `Emergency Contact (${doctorId})`,
        isMuted: false,
        isVideoOff: false,
      });

      this.notifyParticipantsChange();

    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  // Join an existing call
  async joinCall(callId: string, config?: VideoCallConfig): Promise<void> {
    // In a real implementation, this would connect to a signaling server
    // For now, we'll simulate joining a call
    await this.startCall(callId, config);
  }

  // End the current call
  endCall(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.remoteStream = null;
    this.isCallActive = false;
    this.participants.clear();

    this.onCallStateChange?.('disconnected');
    this.notifyParticipantsChange();
  }

  // Toggle microphone
  toggleMicrophone(): boolean {
    if (!this.localStream) return false;

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    const isMuted = !audioTracks[0].enabled;
    audioTracks[0].enabled = isMuted;

    // Update participant state
    const currentParticipant = this.participants.get('current');
    if (currentParticipant) {
      currentParticipant.isMuted = !isMuted;
      this.participants.set('current', currentParticipant);
      this.notifyParticipantsChange();
    }

    return isMuted;
  }

  // Toggle camera
  toggleCamera(): boolean {
    if (!this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;

    const isVideoOff = !videoTracks[0].enabled;
    videoTracks[0].enabled = isVideoOff;

    // Update participant state
    const currentParticipant = this.participants.get('current');
    if (currentParticipant) {
      currentParticipant.isVideoOff = !isVideoOff;
      this.participants.set('current', currentParticipant);
      this.notifyParticipantsChange();
    }

    return isVideoOff;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Check if call is active
  isCallInProgress(): boolean {
    return this.isCallActive;
  }

  // Get call duration (simplified)
  getCallDuration(): number {
    // In a real implementation, you'd track start time
    return 0;
  }

  // Set event handlers
  setOnCallStateChange(handler: (state: 'connecting' | 'connected' | 'disconnected') => void): void {
    this.onCallStateChange = handler;
  }

  setOnParticipantsChange(handler: (participants: CallParticipant[]) => void): void {
    this.onParticipantsChange = handler;
  }

  // Add a remote participant (for multi-party calls)
  addParticipant(participant: CallParticipant): void {
    this.participants.set(participant.id, participant);
    this.notifyParticipantsChange();
  }

  // Remove a participant
  removeParticipant(participantId: string): void {
    this.participants.delete(participantId);
    this.notifyParticipantsChange();
  }

  // Get all participants
  getParticipants(): CallParticipant[] {
    return Array.from(this.participants.values());
  }

  // Screen sharing (advanced feature)
  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in peer connection
      if (this.peerConnection && this.localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Update local stream
        const oldVideoTrack = this.localStream.getVideoTracks()[0];
        this.localStream.removeTrack(oldVideoTrack);
        this.localStream.addTrack(videoTrack);

        // Handle screen share end
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw new Error('Failed to start screen sharing');
    }
  }

  // Stop screen sharing
  async stopScreenShare(): Promise<void> {
    if (!this.localStream) return;

    try {
      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      const cameraTrack = cameraStream.getVideoTracks()[0];

      // Replace screen share track with camera track
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(cameraTrack);
        }
      }

      // Update local stream
      const screenTrack = this.localStream.getVideoTracks()[0];
      this.localStream.removeTrack(screenTrack);
      this.localStream.addTrack(cameraTrack);

      // Stop screen stream
      cameraStream.getTracks().forEach(track => track.stop());

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  // Private helper methods
  private notifyParticipantsChange(): void {
    if (this.onParticipantsChange) {
      this.onParticipantsChange(this.getParticipants());
    }
  }

  // Check if WebRTC is supported
  static isSupported(): boolean {
    return !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );
  }

  // Get supported constraints
  static async getSupportedConstraints(): Promise<MediaTrackSupportedConstraints> {
    if (!navigator.mediaDevices?.getSupportedConstraints) {
      return {};
    }
    return navigator.mediaDevices.getSupportedConstraints();
  }
}

// Emergency call service
export class EmergencyCallService {
  private videoCallService = new VideoCallService();
  private emergencyNumber = '7219435156';

  // Quick emergency call with location sharing
  async initiateEmergencyCall(
    emergencyType: 'medical' | 'police' | 'fire' | 'ambulance' = 'medical'
  ): Promise<void> {
    try {
      // Use the configured emergency number
      const number = this.emergencyNumber;

      // Initiate voice call
      window.location.href = `tel:${number}`;

    } catch (error) {
      console.error('Error initiating emergency call:', error);
      throw error;
    }
  }

  // Initiate video call to emergency number
  async initiateEmergencyVideoCall(): Promise<void> {
    try {
      const number = this.emergencyNumber;

      // Try different methods based on platform
      if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        // iOS FaceTime
        window.location.href = `facetime:${number}`;
      } else if (navigator.userAgent.match(/Android/i)) {
        // Android - try Google Duo/Meet
        window.location.href = `intent://call/${number}#Intent;scheme=videocall;package=com.google.android.apps.tachyon;end`;
      } else {
        // Desktop/Web - use WebRTC
        await this.videoCallService.startCall(number);
      }

    } catch (error) {
      console.error('Error initiating emergency video call:', error);
      throw error;
    }
  }

  // Get emergency number
  getEmergencyNumber(): string {
    return this.emergencyNumber;
  }

  // Set custom emergency number
  setEmergencyNumber(number: string): void {
    this.emergencyNumber = number;
  }

  // Get video call service instance
  getVideoCallService(): VideoCallService {
    return this.videoCallService;
  }

  // Check if emergency calling is supported
  static isEmergencyCallingSupported(): boolean {
    return VideoCallService.isSupported() && 'geolocation' in navigator;
  }
}
