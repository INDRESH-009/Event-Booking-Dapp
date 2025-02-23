import express from "express";
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { withdrawEarnings, withdrawRoyalties } from "../controllers/ticket.controller.js";


dotenv.config();

const router = express.Router();
const contractAddress = process.env.CONTRACT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);

// ✅ Fix JSON Import in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractABIPath = path.join(__dirname, "../config/contractABI.json");
const contractABI = JSON.parse(fs.readFileSync(contractABIPath, "utf8"));

// ✅ Ensure ABI is an array
if (!Array.isArray(contractABI)) {
    console.error("❌ ABI is not an array. Check contractABI.json format.");
    throw new Error("Invalid ABI: contractABI must be an array.");
}

const contract = new ethers.Contract(contractAddress, contractABI, provider);

// 📌 Get organizer's total earnings for an event
router.get("/earnings/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;
        const eventDetails = await contract.events(eventId);
        res.json({ totalEarnings: ethers.formatEther(eventDetails.totalEarnings) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ✅ New Routes for Withdrawal
router.post("/withdraw-earnings", withdrawEarnings);
router.post("/withdraw-royalties", withdrawRoyalties);
export default router;
