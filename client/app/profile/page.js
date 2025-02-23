"use client";
const approvalABI = [
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external"
];

import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext.js";
import { ethers } from "ethers";
import Link from "next/link";


export default function Profile() {
  const { account, provider, signer } = useContext(WalletContext);
  const [tickets, setTickets] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [resalePrice, setResalePrice] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasApproval, setHasApproval] = useState(false);


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
            // Use auto-generated getters:
            "function tickets(uint256 ticketId) external view returns (uint256 eventId, bool used, uint256 purchaseTimestamp, string txHash)",
            "function events(uint256 eventId) external view returns (string name, string description, string venue, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 eventDate, string bannerImage, address organizer, uint256 totalEarnings, uint256 totalResaleEarnings)",
            "function getOrganizerEvents(address organizer) external view returns (uint256[])",
            "function resalePrices(uint256 ticketId) external view returns (uint256)",
            "function resaleHistory(uint256 ticketId) external view returns (uint256)",
            // Add these lines along with your other ABI definitions:
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
          // Fetch ticket details from the tickets mapping
          const [eventId, used, purchaseTimestamp, txHash] = await contract.tickets(tokenId);
          // Fetch event details from the events mapping
          const eventData = await contract.events(eventId);
          // Destructure only the needed fields (first eight)
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;

          // Fetch the resale count for this ticket
          const resaleCount = await contract.resaleHistory(tokenId);

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
            resalePrice: (await contract.resalePrices(tokenId)) > 0 ? ethers.formatEther(await contract.resalePrices(tokenId)) : null,
            // New properties:
            originalPrice: ethers.formatEther(ticketPrice),
            resaleCount: Number(resaleCount)
          });

        }

        console.log("📢 Fetching organizer's events...");
        const eventsCreated = await contract.getOrganizerEvents(account);
        let createdEvents = [];
        for (let eventId of eventsCreated) {
          // Use the auto-generated getter for events
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

  const handleSetApprovalForAll = async () => {
    try {
      console.log("📢 Setting global approval for contract...");
      // Create a contract instance using the approvalABI and your signer
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        approvalABI,
        signer
      );
      const tx = await contract.setApprovalForAll(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, true);
      await tx.wait();
      alert("✅ Contract approved for all transfers.");
      // Optionally, update local state to indicate approval is set.
      setHasApproval(true);
    } catch (error) {
      console.error("❌ Error setting approval:", error);
      alert("⚠️ Failed to set approval.");
    }
  };
  
  useEffect(() => {
    if (!account || !provider) return;
    
    async function checkApproval() {
      try {
        // Use a contract instance with the approval ABI for the check.
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
      // Create a contract instance with the signer (not provider)
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function listForSale(uint256 ticketId, uint256 price) external"],
        signer
      );
  
      console.log("📢 Listing ticket for resale...");
      const tx = await contract.listForSale(ticketId, ethers.parseEther(resalePrice[ticketId].toString()));
      await tx.wait();
  
      alert(`✅ Ticket ID ${ticketId} listed for resale at ${resalePrice[ticketId]} ETH!`);
      setResalePrice((prev) => ({ ...prev, [ticketId]: "" })); // Reset input field
    } catch (error) {
      console.error("❌ Error listing ticket for resale:", error);
      alert("⚠️ Failed to list ticket.");
    }
  };

  if (loading) return <p>⏳ Loading your profile...</p>;
  if (!account) return <p>❌ Please connect your wallet.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎟 Your Tickets</h1>
      {tickets.length === 0 ? (
        <p>❌ You haven't bought any tickets yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "10px" }}>
              <img src={ticket.eventImage} alt={ticket.eventName} width="100%" height="180px" style={{ borderRadius: "10px", objectFit: "cover" }} />
              <h2>{ticket.eventName}</h2>
              <p><strong>Ticket ID:</strong> {ticket.id}</p>
              <p><strong>Event ID:</strong> {ticket.eventId}</p>
              <p><strong>Venue:</strong> {ticket.venue}</p>
              <p><strong>Event Date:</strong> {ticket.eventDate}</p>
              <p><strong>Purchase Date:</strong> {ticket.purchaseDate}</p>
              <p><strong>Status:</strong> {ticket.used ? "❌ Used" : "✅ Valid"}</p>
              <p>
                <strong>Transaction:</strong>{" "}
                <a href={`https://sepolia.etherscan.io/tx/${ticket.transactionHash}`} target="_blank" rel="noopener noreferrer">
                  {ticket.transactionHash.slice(0, 15)}...
                </a>
              </p>

              {ticket.resalePrice ? (
  <p><strong>Resale Price:</strong> {ticket.resalePrice} ETH</p>
) : (
  <>
    {/* If global approval is not set, display a button to approve */}
    {!hasApproval && (
      <button
        onClick={handleSetApprovalForAll}
        style={{
          padding: "8px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "5px"
        }}
      >
        Approve for Resale
      </button>
    )}
    {hasApproval && (
      <>
        <input
          type="number"
          placeholder="Set resale price (ETH)"
          className="border p-2 rounded my-2"
          value={resalePrice[ticket.id] || ""}
          onChange={(e) => setResalePrice({ ...resalePrice, [ticket.id]: e.target.value })}
        />
        <button
          onClick={() => handleListForResale(ticket.id)}
          style={{
            padding: "10px",
            backgroundColor: "orange",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px"
          }}
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

<h1 style={{ marginTop: "30px" }}>🎭 Your Events</h1>
{organizerEvents.length === 0 ? (
  <p>You haven't organized any events yet.</p>
) : (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "20px",
    }}
  >
    {organizerEvents.map((event) => (
      <div
        key={event.id}
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          borderRadius: "10px",
        }}
      >
        <img
          src={event.image}
          alt={event.name}
          width="100%"
          height="180px"
          style={{ borderRadius: "10px", objectFit: "cover" }}
        />
        <h2>{event.name}</h2>
        <p>
          <strong>Ticket Price:</strong> {event.ticketPrice}
        </p>
        <p>
          <strong>Venue:</strong> {event.venue}
        </p>
        <p>
          <strong>Date:</strong> {event.eventDate}
        </p>
        <p>
          <strong>Tickets Sold:</strong> {event.ticketsSold} /{" "}
          {event.maxTickets}
        </p>
        {/* Dashboard Button */}
        <Link href={`/dashboard/${event.id}`} style={{ textDecoration: "none" }}>
          <button
            style={{
              padding: "10px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Dashboard
          </button>
        </Link>
      </div>
    ))}
  </div>
)}
<Link href="/organize">
  <button
    style={{
      padding: "10px",
      backgroundColor: "#28a745",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginTop: "20px",
    }}
  >
    ➕ Organize an Event
  </button>
</Link>


    </div>
  );
}
