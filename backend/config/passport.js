import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/user.model.js";
import { secretOrKey } from "./keys.js";
import logger from "./logger.js";

// Extract token from cookies
const cookieExtractor = (req) => {
  if (req && req?.cookies && req.cookies.AccessToken) {
    return req.cookies.AccessToken;
  }
  return null;
};

// Try header first, then cookie
const combinedExtractor = (req) => {
  let token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (!token) {
    token = cookieExtractor(req);
  }
  return token;
};

// JWT options
const opts = {
  jwtFromRequest: combinedExtractor,
  secretOrKey,
};

// Register JWT strategy
export const passportConfig = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
          return done(null, user);
        } else {
          logger.warn(`JWT payload valid but user not found: ${jwt_payload.id}`);
          return done(null, false);
        }
      } catch (error) {
        logger.error("Error in passport JWT strategy", { error });
        return done(error, false);
      }
    })
  );
};

// Middleware to protect routes
export const requiredAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      logger.error("Passport authentication error", { error: err });
      return next(err);
    }

    if (!user) {
      logger.warn("Unauthorized access attempt", {
        path: req.originalUrl,
        reason: info ? info.message : "No token provided or invalid token",
      });

      return res.status(401).json({
        message: "Unauthorized access, please login to continue",
        error: info ? info.message : "No token provided or invalid token",
      });
    }

    // Authenticated user
    req.user = user;
    next();
  })(req, res, next);
};
