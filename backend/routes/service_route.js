import express from "express";
import { getAllServices, getSixServices, getSingleService } from "../controllers/cacheServices.js";

const router = express.Router();

// @desc    Fetch all services
// @route   GET /api/v1/services/all with caching
// @access  Public
router.get('/all', getAllServices);

// @desc    Fetch 6 services per page (paginated & cached)
// @route   GET /api/v1/services/six
// @access  Public
router.get('/show', getSixServices);

// @desc    Fetch single service by ID (cached)
// @route   GET /api/v1/services/:id
// @access  Public
router.get('/:id', getSingleService);

export default router;