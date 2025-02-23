"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext.js";
import { ethers } from "ethers";
import Link from "next/link";

export default function Profile() {
  const { account, provider } = useContext(WalletContext);
  const [tickets, setTickets] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [resalePrice, setResalePrice] = useState({});
  const [loading, setLoading] = useState(true);

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
            "function getTicketDetails(uint256 ticketId) external view returns (uint256, bool, uint256, string memory)",
            "function getOrganizerEvents(address organizer) external view returns (uint256[])",
            "function getEventDetails(uint256 eventId) external view returns (string memory, string memory, string memory, uint256, uint256, uint256, uint256, string memory)",
            "function resalePrices(uint256 ticketId) external view returns (uint256)"
          ],
          signer
        );

        console.log("📢 Fetching ticket count...");
        const ticketCount = await contract.balanceOf(account);
        let userTickets = [];

        for (let i = 0; i < ticketCount; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(account, i);
          console.log(`📢 Fetching details for Ticket ID ${tokenId.toString()}...`);
          const [eventId, used, purchaseTimestamp, txHash] = await contract.getTicketDetails(tokenId);
          const price = await contract.resalePrices(tokenId);
          const eventDetails = await contract.getEventDetails(eventId);

          userTickets.push({
            id: tokenId.toString(),
            eventId: eventId.toString(),
            used,
            transactionHash: txHash,
            purchaseDate: new Date(Number(purchaseTimestamp) * 1000).toLocaleString(),
            eventDate: new Date(Number(eventDetails[6]) * 1000).toLocaleString(),
            venue: eventDetails[2],
            eventName: eventDetails[0],
            eventImage: eventDetails[7],
            resalePrice: price > 0 ? ethers.formatEther(price) : null
          });
        }

        console.log("📢 Fetching organizer's events...");
        const eventsCreated = await contract.getOrganizerEvents(account);
        let createdEvents = [];
        for (let eventId of eventsCreated) {
          const event = await contract.getEventDetails(eventId);
          createdEvents.push({
            id: eventId.toString(),
            name: event[0],
            description: event[1],
            ticketPrice: ethers.formatEther(event[3]) + " ETH",
            maxTickets: event[4],
            ticketsSold: event[5],
            eventDate: new Date(Number(event[6]) * 1000).toLocaleString(),
            venue: event[2],
            image: event[7],
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

  const handleListForResale = async (ticketId) => {
    if (!resalePrice[ticketId] || isNaN(resalePrice[ticketId])) {
      return alert("❌ Please enter a valid resale price.");
    }

    try {
      console.log("📢 Getting signer...");
      const signer = provider.getSigner();
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
            </div>
          ))}
        </div>
      )}

      <h1 style={{ marginTop: "30px" }}>🎭 Your Events</h1>
      <Link href="/organize">
        <button style={{ padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginBottom: "20px" }}>
          ➕ Organize an Event
        </button>
      </Link>
    </div>
  );
}
