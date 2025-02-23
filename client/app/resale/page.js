"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext";
import { ethers } from "ethers";
import Link from "next/link";

export default function ResaleTicketsPage() {
  const { account, provider, signer } = useContext(WalletContext);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provider) return;

    async function fetchResaleTickets() {
      try {
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function getResaleTickets() external view returns (uint256[])",
            "function tickets(uint256 ticketId) external view returns (uint256 eventId, bool used, uint256 purchaseTimestamp, string txHash)",
            "function events(uint256 eventId) external view returns (string name, string description, string venue, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 eventDate, string bannerImage, address organizer, uint256 totalEarnings, uint256 totalResaleEarnings)",
            "function resalePrices(uint256 ticketId) external view returns (uint256)"
          ],
          provider
        );
        const ticketIds = await contract.getResaleTickets();
        const ticketsData = [];

        for (let ticketId of ticketIds) {
          // Get ticket details
          const [eventId, used, purchaseTimestamp, txHash] = await contract.tickets(ticketId);
          // Get event details
          const eventData = await contract.events(eventId);
          // Destructure event data (first eight fields)
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
          // Get the resale price for this ticket
          const resalePriceWei = await contract.resalePrices(ticketId);
          const resalePriceEth = ethers.formatEther(resalePriceWei);

          ticketsData.push({
            ticketId: ticketId.toString(),
            eventId: eventId.toString(),
            used,
            purchaseTimestamp,
            txHash,
            eventName: name,
            eventDate: new Date(Number(eventDate) * 1000).toLocaleString(),
            venue,
            bannerImage,
            resalePrice: resalePriceEth
          });
        }
        setResaleTickets(ticketsData);
      } catch (error) {
        console.error("❌ Error fetching resale tickets:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResaleTickets();
  }, [provider]);

  const buyResaleTicket = async (ticketId, price) => {
    if (!signer) return alert("Please connect your wallet.");
    try {
      // Use signer from WalletContext
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function buyResaleTicket(uint256 ticketId) external payable"],
        signer
      );
      console.log("Buying resale ticket", ticketId, "for", price, "ETH");
      const tx = await contract.buyResaleTicket(ticketId, { value: ethers.parseEther(price) });
      await tx.wait();
      alert("✅ Resale ticket purchased successfully!");
      // Refresh the list or reload the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error("❌ Error buying resale ticket:", error);
      alert("Failed to purchase resale ticket: " + error.message);
    }
  };

  if (!account) return <p>Please connect your wallet.</p>;
  if (loading) return <p>Loading resale tickets...</p>;
  if (resaleTickets.length === 0) return <p>No resale tickets available.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Resale Tickets</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {resaleTickets.map((ticket) => (
          <div key={ticket.ticketId} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "10px" }}>
            <img
              src={ticket.bannerImage}
              alt={ticket.eventName}
              width="100%"
              height="180px"
              style={{ borderRadius: "10px", objectFit: "cover" }}
            />
            <h2>{ticket.eventName}</h2>
            <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
            <p><strong>Event ID:</strong> {ticket.eventId}</p>
            <p><strong>Venue:</strong> {ticket.venue}</p>
            <p><strong>Event Date:</strong> {ticket.eventDate}</p>
            <p><strong>Resale Price:</strong> {ticket.resalePrice} ETH</p>
            <button
              onClick={() => buyResaleTicket(ticket.ticketId, ticket.resalePrice)}
              style={{ padding: "10px", backgroundColor: "orange", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              Buy Resale Ticket
            </button>
          </div>
        ))}
      </div>
      <br />
      <Link href="/profile">
        <button style={{ padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          Back to Profile
        </button>
      </Link>
    </div>
  );
}
