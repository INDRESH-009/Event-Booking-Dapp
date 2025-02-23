import express from "express";
import { createEvent, getEventInfo } from "../controllers/ticket.controller.js";

const router = express.Router();

router.post("/events", createEvent);
router.get("/events/:eventId", getEventInfo);

export default router;