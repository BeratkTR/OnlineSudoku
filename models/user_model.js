const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        username: {type: String, required: true, trim: true},
        password: {type: String, required: true},
        online: {type: Boolean, required: true, default: true},
        active_room: {type: String, default: null},
        socket: {type: String, default: null}
    }
)

module.exports = mongoose.model("User", userSchema)