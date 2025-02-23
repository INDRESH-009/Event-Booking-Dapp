"use client";
import { useContext, useState, useEffect } from "react";
import { WalletContext } from "../context/WalletContext";
import Link from "next/link";
import { ethers } from "ethers";

export default function EventsPage() {
  const { account, provider } = useContext(WalletContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provider) return;

    const fetchEvents = async () => {
      try {
        console.log("📢 Connecting to contract...");
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function getTotalEvents() external view returns (uint256)",
            "function getEventDetails(uint256 eventId) external view returns (string memory, string memory, string memory, uint256, uint256, uint256, uint256, string memory)"
          ],
          provider
        );

        console.log("📢 Fetching total events...");
        const totalEvents = await contract.getTotalEvents();
        let fetchedEvents = [];

        for (let i = 1; i <= totalEvents; i++) {
          console.log(`📢 Fetching details for Event ID ${i}...`);
          const event = await contract.getEventDetails(i);

          fetchedEvents.push({
            id: i,
            name: event[0],
            description: event[1],
            venue: event[2],
            ticketPrice: ethers.formatEther(event[3]) + " ETH",
            maxTickets: event[4],
            ticketsSold: event[5],
            eventDate: event[6],
            image: event[7]
          });
        }

        setEvents(fetchedEvents);
        console.log("✅ Events fetched:", fetchedEvents);
      } catch (error) {
        console.error("❌ Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [provider]);

  if (!account) return <p>Please connect your wallet.</p>;
  if (loading) return <p>Loading events...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎭 Available Events</h1>
      {events.length === 0 ? <p>No events found.</p> : events.map((event) => (
        <div key={event.id} style={{ border: "1px solid #ccc", padding: "15px", margin: "15px 0", borderRadius: "10px" }}>
          <img src={event.image} alt={event.name} width="100%" height="200px" style={{ borderRadius: "10px", objectFit: "cover" }} />
          <h2>{event.name}</h2>
          <p><strong>Description:</strong> {event.description}</p>
          <p><strong>Price:</strong> {event.ticketPrice}</p>
          <p><strong>Venue:</strong> {event.venue}</p>
          <p><strong>Date & Time:</strong> {event.eventDate}</p>
          <p><strong>Tickets Sold:</strong> {event.ticketsSold} / {event.maxTickets}</p>

          <Link href={`/event-details/${event.id}`} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
              View Details
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
}
