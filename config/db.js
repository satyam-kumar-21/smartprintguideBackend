const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // ...existing code...
    } catch (error) {
        console.error("❌ MongoDB connection error");
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
