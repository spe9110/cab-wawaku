import Service from "../models/service.model.js";
import cache from "../Utils/cache.js";
import logger from "../config/logger.js";


// @desc    Fetch all services
// @route   GET /api/v1/services/all with caching
// @access  Public
export const getAllServices = async (req, res, next) => {
  try {
    // Setup unique cache key
    const cacheKey = "all_services"; // Unique key for caching all services

    // ✅ 1. Check if data exists in cache
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);

      logger.info("✅ Services retrieved from cache", {
        requestedBy: req.user?.id || "anonymous",
      });

      return res.status(200).json({
        success: true,
        message: "Services fetched successfully (from cache)",
        count: cachedData.count,
        services: cachedData.data,
      });
    }

    // ✅ 2. Fetch from DB (if not cached)
    const services = await Service.find({}).sort({ createdAt: 1 }); // older first

    if (services.length === 0) {
      logger.warn("⚠️ No services found in database", {
        requestedBy: req.user?.id || "anonymous",
      });
      return next({ status: 404, message: "No service found" });
    }

    // ✅ 3. Count total documents
    const totalService = await Service.countDocuments();

    const result = {
      count: totalService,
      data: services,
    };

    // ✅ 4. Store in cache (for faster future requests)
    cache.set(cacheKey, result, 3600); // cache for 1 hour (best practice)

    logger.info("✅ Services fetched from DB and cached successfully", {
      count: services.length,
      requestedBy: req.user?.id || "anonymous",
    });

    // ✅ 5. Send response
    return res.status(200).json({
      success: true,
      message: "Services fetched successfully (from DB)",
      count: totalService,
      services,
    });
  } catch (error) {
    logger.error("❌ Error fetching services", { error });
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// @desc    Fetch 6 services per page (paginated & cached)
// @route   GET /api/v1/services/six
// @access  Public
export const getSixServices = async (req, res, next) => {
  try {
    // ✅ Extract pagination parameters
    let { page = 1, limit = 6 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // ✅ Generate unique cache key per page
    const cacheKey = `services_page_${page}_limit_${limit}`;

    // ✅ 1. Check if data exists in cache
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);

      logger.info("✅ Paginated services retrieved from cache", {
        page,
        limit,
        requestedBy: req.user?.id || "anonymous",
      });

      return res.status(200).json({
        success: true,
        message: "Services fetched successfully (from cache)",
        page,
        limit,
        totalPages: cachedData.totalPages,
        totalService: cachedData.totalService,
        count: cachedData.count,
        services: cachedData.services,
      });
    }

    // ✅ 2. Fetch from DB (if not cached)
    const services = await Service.find({})
      .sort({ createdAt: 1 }) // older first
      .skip(skip)
      .limit(limit);

    // ✅ 3. Count total documents
    const totalService = await Service.countDocuments();

    if (services.length === 0) {
      logger.warn("⚠️ No services found for this page", { page, limit });
      return next({ status: 404, message: "No service found" });
    }

    const totalPages = Math.ceil(totalService / limit);

    const result = {
      totalService,
      totalPages,
      count: services.length,
      services,
    };

    // ✅ 4. Store result in cache for 1 hour
    cache.set(cacheKey, result, 3600); // 1 hour TTL

    logger.info("✅ Paginated services fetched from DB and cached successfully", {
      page,
      limit,
      count: services.length,
      requestedBy: req.user?.id || "anonymous",
    });

    // ✅ 5. Send response
    return res.status(200).json({
      success: true,
      message: "Services fetched successfully (from DB)",
      page,
      limit,
      totalPages,
      totalService,
      count: services.length,
      services,
    });
  } catch (error) {
    logger.error("❌ Error fetching paginated services", {
      error: error.message,
    });
    next({ status: 500, message: error.message });
  }
};

// @desc    Fetch single service by ID (cached)
// @route   GET /api/v1/services/:id
// @access  Public
export const getSingleService = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info("Fetching single service", {
      serviceId: id,
      requestedBy: req.user?.id || "anonymous",
    });

    // ✅ 1. Define unique cache key for this service
    const cacheKey = `service_${id}`;

    // ✅ 2. Check cache first
    if (cache.has(cacheKey)) {
      const cachedService = cache.get(cacheKey);

      logger.info("✅ Single service retrieved from cache", { serviceId: id });

      return res.status(200).json({
        success: true,
        message: "Service fetched successfully (from cache)",
        service: cachedService,
      });
    }

    // ✅ 3. Fetch from DB if not in cache
    const service = await Service.findById(id);

    if (!service) {
      logger.warn("⚠️ Service not found", { serviceId: id });
      return next({ status: 404, message: "Service not found" });
    }

    // ✅ 4. Store in cache (for 1 hour)
    cache.set(cacheKey, service, 3600);

    logger.info("✅ Single service fetched from DB and cached successfully", {
      serviceId: id,
      requestedBy: req.user?.id || "anonymous",
    });

    // ✅ 5. Return response
    return res.status(200).json({
      success: true,
      message: "Service fetched successfully (from DB)",
      service,
    });
  } catch (error) {
    logger.error("❌ Error fetching single service", {
      error: error.message,
      serviceId: req.params.id,
    });
    next({ status: 500, message: error.message });
  }
};
