const Room = require("../models/room_model.js");

module.exports = (io, socket) => {
    socket.on("click", ({row, col}) => {
        socket.to(socket.request.session.roomId).emit("click_update", {row, col})
    })

    socket.on("select_number", async({row, col, number }) => {
        socket.to(socket.request.session.roomId).emit("select_update", {row, col, number});
        
        // Clearing notes in DB whenever a main number is inserted or deleted
        const update = { 
            [`board.${row}.${col}`]: number,
            [`notesBoard.${row}.${col}`]: []
        };
        socket.to(socket.request.session.roomId).emit("note_clear", {row, col});

        await Room.updateOne(
            {_id: socket.request.session.roomId},
            { $set: update }
        )
        const roomId = socket.request.session.roomId;
        const room = await Room.findById(roomId);
        const {board, solution} = room;
        if(board.every(row => row.every(cell => cell !== 0))){
            if(JSON.stringify(board) == JSON.stringify(solution)) io.to(roomId).emit("success");
            else io.to(roomId).emit("fail")
        } 
    });

    socket.on("toggle_note", async ({row, col, number}) => {
        const roomId = socket.request.session.roomId;
        if (!roomId) return;
        
        const room = await Room.findById(roomId);
        if (!room) return;
        
        // Ensure notesBoard is initialized correctly
        if (!room.notesBoard || room.notesBoard.length === 0) {
            room.notesBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
        }
        
        // Ensure the specific row exists (safety check)
        if (!room.notesBoard[row]) {
            room.notesBoard[row] = Array.from({ length: 9 }, () => []);
        }

        let notes = room.notesBoard[row][col] || [];
        const numValue = parseInt(number);
        const index = notes.indexOf(numValue);
        
        if (index > -1) {
            notes.splice(index, 1); // remove
        } else {
            if (notes.length < 4) {
                notes.push(numValue); // add up to 4
                notes.sort((a, b) => a - b);
            }
        }

        // Mark modified for nested array update in Mongoose
        room.markModified(`notesBoard.${row}.${col}`);
        await room.save();

        io.to(roomId).emit("note_update", {row, col, notes});
    });

    socket.on("get_hint", async({row,col}) => {
        const roomId = socket.request.session.roomId;
        const room = await Room.findById(roomId);
        if (!room) return;
        
        const solve = room.solution[row][col];
        io.to(roomId).emit("hint", {row, col, solve});
        
        await Room.updateOne(
            {_id: roomId},
            {
                $set: {
                    [`board.${row}.${col}`]: solve,
                    [`initial_data.${row}.${col}`]: -1,
                    [`notesBoard.${row}.${col}`]: []
                }
            },
        )
    })
};
