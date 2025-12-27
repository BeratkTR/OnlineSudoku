const Room = require("../models/room_model");

module.exports = (io, socket) => {
    socket.on("user_online", () => {
        const roomId = socket.roomId || socket.request.session.roomId;
        if (roomId) socket.to(roomId).emit("user_online");
    });
    
    socket.on("user_offline", () => {
        const roomId = socket.roomId || socket.request.session.roomId;
        if (roomId) socket.to(roomId).emit("user_offline", { userId: socket.id });
    });

    socket.on("user_join", () => {
        const roomId = socket.roomId || socket.request.session.roomId;
        if (roomId) socket.to(roomId).emit("user_join");
    })

    socket.on("user_leave", () => {
        const roomId = socket.roomId || socket.request.session.roomId;
        if (roomId) {
            socket.to(roomId).emit("user_leave", { userId: socket.id });
            socket.leave(roomId);
        }
    })

    socket.on("cursor_move", (data) => {
        const roomId = socket.roomId || socket.request.session.roomId;
        if (roomId) {
            socket.to(roomId).emit("cursor_update", {
                x: data.x,
                y: data.y
            });
        }
    });

    socket.on("chat_message", async (message) => {
        const roomId = socket.roomId || socket.request.session.roomId;
        const username = socket.username || "Anonymous";
        console.log(`Chat message from ${username} in room ${roomId}: ${message}`);
        
        if (roomId) {
            try {
                // Save to MongoDB
                const updatedRoom = await Room.findByIdAndUpdate(roomId, {
                    $push: {
                        messages: {
                            sender: username,
                            content: message
                        }
                    }
                }, { new: true });
                
                if (updatedRoom) {
                    console.log("Message saved to DB.");
                    io.to(roomId).emit("chat_message", {
                        userId: socket.id,
                        username: username,
                        message: message
                    });
                } else {
                    console.error("Room not found when saving message:", roomId);
                }
            } catch (error) {
                console.error("Error saving message context:", error);
            }
        } else {
            console.warn("Message received but no roomId found for socket:", socket.id);
        }
    });
};
