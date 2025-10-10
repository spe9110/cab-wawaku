import nodemailer from 'nodemailer';
import { USER_SENDER, PASSWORD } from './keys.js';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: USER_SENDER,
        pass: PASSWORD
    },
    pool: true,          // enable connection pooling
    maxConnections: 5,   // keep up to 5 connections alive
    maxMessages: 100,    // send up to 100 emails per connection
    rateLimit: 5,        // avoid hitting Gmail rate limits
    tls: {
        rejectUnauthorized: false
    }
});


/*
Why this fixes the slowness

With pooling: Nodemailer reuses SMTP connections instead of creating a new one each time.

Your API responds much faster, especially when multiple users send messages.

    pool: true,          // ✅ enable connection pooling
    maxConnections: 5,   // keep up to 5 connections alive
    maxMessages: 100,    // send up to 100 emails per connection
    rateLimit: 5,        // avoid hitting Gmail rate limits

*/ 