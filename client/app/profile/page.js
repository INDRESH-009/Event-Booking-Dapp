"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext.js";
import { ethers } from "ethers";
import Link from "next/link";

export default function Profile() {
  const { account, provider } = useContext(WalletContext);
  const [tickets, setTickets] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
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
            // getTicketDetails returns: eventId, used, purchaseTimestamp, txHash
            "function getTicketDetails(uint256 ticketId) external view returns (uint256, bool, uint256, string memory)",
            "function getOrganizerEvents(address organizer) external view returns (uint256[])",
            // getEventDetails returns: name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage
            "function getEventDetails(uint256 eventId) external view returns (string memory, string memory, string memory, uint256, uint256, uint256, uint256, string memory)"
          ],
          signer
        );

        console.log("📢 Fetching ticket count...");
        const ticketCount = await contract.balanceOf(account);
        let userTickets = [];
        for (let i = 0; i < ticketCount; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(account, i);
          console.log(`📢 Fetching details for Ticket ID ${tokenId.toString()}...`);
          // Destructure the 4 returned values from getTicketDetails:
          const [eventId, used, purchaseTimestamp, txHash] = await contract.getTicketDetails(tokenId);
          // Use Number() to convert the BigInt purchaseTimestamp
          const purchaseDate = new Date(Number(purchaseTimestamp) * 1000).toLocaleString();
          // Now get event details for this ticket's event:
          const eventDetails = await contract.getEventDetails(eventId);

          userTickets.push({
            id: tokenId.toString(),
            eventId: eventId.toString(),
            used,
            transactionHash: txHash,
            purchaseDate,
            eventDate: new Date(Number(eventDetails[6]) * 1000).toLocaleString(),
            venue: eventDetails[2],
            eventName: eventDetails[0],
            eventImage: eventDetails[7],
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

  if (loading) return <p>Loading your profile...</p>;
  if (!account) return <p>Please connect your wallet.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎟 Your Tickets</h1>
      {tickets.length === 0 ? <p>You haven't bought any tickets yet.</p> : (
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
              
              <Link href={`/resale/${ticket.id}`}>
                <button style={{ padding: "10px", backgroundColor: "orange", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                  Resell Ticket
                </button>
              </Link>
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

      {organizerEvents.length === 0 ? <p>You haven't created any events yet.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {organizerEvents.map((event) => (
            <div key={event.id} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "10px" }}>
              <img src={event.image} alt={event.name} width="100%" height="180px" style={{ borderRadius: "10px", objectFit: "cover" }} />
              <h2>{event.name}</h2>
              <p><strong>Description:</strong> {event.description}</p>
              <p><strong>Price:</strong> {event.ticketPrice}</p>
              <p><strong>Venue:</strong> {event.venue}</p>
              <p><strong>Event Date:</strong> {event.eventDate}</p>
              <p><strong>Tickets Sold:</strong> {event.ticketsSold} / {event.maxTickets}</p>

              <Link href={`/dashboard/${event.id}`}>
                <button style={{ padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "10px" }}>
                  Dashboard
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
