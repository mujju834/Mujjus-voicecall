import React, { useEffect, useState, useRef } from 'react';
import { FaPhoneAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

interface User {
  email: string;
}

const Welcome: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(
    JSON.parse(localStorage.getItem('user') || '{}').email
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [caller, setCaller] = useState('');
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState<any>(null);

  const socket = useRef<any>();
  const userVideo = useRef<any>();
  const partnerVideo = useRef<any>();
  const peerRef = useRef<any>();

  const navigate = useNavigate();

  useEffect(() => {
    // Connect to signaling server
    socket.current = io("http://localhost:5000");
  
    // Emit the logged-in user's email to the server after connection
    if (loggedInUser) {
      socket.current.emit('register-user', loggedInUser); // Emit the user's email to the server
    }
  
    // Fetch users
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/users/`);
        const data = await response.json();
        if (response.ok) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
  
    fetchUsers();
  
    // Listen for incoming call (using 'call-made')
    socket.current.on('call-made', (data: any) => {
      console.log(`Receiving a call from: ${data.from}`);
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.offer);  // Assuming the 'offer' contains the signal
    });
  
    // Access media devices for audio call
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (userVideo.current) {
          userVideo.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        console.error('Error accessing media devices:', err);
      });
    
  }, [loggedInUser]);
  
  
  
  const callUser = (userToCall: string) => {
    console.log("Calling user", userToCall); // Debug log to verify correct user
    if (!stream) {
      console.error("No media stream available");
      return;
    }
  
    peerRef.current = new RTCPeerConnection();
    peerRef.current.addStream(stream);
  
    peerRef.current.onicecandidate = (e: any) => {
      if (e.candidate) {
        socket.current.emit('call-user', {
          userToCall,             // Email of the user to be called
          signalData: peerRef.current.localDescription,
          from: loggedInUser,     // Email of the logged-in user
        });
      }
    };
  
    peerRef.current.createOffer().then((offer: RTCSessionDescriptionInit) => {
      peerRef.current.setLocalDescription(offer).then(() => {
        socket.current.emit('call-user', {
          userToCall,
          signalData: offer,
          from: loggedInUser,
        });
      });
    });
  };
  
  

  const acceptCall = () => {
    setCallAccepted(true);
    peerRef.current = new RTCPeerConnection();
    if (stream) {
      peerRef.current.addStream(stream!);

      peerRef.current.ontrack = (e: any) => {
        partnerVideo.current.srcObject = e.streams[0];
      };

      peerRef.current.setRemoteDescription(new RTCSessionDescription(callerSignal));
      peerRef.current.createAnswer().then((answer: RTCSessionDescriptionInit) => {
        peerRef.current.setLocalDescription(answer);
        socket.current.emit('accept-call', { signal: answer, to: caller });
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-500">
      <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome, {loggedInUser}!</h1>

        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Registered Users:</h2>
        <ul className="text-left text-gray-600">
          {users
            .filter((user) => user.email !== loggedInUser) // Exclude logged-in user
            .map((user, index) => (
              <li key={index} className="mb-2 flex justify-between items-center">
                {user.email}
                <FaPhoneAlt
                  className="text-blue-500 cursor-pointer"
                  onClick={() => callUser(user.email)} // Call when icon is clicked
                />
              </li>
            ))}
        </ul>

        {receivingCall && !callAccepted && (
          <div className="text-center">
            <h3>{caller} is calling you!</h3>
            <button onClick={acceptCall} className="bg-green-500 px-4 py-2 text-white rounded">
              Accept
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-6 rounded-lg text-lg font-semibold transition duration-300 transform hover:bg-red-600 hover:scale-105 mt-6"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Welcome;
