import express from "express";
import {
    createEvent,
    getEventInfo,
    listResaleTicket,
    buyResaleTicket,
    getResaleListings
  } from "../controllers/ticket.controller.js";
  

const router = express.Router();

router.post("/events", createEvent);
router.get("/events/:eventId", getEventInfo);
router.post("/tickets/list-resale", listResaleTicket);
router.post("/tickets/buy-resale", buyResaleTicket);
router.get("/tickets/resale-listings", getResaleListings);

export default router;