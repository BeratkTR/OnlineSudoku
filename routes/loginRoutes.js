const express = require('express');
const router = express.Router();
const User = require("../models/user_model")


router.post("/login", async(req,res) => {
    const {username, password} = req.body;
    try{
        const user = await User.findOne({username});
        if(!user){
            const user = await User.create({username, password});
            // req.session.userId = user._id.toString()
            req.session.userId = user._id
            return res.sendStatus(200)
        }
        if(user.password != password) return res.sendStatus(401);
        req.session.userId = user._id.toString()
        res.sendStatus(200)
    }
    catch(err){
        console.log(err);
        return res.sendStatus(500)
    }
})

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.sendStatus(200);
  });
});

module.exports = router;