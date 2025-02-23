"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext.js";
import { ethers } from "ethers";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react"; // Import the QRCode component

const approvalABI = [
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external"
];
const balanceABI = [
  "function sellerBalances(address) external view returns (uint256)",
  "function organizerBalances(address) external view returns (uint256)"
];

export default function Profile() {
  const { account, provider, signer } = useContext(WalletContext);
  const [tickets, setTickets] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [resalePrice, setResalePrice] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasApproval, setHasApproval] = useState(false);
  const [sellerFunds, setSellerFunds] = useState("0");
  const [organizerFunds, setOrganizerFunds] = useState("0");

  useEffect(() => {
    if (!account || !provider) return;

    const fetchUserTicketsAndEvents = async () => {
      try {
        console.log("📢 Getting signer...");
        const signer = await provider.getSigner();
        console.log("📢 Connecting to contract...");
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function balanceOf(address owner) external view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
            "function tickets(uint256 ticketId) external view returns (uint256 eventId, bool used, uint256 purchaseTimestamp, string txHash)",
            "function events(uint256 eventId) external view returns (string name, string description, string venue, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 eventDate, string bannerImage, address organizer, uint256 totalEarnings, uint256 totalResaleEarnings)",
            "function getOrganizerEvents(address organizer) external view returns (uint256[])",
            "function resalePrices(uint256 ticketId) external view returns (uint256)",
            "function resaleHistory(uint256 ticketId) external view returns (uint256)",
            "function isApprovedForAll(address owner, address operator) external view returns (bool)",
            "function setApprovalForAll(address operator, bool approved) external"
          ],
          signer
        );

        console.log("📢 Fetching ticket count...");
        const ticketCount = await contract.balanceOf(account);
        let userTickets = [];

        for (let i = 0; i < ticketCount; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(account, i);
          console.log(`📢 Fetching details for Ticket ID ${tokenId.toString()}...`);
          const [eventId, used, purchaseTimestamp, txHash] = await contract.tickets(tokenId);
          const eventData = await contract.events(eventId);
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
          const resaleCount = await contract.resaleHistory(tokenId);
          const rawResalePrice = await contract.resalePrices(tokenId);
          const formattedResalePrice = rawResalePrice > 0 ? ethers.formatEther(rawResalePrice) : null;

          userTickets.push({
            id: tokenId.toString(),
            eventId: eventId.toString(),
            used,
            transactionHash: txHash,
            purchaseDate: new Date(Number(purchaseTimestamp) * 1000).toLocaleString(),
            eventDate: new Date(Number(eventDate) * 1000).toLocaleString(),
            venue,
            eventName: name,
            eventImage: bannerImage,
            resalePrice: formattedResalePrice,
            originalPrice: ethers.formatEther(ticketPrice),
            resaleCount: Number(resaleCount)
          });
        }

        console.log("📢 Fetching organizer's events...");
        const eventsCreated = await contract.getOrganizerEvents(account);
        let createdEvents = [];
        for (let eventId of eventsCreated) {
          const eventData = await contract.events(eventId);
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
          createdEvents.push({
            id: eventId.toString(),
            name,
            description,
            ticketPrice: ethers.formatEther(ticketPrice) + " ETH",
            maxTickets,
            ticketsSold,
            eventDate: new Date(Number(eventDate) * 1000).toLocaleString(),
            venue,
            image: bannerImage,
          });
        }

        setTickets(userTickets);
        setOrganizerEvents(createdEvents);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchUserTicketsAndEvents();
  }, [account, provider]);

  useEffect(() => {
    if (!account || !provider) return;

    async function fetchBalances() {
      try {
        const balanceContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          balanceABI,
          provider
        );
        const sellerBalanceWei = await balanceContract.sellerBalances(account);
        const organizerBalanceWei = await balanceContract.organizerBalances(account);
        setSellerFunds(ethers.formatEther(sellerBalanceWei));
        setOrganizerFunds(ethers.formatEther(organizerBalanceWei));
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    }

    fetchBalances();
  }, [account, provider]);

  const handleSetApprovalForAll = async () => {
    try {
      console.log("📢 Setting global approval for contract...");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        approvalABI,
        signer
      );
      const tx = await contract.setApprovalForAll(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, true);
      await tx.wait();
      alert("✅ Contract approved for all transfers.");
      setHasApproval(true);
    } catch (error) {
      console.error("❌ Error setting approval:", error);
      alert("⚠️ Failed to set approval.");
    }
  };

  const handleWithdrawSellerFunds = async () => {
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function withdrawSellerFunds() external"],
        signer
      );
      const tx = await contract.withdrawSellerFunds();
      await tx.wait();
      alert("Seller withdrawal successful!");
    } catch (error) {
      console.error("Withdrawal failed", error);
      alert("Withdrawal failed!");
    }
  };

  const handleWithdrawOrganizerFunds = async () => {
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function withdrawOrganizerFunds() external"],
        signer
      );
      const tx = await contract.withdrawOrganizerFunds();
      await tx.wait();
      alert("Organizer withdrawal successful!");
    } catch (error) {
      console.error("Organizer withdrawal failed", error);
      alert("Organizer withdrawal failed!");
    }
  };

  useEffect(() => {
    if (!account || !provider) return;

    async function checkApproval() {
      try {
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          approvalABI,
          provider
        );
        const approved = await contract.isApprovedForAll(account, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
        setHasApproval(approved);
        console.log("Global approval status:", approved);
      } catch (error) {
        console.error("Error checking approval:", error);
      }
    }

    checkApproval();
  }, [account, provider]);

  const handleListForResale = async (ticketId) => {
    if (!resalePrice[ticketId] || isNaN(resalePrice[ticketId])) {
      return alert("❌ Please enter a valid resale price.");
    }

    try {
      console.log("📢 Using signer from context...");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function listForSale(uint256 ticketId, uint256 price) external"],
        signer
      );
      console.log("📢 Listing ticket for resale...");
      const tx = await contract.listForSale(ticketId, ethers.parseEther(resalePrice[ticketId].toString()));
      await tx.wait();

      alert(`✅ Ticket ID ${ticketId} listed for resale at ${resalePrice[ticketId]} ETH!`);
      setResalePrice((prev) => ({ ...prev, [ticketId]: "" }));
    } catch (error) {
      console.error("❌ Error listing ticket for resale:", error);
      alert("⚠️ Failed to list ticket.");
    }
  };

  if (loading) return <p className="text-center text-white py-8">⏳ Loading your profile...</p>;
  if (!account) return <p className="text-center text-white py-8">❌ Please connect your wallet.</p>;

  return (
    <div className="min-h-screen bg-black text-white px-8 py-8">
      {/* Your Tickets Section */}
      <h1 className="text-3xl font-bold mb-6">🎟 Your Tickets</h1>
      {tickets.length === 0 ? (
        <p className="text-center">❌ You haven't bought any tickets yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-4">
              <img
                src={ticket.eventImage}
                alt={ticket.eventName}
                className="w-full h-44 object-cover rounded-lg mb-4"
              />
              <h2 className="text-xl font-semibold mb-2">{ticket.eventName}</h2>
              <p className="text-sm mb-1"><strong>Ticket ID:</strong> {ticket.id}</p>
              <p className="text-sm mb-1"><strong>Event ID:</strong> {ticket.eventId}</p>
              <p className="text-sm mb-1"><strong>Venue:</strong> {ticket.venue}</p>
              <p className="text-sm mb-1"><strong>Event Date:</strong> {ticket.eventDate}</p>
              <p className="text-sm mb-1"><strong>Purchase Date:</strong> {ticket.purchaseDate}</p>
              <p className="text-sm mb-1">
                <strong>Status:</strong> {ticket.used ? "❌ Used" : "✅ Valid"}
              </p>
              <p className="text-sm mb-1">
                <strong>Transaction:</strong>{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${ticket.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  {ticket.transactionHash}
                </a>
              </p>
              {/* QR Code for the transaction */}
              <div className="my-4 flex justify-center">
                <QRCodeCanvas
                  value={`https://sepolia.etherscan.io/tx/${ticket.transactionHash}`}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              {ticket.resalePrice ? (
                <p className="text-sm mb-1"><strong>Resale Price:</strong> {ticket.resalePrice} ETH</p>
              ) : (
                <>
                  {!hasApproval && (
                    <button
                      onClick={handleSetApprovalForAll}
                      className="w-full mt-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                    >
                      Approve for Resale
                    </button>
                  )}
                  {hasApproval && (
                    <>
                      <input
                        type="number"
                        placeholder="Set resale price (ETH)"
                        className="w-full border border-gray-500 p-2 rounded my-2 bg-gray-700 text-white"
                        value={resalePrice[ticket.id] || ""}
                        onChange={(e) => setResalePrice({ ...resalePrice, [ticket.id]: e.target.value })}
                      />
                      <button
                        onClick={() => handleListForResale(ticket.id)}
                        className="w-full mt-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
                      >
                        List for Resale
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
  
      {/* Your Events Section */}
      <h1 className="text-3xl font-bold my-8">🎭 Your Events</h1>
      {organizerEvents.length === 0 ? (
        <p className="text-center">You haven't organized any events yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizerEvents.map((event) => (
            <div key={event.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-4">
              <img
                src={event.image}
                alt={event.name}
                className="w-full h-44 object-cover rounded-lg mb-4"
              />
              <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
              <p className="text-sm mb-1"><strong>Ticket Price:</strong> {event.ticketPrice}</p>
              <p className="text-sm mb-1"><strong>Venue:</strong> {event.venue}</p>
              <p className="text-sm mb-1"><strong>Date:</strong> {event.eventDate}</p>
              <p className="text-sm mb-1">
                <strong>Tickets Sold:</strong> {event.ticketsSold} / {event.maxTickets}
              </p>
              <Link href={`/dashboard/${event.id}`} className="block mt-3">
                <button className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
                  Dashboard
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
  
      {/* My Withdrawal Balances Heading */}
      <h2 className="text-2xl font-bold my-6">My Withdrawal Balances</h2>
  
      {/* Grouped Withdrawal and Organize Event Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-between">
          <p className="text-lg mb-4"><strong>Seller Funds:</strong> {sellerFunds} ETH</p>
          <button
            onClick={handleWithdrawSellerFunds}
            disabled={parseFloat(sellerFunds) === 0}
            className={`w-full px-4 py-2 rounded ${
              parseFloat(sellerFunds) === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            Withdraw Seller Funds
          </button>
        </div>
        <div className="flex-1 bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-between">
          <p className="text-lg mb-4"><strong>Organizer Funds:</strong> {organizerFunds} ETH</p>
          <button
            onClick={handleWithdrawOrganizerFunds}
            disabled={parseFloat(organizerFunds) === 0}
            className={`w-full px-4 py-2 rounded ${
              parseFloat(organizerFunds) === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            Withdraw Organizer Funds
          </button>
        </div>
        <div className="flex-1 bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col justify-center items-center">
          <Link href="/organize" className="w-full">
            <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded">
              ➕ Organize an Event
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
  
}
