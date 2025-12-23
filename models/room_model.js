const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, trim: true},
        difficulty: String,
        board: [[Number]],
        initial_data: [[Number]],
        solution: [[Number]],

        users: {type: [String], default: null},
    }
)

module.exports = mongoose.model("Room", roomSchema)