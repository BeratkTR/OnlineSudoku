const express = require("express")

const loginRoutes = require("./routes/loginRoutes.js")
const roomRoutes = require("./routes/roomRoutes.js")
const userRoutes = require("./routes/userRoutes.js")
const sessionMiddleware = require("./middlewares/session.js")

const app = express();

app.use(express.static("public"))
app.use(express.json());
app.use(sessionMiddleware)

app.use("/api", loginRoutes)
app.use("/api", roomRoutes)
app.use("/api", userRoutes)
app.get("/cookie-test", (req,res) => {
    console.log(req.session)
    res.json(req.session)
})

module.exports = app;