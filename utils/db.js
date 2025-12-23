// const { Pool } = require("pg");

// const pool = new Pool({
//   host: "localhost",
//   port: 5432,
//   user: "postgres",
//   password: "Berat437..",
//   database: "sudoku"
// });

// pool.connect();

// module.exports = pool;

const mongoose = require("mongoose");

const connectDB = async() => {
    try {
        await mongoose.connect("mongodb://localhost:27017/sudoku");
        console.log("MongoDB connected");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

module.exports = connectDB;