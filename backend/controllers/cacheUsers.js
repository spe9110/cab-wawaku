import User from "../models/user.model.js";
import cache from "../Utils/cache.js";
import logger from "../config/logger.js"; 

//@route   GET /api/v1/users
//@desc    Get all users with caching
//@access  PRIVATE
export const getAllUsers = async (req, res, next) => {
  try {
    const cacheKey = "all_users"; // unique string key for caching this data

    // ✅ 1. Check if data exists in cache
    if (cache.has(cacheKey)) {
      logger.info("Users retrieved from cache", {
        requestedBy: req.user?.id || "anonymous",
      });

      const cachedData = cache.get(cacheKey);

      return res.status(200).json({
        message: "Users fetched successfully (from cache)",
        count: cachedData.count,
        data: cachedData.data,
      });
    }

    // ✅ 2. Fetch data from the database if not cached
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");

    if (!users || users.length === 0) {
      logger.warn("No users found in database", {
        requestedBy: req.user?.id || "anonymous",
      });
      return next({ status: 404, message: "No users found" });
    }

    const usersTotal = await User.countDocuments();

    const result = {
      count: usersTotal,
      data: users,
    };

    // ✅ 3. Cache the result
    cache.set(cacheKey, result);

    logger.info("Users fetched from DB and cached successfully", {
      count: users.length,
      requestedBy: req.user?.id || "anonymous",
    });

    // ✅ 4. Return response
    res.status(200).json({
      message: "Users fetched successfully (from DB)",
      ...result,
    });
  } catch (error) {
    logger.error("Error fetching users", { error });
    next({ status: 500, error });
  }
};

// @route  GET api/users/current
// @desc  Return current user with caching
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    // Ensure authentication middleware has attached req.user
    if (!req.user) {
      logger.warn("Unauthorized attempt to access current user");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cacheKey = `current_user_${req.user.id}`; // unique cache key for each user

    // ✅ 1. Check cache first
    if (cache.has(cacheKey)) {
      logger.info("Current user retrieved from cache", { userId: req.user.id });

      const cachedUser = cache.get(cacheKey);
      return res.status(200).json({
        message: "User fetched successfully (from cache)",
        ...cachedUser,
      });
    }

    // ✅ 2. Fetch fresh user data
    // If req.user is from JWT, it’s already populated. But let’s re-fetch from DB for latest data.
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      logger.warn("User not found", { userId: req.user.id });
      return next({ status: 404, message: "User not found" });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAccountVerified: user.isAccountVerified,
    };

    // ✅ 3. Cache the user data for quick retrieval next time
    cache.set(cacheKey, userData);

    logger.info("Current user fetched from DB and cached", { userId: req.user.id });

    // ✅ 4. Return response
    res.status(200).json({
      message: "User fetched successfully (from DB)",
      ...userData,
    });
  } catch (error) {
    logger.error("Error fetching current user", { error });
    next({ status: 500, message: "Server error", error });
  }
};

// @route  GET api/v1/user/:id
// @desc   Return user by id (with caching)
// @access Private
export const getSingleUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info("Fetching single user", {
      requestedId: id,
      requestedBy: req.user?.id || "anonymous",
    });

    const cacheKey = `user_${id}`; // ✅ cleaner cache key

    // ✅ 1. Check cache first
    if (cache.has(cacheKey)) {
      const cachedUser = cache.get(cacheKey);

      logger.info("User retrieved from cache", { userId: id });

      return res.status(200).json({
        message: "User fetched successfully (from cache)",
        user: cachedUser,
      });
    }

    // ✅ 2. Fetch from DB if not in cache
    const user = await User.findById(id).select("-password");

    if (!user) {
      logger.warn("User not found", { id });
      return next({ status: 404, message: "User not found" });
    }

    logger.info("User fetched successfully (from DB)", { id });

    // ✅ 3. Store in cache (for faster future requests)
    cache.set(cacheKey, user, 600); // 600 sec = 10 min TTL (optional but recommended)

    return res.status(200).json({
      message: "User fetched successfully (from DB)",
      user,
    });
  } catch (error) {
    logger.error("Error fetching user by ID", { error, id: req.params.id });
    next({ status: 500, message: "Internal Server Error" });
  }
};


/*

Why Use Caching?
Improved Performance: Cache reduces latency and accelerates data retrieval.
Reduced Database Load: Caching reduces the frequency of database queries, leading to better resource utilization.
Enhanced Scalability: Efficient caching helps applications handle increased loads without degrading performance.
Cost Efficiency: Reducing the need for repeated data retrieval from costly resources like databases or external services can save operational costs.


=============
Node-cache has following major functions
.set(key, val, [ ttl ]): Used to set some value corresponding to a particular key in the cache. This same key must be used to retrieve this value.
.get(key):Used to get value set to specified key. It returns undefined, if the key is not already present.
has(key): Used to check if the cache already has some value set for specified key. Returns true if present otherwise false.

*/ 