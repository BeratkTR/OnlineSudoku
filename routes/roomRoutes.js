const express = require("express")
const router = express.Router()
const Room = require("../models/room_model")
const User = require("../models/user_model.js")
const {getBoard } = require("../utils/functions.js")
const requireAuth = require("../middlewares/auth.js")
const { default: mongoose, mongo } = require("mongoose")

router.get("/room-info", requireAuth,  async(req,res) => {
    // const {roomId} = req.body;
    try{
        const user = await User.findById(req.session.userId);
        const roomId = new mongoose.Types.ObjectId(user.active_room);
        const room = await Room.findById(roomId);
        res.json(room);
        // const room = await Room.findById(roomId);
        // if(!room) return res.sendStatus(404);
        // const user = await User.findById(req.session.userId);
        // if(user.active_room != roomId) return res.sendStatus(403);
    }catch(err){
        console.log(err)
    }
})

router.get("/rooms", requireAuth, async(req,res) => {
     try {
        const rooms = await Room.find();
        res.status(200).json(rooms)
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch rooms" });
    }
})
router.post("/createRoom", requireAuth, async(req,res) => {
    const { name, difficulty } = req.body;
    try{
        let room = await Room.findOne({name});
        if(room) return res.sendStatus(409)

        const data = await getBoard(difficulty);
        const {board, solution} = data;
        const notesBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
        room = await Room.create({name,  difficulty, board, initial_data: board, solution, users: [req.session.userId], notesBoard})
        await User.updateOne(
            {_id: req.session.userId},
            {active_room: room._id.toString()}
        )
        return res.json(room);
    }
    catch(err){
        console.log(err)
        res.sendStatus(500)
    }
})
router.post("/joinRoom", requireAuth, async(req,res) => {
    let {roomId} = req.body;
    roomId = new mongoose.Types.ObjectId(roomId);
    try{
        const room = await Room.findById(roomId);
        if(room.users.length == 2) return res.sendStatus(409) ;
        await Room.updateOne(
            {_id: roomId},
            {$push: {users: req.session.userId}}
        )
        await User.updateOne(
            {_id: req.session.userId},
            {active_room: roomId.toString()}
        )
        res.sendStatus(200);
    }catch(err){
        console.log(err)
    }
})
router.get("/leaveRoom", requireAuth, async(req,res) => {
    const user = await User.findById(req.session.userId);
    const userRoom = new mongoose.Types.ObjectId(user.active_room);
    await User.updateOne(
        {_id: req.session.userId},
        {active_room: null}
    )

    await Room.updateOne(
        {_id: userRoom},
        {$pull: {users: req.session.userId}}
    )
    const room = await Room.findById(userRoom);
    if(room.users.length == 0) await Room.deleteOne({_id: userRoom});
    res.sendStatus(200)
})


module.exports = router;