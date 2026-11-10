import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientAppointmentStackParamList, DoctorAppointmentStackParamList } from '../../navigation/types';
import { authService } from '../../services/auth';
import apiClient from '../../services/api/apiClient';
import {
  AuthenticatedSignalingSession,
  SignalingMessage,
} from '../../services/consultations/signaling';

type Props = NativeStackScreenProps<PatientAppointmentStackParamList, 'VideoCall'> | NativeStackScreenProps<DoctorAppointmentStackParamList, 'VideoCall'>;
type State = 'connecting' | 'waiting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
const SIGNALING_URL = process.env.EXPO_PUBLIC_SIGNALING_URL ?? 'ws://localhost:5001/api/v1/signaling';
// This package ships native bindings and must never be evaluated by Expo Web.
const nativeWebRtc: any = Platform.OS === 'web' ? null : require('react-native-webrtc');

export default function VideoCallScreen({ route, navigation }: Props) {
  if (!nativeWebRtc) {
    return <View style={[styles.screen, styles.webNotice]}><Text style={styles.title}>Video calls require the mobile app</Text><Text style={styles.caption}>Open this consultation in an iOS or Android Expo development build. Web preview does not include native WebRTC.</Text><TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}><Text>Back</Text></TouchableOpacity></View>;
  }
  const { RTCView, RTCPeerConnection, mediaDevices } = nativeWebRtc;
  const { consultationId } = route.params;
  const peer = useRef<any>(null); const signaling = useRef<AuthenticatedSignalingSession | null>(null); const local = useRef<any>(null);
  const returningToDocumentation = useRef(false);
  const stopped = useRef(false);
  const [localStream, setLocalStream] = useState<any>(null); const [remoteStream, setRemoteStream] = useState<any>(null);
  const [state, setState] = useState<State>('connecting'); const [muted, setMuted] = useState(false); const [cameraOff, setCameraOff] = useState(false); const [seconds, setSeconds] = useState(0);
  const cleanup = useCallback((notify = true) => {
    stopped.current = true;
    signaling.current?.stop(notify); signaling.current = null; peer.current?.getSenders?.().forEach((sender: any) => sender.track?.stop()); peer.current?.close(); peer.current = null;
    local.current?.getTracks().forEach((track: any) => track.stop()); local.current = null; setLocalStream(null); setRemoteStream(null);
  }, []);
  const end = useCallback(() => {
    cleanup(); setState('ended');
    if (route.params.returnToDocumentation && route.params.appointmentId) {
      returningToDocumentation.current = true;
      (navigation as any).replace('DoctorConsultation', { appointmentId: route.params.appointmentId, showDocumentation: true });
    } else navigation.goBack();
  }, [cleanup, navigation, route.params]);
  useEffect(() => { const timer = state === 'connected' ? setInterval(() => setSeconds(s => s + 1), 1000) : undefined; return () => { if (timer) clearInterval(timer); }; }, [state]);
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      cleanup();
      if (!returningToDocumentation.current && route.params.returnToDocumentation && route.params.appointmentId) {
        returningToDocumentation.current = true;
        event.preventDefault();
        (navigation as any).replace('DoctorConsultation', { appointmentId: route.params.appointmentId, showDocumentation: true });
      }
    });
    return unsubscribe;
  }, [cleanup, navigation, route.params]);
  useEffect(() => {
    let alive = true;
    const start = async () => {
      try {
        stopped.current = false;
        if (!SIGNALING_URL || (process.env.NODE_ENV === 'production' && !SIGNALING_URL.startsWith('wss://'))) throw new Error('Secure signaling (wss://) is required in production.');
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]);
          if (granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED || granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Camera and microphone permission is required to join the call.');
        }
        const stream = await mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } }); if (!alive || stopped.current) { stream.getTracks().forEach((track: any) => track.stop()); return; }
        local.current = stream; setLocalStream(stream);
        let token = await authService.getAccessToken(); if (!token) throw new Error('Your session has expired. Please sign in again.');
        const iceResponse = await apiClient.get(`/consultations/video/${consultationId}/ice-servers`, { headers: { Authorization: `Bearer ${token}` } });
        if (!alive || stopped.current) return;
        const pc = new RTCPeerConnection({
          iceServers: Array.isArray(iceResponse.data.iceServers) ? iceResponse.data.iceServers : [],
          ...(process.env.EXPO_PUBLIC_WEBRTC_RELAY_ONLY === 'true' ? { iceTransportPolicy: 'relay' } : {}),
        }); peer.current = pc;
        const pendingCandidates: unknown[] = [];
        const pendingRemoteCandidates: unknown[] = [];
        let hasRemoteDescription = false;
        const applyRemoteDescription = async (description: unknown) => {
          await pc.setRemoteDescription(description);
          while (pendingRemoteCandidates.length) {
            await pc.addIceCandidate(pendingRemoteCandidates.shift());
          }
          hasRemoteDescription = true;
        };
        const sendSignal = (message: object) => {
          return signaling.current?.send(message) ?? false;
        };
        stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));
        pc.ontrack = (event: any) => { if (event.streams[0]) setRemoteStream(event.streams[0]); };
        pc.onicecandidate = (event: any) => {
          if (!event.candidate) return;
          if (!sendSignal({ type: 'ice-candidate', payload: event.candidate })) pendingCandidates.push(event.candidate);
        };
        pc.onconnectionstatechange = () => {
          const value = pc.connectionState;
          if (value === 'connected') setState('connected');
          else if (value === 'disconnected' || value === 'connecting') setState('reconnecting');
          else if (value === 'failed') { setState('failed'); cleanup(false); }
        };
        let messageQueue = Promise.resolve();
        const handleMessage = (msg: SignalingMessage) => {
          messageQueue = messageQueue.then(async () => {
            if (!alive || stopped.current) return;
          try {
            if (msg.type === 'participant-joined' && (msg.role === 'patient' || msg.role === 'doctor')) {
              if (pc.signalingState === 'have-local-offer') {
                await pc.setLocalDescription({ type: 'rollback' });
              }
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              sendSignal({ type: 'offer', payload: offer });
            } else if (msg.type === 'offer') {
              hasRemoteDescription = false;
              await applyRemoteDescription(msg.payload);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal({ type: 'answer', payload: answer });
            } else if (msg.type === 'answer') {
              hasRemoteDescription = false;
              await applyRemoteDescription(msg.payload);
            } else if (msg.type === 'ice-candidate') {
              if (hasRemoteDescription) await pc.addIceCandidate(msg.payload);
              else pendingRemoteCandidates.push(msg.payload);
            } else if (msg.type === 'participant-left') {
              setRemoteStream(null); setState('waiting');
            } else if (msg.type === 'error') {
              throw new Error(msg.error || 'Signaling failed.');
            }
          } catch {
            cleanup(false);
            setState('failed');
          }
          });
        };
        const callSession = new AuthenticatedSignalingSession({
          url: SIGNALING_URL,
          consultationId,
          getAccessToken: () => authService.getAccessToken(),
          refreshAccessToken: () => authService.refreshAccessToken(),
          onMessage: handleMessage,
          onStateChange: (connectionState, peerPresent) => {
            if (!alive || stopped.current) return;
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
            Alert.alert('Call connection lost', message);
          },
        });
        signaling.current = callSession;
        await callSession.start(token);
      } catch (error) { if (alive) { cleanup(false); setState('failed'); Alert.alert('Unable to start video call', error instanceof Error ? error.message : 'Please try again.'); } }
    }; void start(); return () => { alive = false; cleanup(false); };
  }, [cleanup, consultationId]);
  const toggleMute = () => { const track = local.current?.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); } };
  const toggleCamera = () => { const track = local.current?.getVideoTracks()[0]; if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); } };
  const switchCamera = () => { const track: any = local.current?.getVideoTracks()[0]; track?._switchCamera?.(); };
  return <View style={styles.screen}>
    {remoteStream ? <RTCView streamURL={remoteStream.toURL()} style={styles.remote} objectFit="cover" /> : <View style={[styles.remote, styles.placeholder]}><Text style={styles.title}>{state === 'failed' ? 'Connection failed' : state === 'reconnecting' ? 'Reconnecting…' : 'Waiting for the other participant…'}</Text><Text style={styles.caption}>The call is private and is never recorded.</Text></View>}
    {localStream && !cameraOff && <RTCView streamURL={localStream.toURL()} style={styles.local} objectFit="cover" mirror />}
    <View style={styles.top}><Text style={styles.status}>{state === 'connected' ? `Connected · ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` : state}</Text></View>
    <View style={styles.controls}><TouchableOpacity style={styles.button} onPress={toggleMute}><Text>{muted ? 'Unmute' : 'Mute'}</Text></TouchableOpacity><TouchableOpacity style={styles.button} onPress={toggleCamera}><Text>{cameraOff ? 'Camera on' : 'Camera off'}</Text></TouchableOpacity><TouchableOpacity style={styles.button} onPress={switchCamera}><Text>Flip</Text></TouchableOpacity><TouchableOpacity style={[styles.button, styles.end]} onPress={end}><Text style={{ color: 'white' }}>End</Text></TouchableOpacity></View>
  </View>;
}
const styles = StyleSheet.create({ screen:{flex:1,backgroundColor:'#111'}, webNotice:{alignItems:'center',justifyContent:'center',padding:32,gap:18}, remote:{...StyleSheet.absoluteFill}, placeholder:{alignItems:'center',justifyContent:'center',padding:32}, title:{color:'white',fontSize:20,fontWeight:'700',textAlign:'center'}, caption:{color:'#cbd5e1',marginTop:10,textAlign:'center'}, local:{position:'absolute',right:16,top:72,width:110,height:160,borderRadius:12,overflow:'hidden',backgroundColor:'#334155'}, top:{position:'absolute',top:24,left:0,right:0,alignItems:'center'}, status:{color:'white',backgroundColor:'#0009',paddingHorizontal:12,paddingVertical:7,borderRadius:16,textTransform:'capitalize'}, controls:{position:'absolute',bottom:36,left:12,right:12,flexDirection:'row',justifyContent:'space-around'}, button:{backgroundColor:'white',borderRadius:24,paddingHorizontal:13,paddingVertical:12}, end:{backgroundColor:'#dc2626'} });
