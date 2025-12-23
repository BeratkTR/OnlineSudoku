const { Server } = require("socket.io");
const sessionMiddleware = require("../middlewares/session.js");
const User = require("../models/user_model.js")

function initSockets(server) {
    const io = new Server(server, {
        cors: {
            // origin: "http://localhost:3000",
            // origin: "*",
            origin: (origin, callback) => {
                callback(null, true);
            },
            methods: ["GET", "POST"],
            // credentials: true // Crucial because you are using express-session
        }
    });

    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    io.on("connection", async(socket) => {
        console.log("Socket connected:", socket.id);
        await User.updateOne(
            {_id: socket.request.session.userId},
            {$set: {socket: socket.id}}
        )
        const user = await User.findById(socket.request.session.userId)
        if(user?.active_room){
            socket.join(user.active_room);
            socket.request.session.roomId = user.active_room;   //kullanıcı oda bilgisi göndermek zorunda kalmaz 
            socket.to(user.active_room).emit("user_online")
            socket.to(user.active_room).emit("user_join")
        }

        require("./room.socket")(io, socket);
        require("./sudoku.socket")(io, socket);

        socket.on("disconnect", async() => {
            console.log("Socket disconnected:", socket.id);
             await User.updateOne(
                {_id: socket.request.session.userId},
                {$set: {socket: null}}
            )

            const roomId = socket.request.session.roomId;
            if(roomId){
                socket.to(socket.request.session.roomId).emit("user_offline");
            }
            });
    });

    return io;
}

module.exports = initSockets;
