import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from '../Models/user.model.js';
import { secretOrKey } from "./keys.js";

// Extract token from cookies
const cookieExtractor = req => {
    if (req && req.cookies && req.cookies.AccessToken) {
        return req.cookies.AccessToken;
    }
    return null;
};

// Try header first, then cookie
const combinedExtractor = req => {
    let token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
        token = cookieExtractor(req);
    }
    return token;
};

// JWT Strategy
const opts = {
    jwtFromRequest: combinedExtractor, 
    secretOrKey
};

export const passportConfig = (passport) => {
    passport.use(
        new JwtStrategy(opts, async (jwt_payload, done) => {
            try {
                const user = await User.findById(jwt_payload.id);
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (error) {
                console.error("Error in passport strategy:", error);
                return done(error, false);
            }
        })
    );
};

// Middleware to protect routes
export const requiredAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, please login to continue",
                error: info ? info.message : "No token provided or invalid token"
            });
        }
        req.user = user;
        next();
    })(req, res, next);
};