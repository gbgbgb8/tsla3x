const { Server } = require('socket.io');

module.exports = (req, res) => {
    if (!res.socket.server.io) {
        console.log('New Socket.io server is initializing...');
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on('connection', (socket) => {
            console.log('A user connected');

            socket.on('message', (data) => {
                socket.broadcast.emit('message', data);
            });

            socket.on('disconnect', () => {
                console.log('A user disconnected');
            });
        });
    } else {
        console.log('Socket.io server already running');
    }
    res.end();
};
