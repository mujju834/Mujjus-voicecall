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
  const [calling, setCalling] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  const socket = useRef<any>();
  const peerRef = useRef<any>();

  const navigate = useNavigate();

  useEffect(() => {
    // socket.current = io("http://localhost:5000");
    socket.current = io(import.meta.env.VITE_SOCKET_URL);


    if (loggedInUser) {
      socket.current.emit('register-user', loggedInUser);
    }

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

    socket.current.on('call-made', (data: any) => {
      console.log(`Receiving a call from: ${data.from}`);
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.offer);
    });

    socket.current.on('call-cancelled', () => {
      console.log("Call was cancelled");
      setReceivingCall(false);
      setCalling(false);
      setCaller("");
      setCallAccepted(false);
    });

    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
      })
      .catch((err) => {
        console.error('Error accessing media devices:', err);
      });

    let interval: NodeJS.Timeout;
    if (callStarted) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [loggedInUser, callStarted]);

  const callUser = (userToCall: string) => {
    console.log("Calling user", userToCall);

    if (!stream) {
      console.error("No media stream available");
      return;
    }

    peerRef.current = new RTCPeerConnection();

    peerRef.current.onicecandidate = (e: any) => {
      if (e.candidate) {
        socket.current.emit('ice-candidate', {
          to: userToCall,
          candidate: e.candidate,
        });
      }
    };

    peerRef.current.addStream(stream);

    peerRef.current.createOffer()
      .then((offer: RTCSessionDescriptionInit) => {
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        socket.current.emit('call-user', {
          userToCall,
          offer: peerRef.current.localDescription,
          from: loggedInUser,
        });
        setCalling(true);
      })
      .catch((error) => {
        console.error("Error creating an offer:", error);
      });
  };

  const cancelCall = () => {
    if (calling) {
      socket.current.emit('cancel-call', { to: caller, from: loggedInUser });
      setCalling(false);
      setReceivingCall(false);
    }
  };

  const acceptCall = () => {
    if (!callerSignal || !callerSignal.sdp) {
      console.error("No valid offer received.");
      return;
    }

    setCallAccepted(true);
    setCallStarted(true);
    peerRef.current = new RTCPeerConnection();

    if (stream) {
      stream.getTracks().forEach((track) => peerRef.current.addTrack(track, stream));
    }

    peerRef.current.setRemoteDescription(new RTCSessionDescription(callerSignal))
      .then(() => {
        return peerRef.current.createAnswer();
      })
      .then((answer) => {
        return peerRef.current.setLocalDescription(answer);
      })
      .then(() => {
        socket.current.emit('accept-call', { signal: peerRef.current.localDescription, to: caller });
      })
      .catch((error) => {
        console.error("Error accepting call:", error);
      });
  };

  const rejectCall = () => {
    setReceivingCall(false);
    socket.current.emit('reject-call', { to: caller });
  };

  const endCall = () => {
    setCallAccepted(false);
    setCallStarted(false);
    setCallTimer(0);
    socket.current.emit('end-call', { to: caller });
    setReceivingCall(false);
    setCaller('');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
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
            .filter((user) => user.email !== loggedInUser)
            .map((user, index) => (
              <li key={index} className="mb-2 flex justify-between items-center">
                {user.email}
                <FaPhoneAlt
                  className="text-blue-500 cursor-pointer"
                  onClick={() => callUser(user.email)}
                />
              </li>
            ))}
        </ul>

        {calling && (
          <div className="text-center">
            <h3>Calling...</h3>
            <button onClick={cancelCall} className="bg-red-500 px-4 py-2 text-white rounded">
              Cancel Call
            </button>
          </div>
        )}

        {receivingCall && !callAccepted && (
          <div className="text-center">
            <h3>{caller} is calling you!</h3>
            <button onClick={acceptCall} className="bg-green-500 px-4 py-2 text-white rounded">
              Accept
            </button>
            <button onClick={rejectCall} className="bg-red-500 px-4 py-2 text-white rounded ml-2">
              Reject
            </button>
          </div>
        )}

        {callAccepted && (
          <div className="text-center mt-4">
            <h3>Call in progress...</h3>
            <p>Time: {formatTime(callTimer)}</p>
            <button onClick={endCall} className="bg-red-500 px-4 py-2 text-white rounded mt-2">
              End Call
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
