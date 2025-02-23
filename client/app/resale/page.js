"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext";
import { ethers } from "ethers";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResaleTicketsPage() {
  const { account, provider, signer } = useContext(WalletContext);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
          const [eventId, used, purchaseTimestamp, txHash] = await contract.tickets(ticketId);
          const eventData = await contract.events(eventId);
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
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
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function buyResaleTicket(uint256 ticketId) external payable"],
        signer
      );
      console.log("Buying resale ticket", ticketId, "for", price, "ETH");
      const tx = await contract.buyResaleTicket(ticketId, { value: ethers.parseEther(price) });
      await tx.wait();
      alert("✅ Resale ticket purchased successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("❌ Error buying resale ticket:", error);
      alert("Failed to purchase resale ticket: " + error.message);
    }
  };

  if (!account) return <p className="text-center text-white py-8">Please connect your wallet.</p>;
  if (loading) return <p className="text-center text-white py-8">Loading resale tickets...</p>;
  if (resaleTickets.length === 0) return <p className="text-center text-white py-8">No resale tickets available.</p>;

  return (
    <div className="min-h-screen bg-black text-white px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Resale Tickets</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resaleTickets.map((ticket) => (
          <div key={ticket.ticketId} className="bg-gray-800 rounded-xl shadow-lg p-4">
            <img
              src={ticket.bannerImage}
              alt={ticket.eventName}
              className="w-full h-44 object-cover rounded-lg mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">{ticket.eventName}</h2>
            <p className="text-sm mb-1"><strong>Ticket ID:</strong> {ticket.ticketId}</p>
            <p className="text-sm mb-1"><strong>Event ID:</strong> {ticket.eventId}</p>
            <p className="text-sm mb-1"><strong>Venue:</strong> {ticket.venue}</p>
            <p className="text-sm mb-1"><strong>Event Date:</strong> {ticket.eventDate}</p>
            <p className="text-sm mb-1"><strong>Resale Price:</strong> {ticket.resalePrice} ETH</p>
            <button
              onClick={() => buyResaleTicket(ticket.ticketId, ticket.resalePrice)}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
            >
              Buy Resale Ticket
            </button>
          </div>
        ))}
      </div>
      {/* <div className="mt-8">
        <Link href="/profile">
          <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
            Back to Profile
          </button>
        </Link>
      </div> */}
    </div>
  );
}
