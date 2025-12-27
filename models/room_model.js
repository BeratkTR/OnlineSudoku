const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, trim: true},
        difficulty: String,
        board: [[Number]],
        initial_data: [[Number]],
        solution: [[Number]],

        users: {type: [String], default: null},
        notesBoard: { type: [[[Number]]], default: [] },
        ownersBoard: { type: [[String]], default: [] },
        messages: [{
            sender: String,
            content: String,
            timestamp: { type: Date, default: Date.now }
        }]
    }
)

module.exports = mongoose.model("Room", roomSchema)