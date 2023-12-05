document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-btn');

    let peerConnection;
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const socket = io('https://tsla3x.vercel.app'); // Connect to socket.io server

    function handleMessage(data) {
        const message = document.createElement('div');
        message.classList.add('message');
        message.textContent = data;
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && peerConnection) {
            peerConnection.send(message);
            handleMessage(`You: ${message}`);
            chatInput.value = '';
        }
    }

    function setupWebRTC() {
        peerConnection = new RTCPeerConnection(configuration);

        const dataChannel = peerConnection.createDataChannel("chat");
        dataChannel.onmessage = e => handleMessage(`Stranger: ${e.data}`);

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };

        peerConnection.onconnectionstatechange = event => {
            if (peerConnection.connectionState === 'connected') {
                console.log("Connected to the peer.");
            }
        };

        return dataChannel;
    }

    async function createOffer() {
        const dataChannel = setupWebRTC();
        dataChannel.onopen = () => console.log("Data channel is open");

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);
    }

    socket.on('answer', async answer => {
        const remoteDesc = new RTCSessionDescription(answer);
        await peerConnection.setRemoteDescription(remoteDesc);
    });

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

    createOffer();
});
