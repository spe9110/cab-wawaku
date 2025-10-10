import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`You are connected to the database: ${conn.connection.host}`);
    } catch (error) {
        console.error(`You failed to connect to the database: ${error.message}`);
        process.exit(1); // Exit the process with failure
    }
};

export default connectDB;