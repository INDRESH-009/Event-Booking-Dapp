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
// ✅ List Ticket for Resale
export async function listResaleTicket(req, res) {
  try {
    const { ticketId, price } = req.body;

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    const tx = await contract.listForSale(ticketId, ethers.parseEther(price.toString()));
    await tx.wait();

    res.json({ message: "Ticket listed for resale!", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to list ticket for resale" });
  }
}

// ✅ Buy Resale Ticket
export async function buyResaleTicket(req, res) {
  try {
    const { ticketId, price } = req.body;

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    const tx = await contract.buyResaleTicket(ticketId, { value: ethers.parseEther(price.toString()) });
    await tx.wait();

    res.json({ message: "Ticket purchased successfully!", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to buy resale ticket" });
  }
}

// ✅ Fetch Resale Listings
export async function getResaleListings(req, res) {
  try {
    let resaleListings = [];

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    const totalTickets = await contract.ticketCounter();
    for (let i = 1; i <= totalTickets; i++) {
        const price = await contract.resalePrices(i);
        if (price > 0) {
            resaleListings.push({
                ticketId: i,
                price: ethers.formatEther(price)
            });
        }
    }

    res.json({ success: true, resaleListings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch resale listings" });
  }
}

// ✅ Withdraw Event Earnings (Organizer)
export async function withdrawEarnings(req, res) {
  try {
    const { eventId } = req.body;

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    const tx = await contract.withdrawEarnings(eventId);
    await tx.wait();

    res.json({ message: "Earnings withdrawn successfully!", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to withdraw earnings" });
  }
}

// ✅ Withdraw Resale Royalties (Organizer)
export async function withdrawRoyalties(req, res) {
  try {
    const { eventId } = req.body;

    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    const tx = await contract.withdrawResaleRoyalties(eventId);
    await tx.wait();

    res.json({ message: "Resale royalties withdrawn successfully!", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to withdraw royalties" });
  }
}