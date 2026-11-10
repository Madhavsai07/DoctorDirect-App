import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientAppointmentStackParamList, DoctorAppointmentStackParamList } from '../../navigation/types';
import { authService } from '../../services/auth';
import apiClient from '../../services/api/apiClient';
import {
  AuthenticatedSignalingSession,
  SignalingMessage,
} from '../../services/consultations/signaling';

type Props = NativeStackScreenProps<PatientAppointmentStackParamList, 'VideoCall'> | NativeStackScreenProps<DoctorAppointmentStackParamList, 'VideoCall'>;
type CallState = 'ready' | 'connecting' | 'waiting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
const signalingUrl = process.env.EXPO_PUBLIC_SIGNALING_URL ?? 'ws://localhost:5001/api/v1/signaling';

export default function VideoCallScreen({ route, navigation }: Props) {
  const localVideo = useRef<HTMLVideoElement>(null); const remoteVideo = useRef<HTMLVideoElement>(null);
  const signaling = useRef<AuthenticatedSignalingSession | null>(null); const peer = useRef<RTCPeerConnection | null>(null); const local = useRef<MediaStream | null>(null);
  const returning = useRef(false); const stopped = useRef(false); const [state, setState] = useState<CallState>('ready'); const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false); const [cameraOff, setCameraOff] = useState(false); const [hasRemote, setHasRemote] = useState(false); const [seconds, setSeconds] = useState(0);
  const cleanup = useCallback((notify = true) => {
    stopped.current = true;
    signaling.current?.stop(notify); signaling.current = null;
    // Sender tracks are the tracks currently holding the local camera/mic.
    peer.current?.getSenders().forEach(sender => sender.track?.stop());
    peer.current?.close(); peer.current = null;
    local.current?.getTracks().forEach(track => track.stop()); local.current = null;
    if (localVideo.current) localVideo.current.srcObject = null; if (remoteVideo.current) remoteVideo.current.srcObject = null;
    setHasRemote(false);
  }, []);
  const returnFromCall = useCallback(() => {
    cleanup(); setState('ended');
    if (route.params.returnToDocumentation && route.params.appointmentId) { returning.current = true; (navigation as any).replace('DoctorConsultation', { appointmentId: route.params.appointmentId, showDocumentation: true }); }
    else navigation.goBack();
  }, [cleanup, navigation, route.params]);
  useEffect(() => { const interval = state === 'connected' ? window.setInterval(() => setSeconds(value => value + 1), 1000) : undefined; return () => { if (interval) window.clearInterval(interval); }; }, [state]);
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      cleanup();
      if (!returning.current && route.params.returnToDocumentation && route.params.appointmentId) { returning.current = true; event.preventDefault(); (navigation as any).replace('DoctorConsultation', { appointmentId: route.params.appointmentId, showDocumentation: true }); }
    });
    return unsubscribe;
  }, [cleanup, navigation, route.params]);
  useEffect(() => () => cleanup(false), [cleanup]);
  const start = async () => {
    try {
      stopped.current = false;
      setError(null); setState('connecting');
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocal && window.location.protocol !== 'https:') throw new Error('Camera access requires HTTPS outside localhost.');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera and microphone access.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
      if (stopped.current) { stream.getTracks().forEach(track => track.stop()); return; }
      local.current = stream; if (localVideo.current) localVideo.current.srcObject = stream;
      // Obtain the token explicitly before the protected ICE request. This avoids
      // the auth/api import-cycle timing issue in an Expo Web browser bundle.
      let token = await authService.getAccessToken(); if (!token) throw new Error('Your session expired. Please sign in again.');
      const ice = await apiClient.get(`/consultations/video/${route.params.consultationId}/ice-servers`, { headers: { Authorization: `Bearer ${token}` } });
      if (stopped.current) return;
      if (process.env.NODE_ENV === 'production' && !signalingUrl.startsWith('wss://')) throw new Error('Secure signaling (wss://) is required in production.');
      const connection = new RTCPeerConnection({
        iceServers: Array.isArray(ice.data.iceServers) ? ice.data.iceServers : [],
        ...(process.env.EXPO_PUBLIC_WEBRTC_RELAY_ONLY === 'true' ? { iceTransportPolicy: 'relay' as const } : {}),
      }); peer.current = connection;
      const pendingCandidates: RTCIceCandidateInit[] = [];
      const pendingRemoteCandidates: RTCIceCandidateInit[] = [];
      let hasRemoteDescription = false;
      const applyRemoteDescription = async (description: RTCSessionDescriptionInit) => {
        await connection.setRemoteDescription(description);
        while (pendingRemoteCandidates.length) {
          await connection.addIceCandidate(pendingRemoteCandidates.shift()!);
        }
        hasRemoteDescription = true;
      };
      const sendSignal = (message: object) => {
        return signaling.current?.send(message) ?? false;
      };
      stream.getTracks().forEach(track => connection.addTrack(track, stream));
      connection.ontrack = (event) => { if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0]; setHasRemote(true); };
      connection.onicecandidate = (event) => {
        if (!event.candidate) return;
        const candidate = event.candidate.toJSON();
        if (!sendSignal({ type: 'ice-candidate', payload: candidate })) pendingCandidates.push(candidate);
      };
      connection.onconnectionstatechange = () => {
        if (connection.connectionState === 'connected') setState('connected');
        else if (connection.connectionState === 'failed') { cleanup(false); setState('failed'); setError('Peer connection failed. You can end the call and rejoin.'); }
        else if (connection.connectionState === 'disconnected') setState('reconnecting');
      };
      let messageQueue = Promise.resolve();
      const handleMessage = (message: SignalingMessage) => {
        messageQueue = messageQueue.then(async () => {
          if (stopped.current) return;
        try {
          if (message.type === 'participant-joined') {
            if (connection.signalingState === 'have-local-offer') {
              await connection.setLocalDescription({ type: 'rollback' });
            }
            const offer = await connection.createOffer({ iceRestart: true });
            await connection.setLocalDescription(offer);
            sendSignal({ type: 'offer', payload: offer });
          } else if (message.type === 'offer') {
            hasRemoteDescription = false;
            await applyRemoteDescription(message.payload as RTCSessionDescriptionInit);
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            sendSignal({ type: 'answer', payload: answer });
          } else if (message.type === 'answer') {
            hasRemoteDescription = false;
            await applyRemoteDescription(message.payload as RTCSessionDescriptionInit);
          } else if (message.type === 'ice-candidate') {
            if (hasRemoteDescription) await connection.addIceCandidate(message.payload as RTCIceCandidateInit);
            else pendingRemoteCandidates.push(message.payload as RTCIceCandidateInit);
          } else if (message.type === 'participant-left') {
            setHasRemote(false); setState('waiting');
          } else if (message.type === 'error') {
            throw new Error(message.error || 'Signaling failed.');
          }
        } catch (cause) {
          cleanup(false);
          setState('failed');
          setError(cause instanceof Error ? cause.message : 'Signaling failed.');
        }
        });
      };
      const callSession = new AuthenticatedSignalingSession({
        url: signalingUrl,
        consultationId: route.params.consultationId,
        getAccessToken: () => authService.getAccessToken(),
        refreshAccessToken: () => authService.refreshAccessToken(),
        onMessage: handleMessage,
        onStateChange: (connectionState, peerPresent) => {
          if (stopped.current) return;
          if (connectionState === 'reconnecting') {
            pendingCandidates.length = 0;
            setState('reconnecting');
          }
          else if (connectionState === 'failed') setState('failed');
          else {
            setState(peerPresent ? 'connecting' : 'waiting');
            for (const payload of pendingCandidates.splice(0)) {
              if (!sendSignal({ type: 'ice-candidate', payload })) pendingCandidates.push(payload);
            }
          }
        },
        onFailure: (message) => {
          cleanup(false);
          setState('failed');
          setError(message);
        },
      });
      signaling.current = callSession;
      await callSession.start(token);
    } catch (cause: any) { cleanup(false); setState('failed'); setError(cause?.response?.status === 401 ? 'Your session is no longer valid. Please sign out and sign in again.' : cause instanceof Error ? cause.message : 'Unable to access camera and microphone.'); }
  };
  const toggleMute = () => { const track = local.current?.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); } };
  const toggleCamera = () => { const track = local.current?.getVideoTracks()[0]; if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); } };
  const switchCamera = async () => { try { const devices = await navigator.mediaDevices.enumerateDevices(); const cameras = devices.filter(item => item.kind === 'videoinput'); if (cameras.length < 2) return; const old = local.current?.getVideoTracks()[0]; const next = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: cameras.find(item => item.deviceId !== old?.getSettings().deviceId)?.deviceId ?? cameras[0].deviceId } }, audio: false }); const track = next.getVideoTracks()[0]; if (old && peer.current) { peer.current.getSenders().find(sender => sender.track?.kind === 'video')?.replaceTrack(track); old.stop(); local.current?.removeTrack(old); local.current?.addTrack(track); if (localVideo.current && local.current) localVideo.current.srcObject = local.current; } } catch { setError('Unable to switch camera.'); } };
  const status = state === 'connected' ? `Connected · ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` : state;
  return <View style={styles.screen}>
    <View style={styles.videoArea}>{hasRemote ? <video ref={remoteVideo} autoPlay playsInline style={styles.remote as any} aria-label="Remote participant video" /> : <View style={styles.placeholder}><Text style={styles.title}>{state === 'ready' ? 'Ready to join' : state === 'failed' ? 'Connection failed' : state === 'reconnecting' ? 'Reconnecting…' : 'Waiting for the other participant…'}</Text><Text style={styles.caption}>Camera and microphone are used only for this live consultation and are not recorded.</Text></View>}{local.current && !cameraOff ? <video ref={localVideo} autoPlay playsInline muted style={styles.local as any} aria-label="Your video preview" /> : null}</View>
    <Text style={styles.status}>{status}</Text>{error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.controls}>{state === 'ready' || state === 'failed' ? <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={start}><Text>Allow camera & join</Text></TouchableOpacity> : <><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={toggleMute}><Text>{muted ? 'Unmute' : 'Mute'}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={toggleCamera}><Text>{cameraOff ? 'Camera on' : 'Camera off'}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={switchCamera}><Text>Switch camera</Text></TouchableOpacity></>}<TouchableOpacity accessibilityRole="button" style={[styles.button, styles.end]} onPress={returnFromCall}><Text style={{ color: '#fff' }}>End call</Text></TouchableOpacity></View>
  </View>;
}
const styles = StyleSheet.create({ screen:{ flex:1, backgroundColor:'#111', alignItems:'center', justifyContent:'center', padding:16 }, videoArea:{ width:'100%', maxWidth:960, flex:1, minHeight:300, position:'relative', backgroundColor:'#1e293b', overflow:'hidden' }, remote:{ width:'100%', height:'100%', objectFit:'cover' }, local:{ position:'absolute', right:16, top:16, width:180, height:130, objectFit:'cover', borderRadius:12, backgroundColor:'#334155' }, placeholder:{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }, title:{ color:'#fff', fontSize:20, fontWeight:'700', textAlign:'center' }, caption:{ color:'#cbd5e1', marginTop:10, textAlign:'center', maxWidth:480 }, status:{ color:'#fff', marginTop:12, textTransform:'capitalize' }, error:{ color:'#fecaca', marginTop:6, textAlign:'center' }, controls:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:10, paddingVertical:16 }, button:{ backgroundColor:'#fff', borderRadius:24, paddingHorizontal:14, paddingVertical:12 }, end:{ backgroundColor:'#dc2626' } });
