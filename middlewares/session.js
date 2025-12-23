const session = require("express-session")
const MongoStore = require("connect-mongo").default

const sessionMiddleware = session({
                                    secret: "şasdfşlsajdfk",
                                    resave: false,
                                    saveUninitialized: false,

                                     store: MongoStore.create({
                                        mongoUrl: "mongodb://localhost:27017/sudoku",
                                        collectionName: "sessions",
                                        ttl: 60 * 60 * 24 * 7          // 7 days
                                    }),

                                    cookie: {
                                        secure: false,  //HTTP
                                        // maxAge: 1000 * 60 * 60   // 1 hour
                                        sameSite: "lax"
                                    }
                                })

module.exports = sessionMiddleware;