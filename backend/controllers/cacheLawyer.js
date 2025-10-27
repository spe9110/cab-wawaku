import cache from "../Utils/cache.js";
import logger from "../Utils/logger.js";
import Lawyer from "../models/lawyer.model.js";

// @desc This route is used to get all lawyer data
// @route api/v1/lawyer/
// @access PUBLIC
export const getAllLawyers = async (req, res, next) => {
  try {
    logger.info("Fetching all lawyers", { requestedBy: req.user?.id || "anonymous" });

    // Setup unique cache key
    const cacheKey = "all_lawyers";

    // ✅ 1. Check if data exists in cache
    if (cache.has(cacheKey)) {
      logger.info("Lawyers retrieved from cache", { requestedBy: req.user?.id || "anonymous" });

      const cachedData = cache.get(cacheKey);
      return res.status(200).json({
        success: true,
        message: "Lawyers retrieved successfully (from cache)",
        count: cachedData.count,
        lawyers: cachedData.lawyers,
      });
    }

    // ✅ 2. Fetch from DB
    const lawyers = await Lawyer.find({});
    if (lawyers.length === 0) {
      logger.warn("No lawyers found in database", { requestedBy: req.user?.id || "anonymous" });
      return next({ status: 404, message: "No lawyer found" });
    }

    const lawyerCount = await Lawyer.countDocuments();

    const result = {
      count: lawyerCount,
      lawyers,
    };

    // ✅ 3. Store in cache
    cache.set(cacheKey, result, 600); // Cache for 10 minutes

    logger.info("Lawyers fetched from DB and cached successfully", {
      count: lawyerCount,
      requestedBy: req.user?.id || "anonymous",
    });

    // ✅ 4. Send response
    return res.status(200).json({
      success: true,
      message: "Lawyers retrieved successfully",
      count: lawyerCount,
      lawyers,
    });
  } catch (error) {
    logger.error("Error fetching all lawyers", { error });
    next({ status: 500, message: error.message });
  }
};

// @desc This route is used to get a single lawyer data
// @route api/v1/lawyer/:id
// @access PUBLIC
export const getSingleLawyer = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info("Fetching single lawyer", { lawyerId: id, requestedBy: req.user?.id || "anonymous" });

    const cacheKey = `lawyer_${id}`;

    // ✅ 1. Check cache first
    if (cache.has(cacheKey)) {
      logger.info("Lawyer retrieved from cache", { lawyerId: id });
      const cachedLawyer = cache.get(cacheKey);

      return res.status(200).json({
        success: true,
        message: "Lawyer retrieved successfully (from cache)",
        lawyer: cachedLawyer,
      });
    }

    // ✅ 2. Fetch from DB
    const lawyer = await Lawyer.findById(id);
    if (!lawyer) {
      logger.warn("Lawyer not found", { lawyerId: id });
      return next({ status: 404, message: "No lawyer profile found" });
    }

    // ✅ 3. Store in cache
    cache.set(cacheKey, lawyer, 600); // Cache for 10 minutes

    logger.info("Lawyer fetched from DB and cached successfully", { lawyerId: id });

    // ✅ 4. Send response
    return res.status(200).json({
      success: true,
      message: "Lawyer retrieved successfully",
      lawyer,
    });
  } catch (error) {
    logger.error("Error fetching single lawyer", { error, lawyerId: req.params.id });
    next({ status: 500, message: error.message });
  }
};
