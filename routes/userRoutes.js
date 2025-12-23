const express = require("express")
const router = express.Router()
const requireAuth = require("../middlewares/auth")
const User = require("../models/user_model")


router.get("/user-info", requireAuth, async(req,res) => {
    const {username, active_room} = await User.findById(req.session.userId);

    res.json({username, active_room})
})
router.post("/username", requireAuth, async(req,res) => {
    const {users: userIds} = req.body;
    const users = await User.find(
        {_id: {$in: userIds}}
    )
    const userList = users.map(user => {
        const isMe = user._id.toString() == req.session.userId;
        return {
            user: isMe ? "me" : "friend",
            userId: user._id,
            username: user.username,
            socket: user.socket,
        }
    }); 
    res.json({userList});
})

router.get("/cookie-test", requireAuth, async(req,res) => {
    res.json(req.session);
})





module.exports = router