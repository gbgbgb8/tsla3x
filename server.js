const { Server } = require('socket.io');

module.exports = (req, res) => {
    if (res.socket.server.io) {
        console.log('Socket.io already running');
    } else {
        console.log('Initializing socket.io');
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on('connection', socket => {
            socket.on('offer', offer => {
                socket.broadcast.emit('offer', offer);
            });

            socket.on('answer', answer => {
                socket.broadcast.emit('answer', answer);
            });

            socket.on('ice-candidate', candidate => {
                socket.broadcast.emit('ice-candidate', candidate);
            });
        });
    }
    res.end();
};
