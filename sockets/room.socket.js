module.exports = (io, socket) => {
    socket.on("user_online", () => {
        socket.to(socket.request.session.roomId).emit("user_online");
        console.log("A user is online", socket.request.session.roomId)
    });
    
    socket.on("user_offline", () => {
        socket.to(socket.request.session.roomId).emit("user_offline", { userId: socket.id });
        console.log("A user is offline", socket.request.session.roomId)
    });

    socket.on("user_join", () => {
        socket.to(socket.request.session.roomId).emit("user_join")
        console.log(`a user joined ${socket.request.session.roomId}`)
    })
    socket.on("user_leave", () => {
        socket.to(socket.request.session.roomId).emit("user_leave", { userId: socket.id })
        socket.leave(socket.request.session.roomId)
        console.log(`a user left ${socket.request.session.roomId}`)
    })

    socket.on("cursor_move", (data) => {
        // console.log("Broadcasting cursor move to room:", socket.request.session.roomId);
        socket.to(socket.request.session.roomId).emit("cursor_update", {
            x: data.x,
            y: data.y
        });
    });
};
