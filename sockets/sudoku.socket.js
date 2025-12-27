const Room = require("../models/room_model.js");

module.exports = (io, socket) => {
    socket.on("click", ({row, col}) => {
        socket.to(socket.request.session.roomId).emit("click_update", {row, col})
    })

    socket.on("select_number", async({row, col, number }) => {
        const userId = socket.request.session.userId;
        const roomId = socket.request.session.roomId;
        if (!roomId) return;

        socket.to(roomId).emit("select_update", {row, col, number, userId});
        
        try {
            const update = {
                [`board.${row}.${col}`]: number,
                [`notesBoard.${row}.${col}`]: [],
                [`ownersBoard.${row}.${col}`]: (number == 0) ? null : userId
            };

            await Room.updateOne({ _id: roomId }, { $set: update });

            // success/fail check (need to fetch room data for this)
            const room = await Room.findById(roomId);
            if (room) {
                const {board, solution} = room;
                if(board.every(r => r.every(cell => cell !== 0))){
                    if(JSON.stringify(board) == JSON.stringify(solution)) io.to(roomId).emit("success");
                    else io.to(roomId).emit("fail")
                }
            }
        } catch (err) {
            console.error("Error saving number selection:", err);
        }

        socket.to(roomId).emit("note_clear", {row, col});
    });

    socket.on("toggle_note", async ({row, col, number}) => {
        const roomId = socket.request.session.roomId;
        if (!roomId) return;
        
        const room = await Room.findById(roomId);
        if (!room) return;
        
        let notes = (room.notesBoard && room.notesBoard[row] && room.notesBoard[row][col]) ? room.notesBoard[row][col] : [];
        const numValue = parseInt(number);
        const index = notes.indexOf(numValue);
        
        if (index > -1) {
            notes.splice(index, 1);
        } else {
            if (notes.length < 4) {
                notes.push(numValue);
                notes.sort((a, b) => a - b);
            }
        }

        await Room.updateOne(
            { _id: roomId },
            { $set: { [`notesBoard.${row}.${col}`]: notes } }
        );

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
