const http = require("http")
const connectDB = require("./utils/db.js")
const app = require("./app.js")
const initSockets = require("./sockets")

// const app = express();
// const server = http.createServer(app)
// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"]
//     }
// })
connectDB();
const server = http.createServer(app);
initSockets(server);

const mongoose = require("mongoose");
const User = require("./models/user_model.js")
mongoose.connection.once("open", async () => {
    await User.updateMany(
        {},
        { $set: { socket: null} }
    );
    console.log("Presence reset");
});

server.listen(3000, () => {
    console.log("Running on 3000")
})