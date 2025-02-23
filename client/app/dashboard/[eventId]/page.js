"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter, useParams } from "next/navigation";
import { WalletContext } from "../../context/WalletContext";
import { ethers } from "ethers";

const contractABI = [
  // Remove getEventDetails from the ABI and use the auto-generated getter:
  "function events(uint256 eventId) external view returns (string, string, string, uint256, uint256, uint256, uint256, string, address, uint256, uint256)",
  "function withdrawEarnings(uint256 eventId) external"
];

export default function DashboardPage() {
  const { account, provider } = useContext(WalletContext);
  const { eventId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState("0");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (!provider || !eventId) return;

    async function fetchEventData() {
      try {
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          contractABI,
          provider
        );

        // Use the auto-generated getter for events:
        const eventInfo = await contract.events(eventId);

        // Destructure the values (we only use the first eight for display)
        const [name, description, venue, ticketPriceWei, maxTickets, ticketsSold, eventDateRaw, bannerImage, organizerAddress, totalEarningsWei] = eventInfo;
        
        const ticketPriceEth = ethers.formatEther(ticketPriceWei);
        const dateStr = new Date(Number(eventDateRaw) * 1000).toLocaleString();
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
        });

        setOrganizer(organizerAddress);
        setTotalEarnings(totalEarningsEth);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching event data:", err);
        setLoading(false);
      }
    }

    fetchEventData();
  }, [provider, eventId]);

  const withdrawEarnings = async () => {
    if (!window.ethereum) return alert("Connect to MetaMask");

    setWithdrawLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        contractABI,
        signer
      );

      const tx = await contract.withdrawEarnings(eventId);
      await tx.wait();

      alert("✅ Withdraw successful!");
      setTotalEarnings("0");
    } catch (error) {
      console.error("❌ Withdrawal failed:", error);
      alert("Withdrawal failed!");
    }
    setWithdrawLoading(false);
  };

  if (!account) return <p>Please connect your wallet.</p>;
  if (loading) return <p>Loading event data...</p>;
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

      <p><strong>Total Earnings (Smart Contract):</strong> {totalEarnings} ETH</p>

      {account.toLowerCase() === organizer?.toLowerCase() && (
        <button onClick={withdrawEarnings} disabled={withdrawLoading || totalEarnings === "0"}>
          {withdrawLoading ? "Processing..." : "Withdraw Earnings"}
        </button>
      )}
    </div>
  );
}
