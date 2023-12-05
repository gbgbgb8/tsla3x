document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-btn');

    // Initialize peer connection
    let peerConnection;
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const socket = io(); // Initialize socket.io client

    // Function to handle the incoming message
    function handleMessage(data) {
        const message = document.createElement('div');
        message.classList.add('message');
        message.textContent = data;
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Function to send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && peerConnection) {
            peerConnection.send(message);
            handleMessage(`You: ${message}`);
            chatInput.value = '';
        }
    }

    // Set up WebRTC connection
    function setupWebRTC() {
        peerConnection = new RTCPeerConnection(configuration);

        // Handle incoming data channel messages
        peerConnection.ondatachannel = event => {
            const channel = event.channel;
            channel.onmessage = e => handleMessage(`Stranger: ${e.data}`);
        };

        // Create a data channel
        const dataChannel = peerConnection.createDataChannel("chat");

        // Setup the ICE candidates
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };

        // Once the connection is established
        peerConnection.onconnectionstatechange = event => {
            if (peerConnection.connectionState === 'connected') {
                console.log("Connected to the peer.");
            }
        };

        return dataChannel;
    }

    // Set up the initial WebRTC offer
    async function createOffer() {
        const dataChannel = setupWebRTC();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);
    }

    // Handle the WebRTC answer
    socket.on('answer', async answer => {
        const remoteDesc = new RTCSessionDescription(answer);
        await peerConnection.setRemoteDescription(remoteDesc);
    });

    // Handle ICE candidates from the peer
    socket.on('ice-candidate', async candidate => {
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    });

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Start the process
    createOffer();
});
