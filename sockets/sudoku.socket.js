const Room = require("../models/room_model.js");

module.exports = (io, socket) => {
    socket.on("click", ({row, col}) => {
        socket.to(socket.request.session.roomId).emit("click_update", {row, col})
    })

    socket.on("select_number", async({row, col, number }) => {
        socket.to(socket.request.session.roomId).emit("select_update", {row, col, number});
        console.log("user selected", row, col, "->", number);
        console.log(socket.request.session.roomId);
        await Room.updateOne(
            {_id: socket.request.session.roomId},
            {$set: { [`board.${row}.${col}`]: number }}
        )
        const roomId = socket.request.session.roomId;
        const {board, solution} = await Room.findById(roomId)
        if(board.every(row => row.every(cell => cell !== 0))){
            if(JSON.stringify(board) == JSON.stringify(solution)) io.to(roomId).emit("success");
            else io.to(roomId).emit("fail")
        } 
    });

    socket.on("get_hint", async({row,col}) => {
        const roomId = socket.request.session.roomId;
        const {solution} = await Room.findById(roomId)
        const solve = solution[row][col];
        io.to(roomId).emit("hint", {row, col, solve});
        await Room.updateOne(
            {_id: roomId},
            {
                $set: {
                    [`board.${row}.${col}`]: solve,
                    [`initial_data.${row}.${col}`]: -1
                }
            },
        )
    })
};
