"use client";
import { useContext, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { WalletContext } from "../../context/WalletContext";
import { ethers } from "ethers";

export default function DashboardPage() {
  const { account, provider } = useContext(WalletContext);
  const { eventId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    if (!provider || !eventId) return;

    async function fetchEventData() {
      try {
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            // getEventDetails returns (in order):
            //  name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage
            "function getEventDetails(uint256 eventId) external view returns (string, string, string, uint256, uint256, uint256, uint256, string)"
          ],
          provider
        );

        const details = await contract.getEventDetails(eventId);

        // Destructure the result:
        const name = details[0];
        const description = details[1];
        const venue = details[2];
        const ticketPriceWei = details[3]; // BigInt
        const maxTickets = details[4];
        const ticketsSold = details[5];
        const eventDateRaw = details[6];   // BigInt
        const bannerImage = details[7];

        // Convert for display
        const ticketPriceEth = ethers.formatEther(ticketPriceWei); // e.g. "0.01"
        const dateStr = new Date(Number(eventDateRaw) * 1000).toLocaleString();

        // Calculate total earnings on the spot:
        // (ticketsSold * ticketPriceWei) => BigInt, then format to ETH
        const totalEarningsWei = BigInt(ticketsSold) * ticketPriceWei;
        const totalEarningsEth = ethers.formatEther(totalEarningsWei);

        setEventData({
          name,
          description,
          venue,
          ticketPriceWei,
          ticketPriceEth,
          maxTickets,
          ticketsSold,
          eventDate: dateStr,
          bannerImage,
          totalEarningsEth, // Calculated on the front end
        });

        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching event data:", err);
        setLoading(false);
      }
    }

    fetchEventData();
  }, [provider, eventId]);

  // 1) Check wallet
  if (!account) return <p>Please connect your wallet.</p>;
  // 2) Loading state
  if (loading) return <p>Loading event data...</p>;
  // 3) If no data, show error
  if (!eventData) return <p>Event not found.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Event Dashboard (ID: {eventId})</h1>
      <img
        src={eventData.bannerImage}
        alt="Banner"
        style={{ width: "300px", borderRadius: "10px" }}
      />

      <p><strong>Name:</strong> {eventData.name}</p>
      <p><strong>Description:</strong> {eventData.description}</p>
      <p><strong>Venue:</strong> {eventData.venue}</p>
      <p><strong>Date:</strong> {eventData.eventDate}</p>
      <p><strong>Ticket Price:</strong> {eventData.ticketPriceEth} ETH</p>
      <p><strong>Max Tickets:</strong> {eventData.maxTickets.toString()}</p>
      <p><strong>Tickets Sold:</strong> {eventData.ticketsSold.toString()}</p>
      {/* Display your on-the-spot calculation */}
      <p><strong>Total Earnings (Front-End Calc):</strong> {eventData.totalEarningsEth} ETH</p>
    </div>
  );
}
