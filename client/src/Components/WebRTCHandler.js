import { io } from 'socket.io-client';

const socket = io('ws://127.0.0.1:8000/ws/call/');

let localStream;
let peerConnection;

const startCall = async (recipientEmail) => {
  // Get the user's media stream
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Create the peer connection and add media stream
  peerConnection = new RTCPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', { type: 'candidate', candidate: event.candidate });
    }
  };
  
  peerConnection.ontrack = (event) => {
    const remoteStream = event.streams[0];
    const remoteAudio = document.getElementById('remoteAudio');
    remoteAudio.srcObject = remoteStream;
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('signal', { type: 'offer', sdp: offer, to: recipientEmail });
};

socket.on('signal', async (data) => {
  if (data.type === 'offer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('signal', { type: 'answer', sdp: answer, to: data.from });
  } else if (data.type === 'answer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  } else if (data.type === 'candidate') {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

export { startCall };
