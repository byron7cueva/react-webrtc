import React, { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { Container, Row, Video } from './style';
import Peer from 'simple-peer';

export const Webrtc = () => {
  const [yourID, setYourId] = useState('');
  // Varible for user connected
  const [users, setUsers] = useState<string[]>([]);

  // Variable para el stream de video
  const [stream, setStream] = useState<MediaStream>();
  const [recevingCall, setRecivngCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState<any>();
  const [calledAcepted, setCalledAcepted] = useState(false);

  const userVideoRef = useRef<any>();
  const parnerVideoRef = useRef<any>();
  const socketRef = useRef<any>();

  useEffect(() => {
    // Conect to socket
    socketRef.current = socketIOClient.connect('/');

    // Obteniendo el stream de la camara
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(streamUser => {
      setStream(streamUser);

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = streamUser;
      }
    });

    // Escucuchando evento yourID
    socketRef.current.on('yourID', (id:string) => {
      setYourId(id);
    });

    socketRef.current.on('allUsers', (usersList: string[]) => {
      setUsers(usersList);
      console.log(usersList);
    });

    socketRef.current.on('hey', (data: any) => {
      setRecivngCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    })
  }, []);

  function callPeer(id: any) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: 'stun:a',
            username: 'a',
            credential: 'a'
          },
          {
            urls: 'turn:b',
            username: 'b',
            credential: 'b'
          }
        ]
      },
      stream
    });

    peer.on('signal', data => {
      socketRef.current.emit('callUser', { userToCall: id, signalData: data, from: yourID})
    });

    peer.on('stream', streamUser => {
      if (parnerVideoRef.current) {
        parnerVideoRef.current.srcObject = streamUser;
      }
    });

    socketRef.current.on('callAccepted', (signal: any) => {
      setCalledAcepted(true);
      peer.signal(signal);
    });
  }

  function acceptCall() {
    setCalledAcepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on('signal', data => {
      socketRef.current.emit('acceptCall', { signal: data, to: caller })
    });

    peer.on('stream', streamUser => {
      parnerVideoRef.current.srcObject = streamUser;
    });

    peer.signal(callerSignal);
  }

  let UserVideo;

  if (stream) {
    UserVideo = (
      <Video playsInline muted ref={userVideoRef} autoPlay />
    );
  }

  let PartnerVideo;
  if (calledAcepted) {
    PartnerVideo = (
      <Video playsInline ref={parnerVideoRef} autoPlay />
    );
  }

  let incomingCall;
  if (recevingCall) {
    incomingCall = (
      <div>
        <h1>{caller} is calling you</h1>
        <button onClick={acceptCall}>Aceptar</button>
      </div>
    );
  }

  return (
    <Container>
      <Row>
        {UserVideo}
        {PartnerVideo}
      </Row>
      <Row>
        {
          Object.keys(users).map(key => {
            if (key === yourID) {
              return null;
            }
            return (
            <button onClick={() => callPeer(key)} >Call {key}</button>
            )
          })
        }
      </Row>
      <Row>
        { incomingCall }
      </Row>
    </Container>
  );
}
