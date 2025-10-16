import express from 'express';
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet"
import cookieParser from 'cookie-parser';
import connectDB from './Config/db.js';
import requestLogger from './middlewares/requestLogger.js';
import { notFound, errorHandler } from './Middlewares/errorHandler.js';
import bodyParser from 'body-parser';
import expressListEndpoints from 'express-list-endpoints';
import userRoute from "./routes/user_route.js";
import authRoute from './routes/auth_route.js';
// import feedbackRoute from './Routes/feedback_route.js'
// import serviceRoute from './Routes/service_route.js'
// import addressRoute from "./Routes/address_route.js"
// import lawyerRoute from "./Routes/lawyer_route.js"
// import customerRoute from './Routes/customer_route.js'
// import contactRoute from './Routes/contactMessage_route.js'
// import appointmentRoute from "./Routes/appointment_route.js"
import cors from 'cors';
import promClient from 'prom-client';
import passport from 'passport';
import { passportConfig } from './config/passport.js';


// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

const app = express();
const PORT = process.argv[2] || process.env.PORT || 4000;

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);

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
app.use(morgan('dev'));
// Middleware for parsing cookies
app.use(cookieParser());

// Initialize Passport for authentication
app.use(passport.initialize());
passportConfig(passport);

//Middleware to handle Routes
app.use('/api/v1/auth/users', authRoute);
app.use('/api/v1/users', userRoute);
// app.use('/api/v1/feedback', feedbackRoute);
// app.use('/api/v1/service', serviceRoute);
// app.use('/api/v1/lawyer', lawyerRoute);
// app.use('/api/v1/address', addressRoute);
// app.use('/api/v1/customer', customerRoute);
// app.use('/api/v1/contact', contactRoute);
// app.use('/api/v1/appointment', appointmentRoute)

// --- Health check ---
app.get('/', (req, res) => res.send('✅ Wawaku Law Firm backend is running'));
app.get('/favicon.ico', (req, res) => res.status(204).end());
// --- Prometheus metrics endpoint ---
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// Error handler middleware
app.use(notFound);
app.use(errorHandler);


// --- Start server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(expressListEndpoints(app));
})


// npm install express cors dotenv mongoose joi nodemailer
// npm install bcryptjs body-parser jsonwebtoken passport passport-jwt cookie-parser helmet
// npm i express-rate-limit axios luxon
// npm i request-ip morgan
// npm i winston
// npm i node-cache
// npm i prom-client
// npm install --save-dev nodemon
// npm i winston-daily-rotate-file winston-loki
// npm i express-list-endpoints

/*

Security (Helmet, CORS)

Request logging & metrics

Error handling

Ready for Docker and scaling
✅ Production-grade logging (Winston + Loki + rotation)
✅ Prometheus metrics for monitoring
✅ Safe error handling & scrubbing
✅ Ready for scaling & observability

*/ 