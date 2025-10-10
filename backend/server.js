import express from 'express';
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet"
import cookieParser from 'cookie-parser';
import connectDB from './Config/db.js';
// import { notFound, errorHandler } from './Middlewares/errorHandler.js';
import bodyParser from 'body-parser';
// import userRoute from "./Routes/user_route.js";
// import authRoute from './Routes/auth_route.js';
// import feedbackRoute from './Routes/feedback_route.js'
// import serviceRoute from './Routes/service_route.js'
// import addressRoute from "./Routes/address_route.js"
// import lawyerRoute from "./Routes/lawyer_route.js"
// import customerRoute from './Routes/customer_route.js'
// import contactRoute from './Routes/contactMessage_route.js'
// import appointmentRoute from "./Routes/appointment_route.js"
import cors from 'cors';
import passport from 'passport';
// import { passportConfig } from './Config/passport.js';

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

const app = express();
const PORT = process.argv[2] || process.env.PORT || 4000;

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// handle static file
// app.set('Views', path.join(__dirname, 'Views'));
// Enable cors 
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

// Help secure Express apps by setting HTTP response headers.
app.use(helmet());
 // Middleware for logging requests to the console better for debugging
app.use(morgan('combined'));
// Middleware for parsing cookies
app.use(cookieParser());

// Initialize Passport for authentication
// app.use(passport.initialize());
// passportConfig(passport);

//Middleware to handle Routes
// app.use('/api/v1/auth/users', authRoute);
// app.use('/api/v1/users', userRoute);
// app.use('/api/v1/feedback', feedbackRoute);
// app.use('/api/v1/service', serviceRoute);
// app.use('/api/v1/lawyer', lawyerRoute);
// app.use('/api/v1/address', addressRoute);
// app.use('/api/v1/customer', customerRoute);
// app.use('/api/v1/contact', contactRoute);
// app.use('/api/v1/appointment', appointmentRoute)

app.get('/', (req, res) => {
    res.send("Wawaku law firm is Dockerize successfully")
})

// Error handler middleware
// app.use(notFound);
// app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})


// npm install express cors dotenv mongoose
// npm install bcryptjs body-parser jsonwebtoken passport passport-jwt cookie-parser helmet
// npm i express-rate-limit axios luxon
// npm i request-ip morgan
// npm i winston
// npm i node-cache
// npm i prom-client
// npm install --save-dev nodemon