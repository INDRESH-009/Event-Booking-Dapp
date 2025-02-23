import "dotenv/config";
import { ethers } from "ethers";
import contractABI from "../config/contractABI.json" assert { type: "json" };

const contractAddress = process.env.CONTRACT_ADDRESS;

export async function createEvent(req, res) {
  try {
    const { name, description, ticketPrice, maxTickets } = req.body;

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    const tx = await contract.createEvent(name, description, ethers.parseEther(ticketPrice), maxTickets);
    await tx.wait();

    res.json({ message: "Event created!", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create event" });
  }
}

export async function getEventInfo(req, res) {
  try {
    const { eventId } = req.params;

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    const [name, description, ticketPrice, maxTickets, ticketsSold] = await contract.getEventDetails(eventId);
    res.json({
      eventId,
      name,
      description,
      ticketPrice: ethers.formatEther(ticketPrice),
      maxTickets,
      ticketsSold,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch event info" });
  }
}