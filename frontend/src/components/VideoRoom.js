import React, { useState, useEffect, useRef } from 'react';
import { FaCamera, FaUserPlus, FaMicrophone, FaMicrophoneSlash, FaPalette, FaPaperPlane } from 'react-icons/fa';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const VideoRoom = () => {
    const [roomId, setRoomId] = useState('');
    const [peers, setPeers] = useState([]);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [messages, setMessages] = useState([]); // State for chat messages
    const [newMessage, setNewMessage] = useState(''); // State for new message input
    const socketRef = useRef();
    const userVideoRef = useRef();
    const peersRef = useRef([]);
    const streamRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        socketRef.current = io.connect('https://paletteconnect.onrender.com');

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                streamRef.current = stream;
                if (userVideoRef.current) {
                    userVideoRef.current.srcObject = stream;
                }

                socketRef.current.emit('join room', roomId);

                socketRef.current.on('all users', users => {
                    const peers = [];
                    users.forEach(userId => {
                        const peer = createPeer(userId, socketRef.current.id, stream);
                        peersRef.current.push({
                            peerID: userId,
                            peer,
                        });
                        peers.push(peer);
                    });
                    setPeers(peers);
                });

                socketRef.current.on('user joined', payload => {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    });
                    setPeers(users => [...users, peer]);
                });

                socketRef.current.on('receiving returned signal', payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    item.peer.signal(payload.signal);
                });

                // Chat functionality
                socketRef.current.on('receiveMessage', ({ message, id }) => {
                    setMessages(prevMessages => [...prevMessages, { message, id }]);
                });
            })
            .catch(err => {
                console.error("Error accessing media devices:", err);
            });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomId]);

    // Function to handle sending messages
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() !== '') {
            socketRef.current.emit('sendMessage', { roomId, message: newMessage });
            setNewMessage(''); // Clear the input field
        }
    };

    // Add a function to render chat messages
    const renderMessages = () => {
        return messages.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.id === socketRef.current.id ? 'text-right' : ''}`}>
                <span className={`inline-block px-2 py-1 rounded-lg ${msg.id === socketRef.current.id ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {msg.message}
                </span>
            </div>
        ));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-200 to-gray-300 p-4">
            <h1 className="text-5xl font-bold mb-8 text-pink-600 drop-shadow-lg">PaletteConnect</h1>
            {!roomId ? (
                <motion.div 
                    className="bg-white p-8 rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105 w-full max-w-md"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                >
                    <div className="flex flex-col items-center">
                        <button 
                            className="bg-pink-500 text-white py-2 px-6 rounded-lg mb-4 transition duration-300 hover:bg-pink-600 transform hover:scale-105 flex items-center"
                            onClick={handleRoomCreate}>
                            <FaCamera className="mr-2" />
                            Create Room
                        </button>
                        <form onSubmit={handleRoomJoin} className="w-full">
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="Enter Room ID"
                                className="border-2 border-gray-300 p-3 rounded-lg mb-4 w-full transition duration-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                            />
                            <button type="submit" className="bg-pink-500 text-white py-2 px-6 rounded-lg transition duration-300 hover:bg-pink-600 transform hover:scale-105 flex items-center justify-center">
                                <FaUserPlus className="mr-2" />
                                Join Room
                            </button>
                        </form>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    className="bg-white p-4 rounded-lg shadow-lg transform transition-transform duration-300 w-full"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                >
                    <h2 className="text-2xl mb-4 text-gray-700 text-center">Room ID: {roomId}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <video playsInline muted ref={userVideoRef} autoPlay className="rounded-lg shadow-md w-full" />
                            <div className="absolute top-0 left-0 bg-pink-500 text-white text-sm font-semibold p-1 rounded-bl-lg">You</div>
                        </div>
                        {peers.length > 0 ? (
                            peers.map((peer, index) => (
                                <Video key={index} peer={peer} />
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-200 rounded-lg">
                                <p className="text-gray-600">Waiting for a participant...</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center mt-4">
                        <button onClick={toggleMic} className="bg-pink-500 text-white py-2 px-4 rounded-lg mr-4 transition duration-300 hover:bg-pink-600 flex items-center">
                            {isMicOn ? <FaMicrophone className="mr-2" /> : <FaMicrophoneSlash className="mr-2" />}
                            {isMicOn ? "Mute" : "Unmute"}
                        </button>
                        <button onClick={toggleCamera} className="bg-pink-500 text-white py-2 px-4 rounded-lg transition duration-300 hover:bg-pink-600 flex items-center">
                            {isCameraOn ? <FaCamera className="mr-2" /> : <FaCamera className="mr-2 opacity-50" />}
                            {isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
                        </button>
                    </div>
                    <button onClick={goToWhiteboard} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg transition duration-300 hover:bg-blue-600 flex items-center">
                        <FaPalette className="mr-2" />
                        Go to Whiteboard
                    </button>

                    {/* Chat Section */}
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Chat</h3>
                        <div className="h-40 border border-gray-300 rounded-lg overflow-y-auto p-2 mb-2">
                            {renderMessages()}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="border border-gray-300 p-2 rounded-lg flex-grow"
                            />
                            <button type="submit" className="bg-pink-500 text-white py-2 px-4 rounded-lg ml-2 transition duration-300 hover:bg-pink-600 flex items-center">
                                <FaPaperPlane />
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const Video = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on('stream', stream => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        });
    }, [peer]);

    return (
        <div className="relative">
            <video 
                playsInline 
                autoPlay 
                ref={ref} 
                className="rounded-lg shadow-md w-full" 
            />
            <div className="absolute top-0 left-0 bg-gray-700 text-white text-sm font-semibold p-1 rounded-bl-lg">Participant</div>
        </div>
    );
};

export default VideoRoom;
