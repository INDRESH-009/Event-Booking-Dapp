"use client";
import { useContext, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { WalletContext } from "../../context/WalletContext";
import { ethers } from "ethers";

const contractABI = [
  "function getEventDetails(uint256 eventId) external view returns (string, string, string, uint256, uint256, uint256, uint256, string)",
  "function withdrawEarnings(uint256 eventId) external",
  "function events(uint256 eventId) external view returns (string, string, string, uint256, uint256, uint256, uint256, string, address, uint256, uint256)"
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

        const details = await contract.getEventDetails(eventId);
        const eventInfo = await contract.events(eventId);

        // Destructure the result:
        const name = details[0];
        const description = details[1];
        const venue = details[2];
        const ticketPriceWei = details[3]; // BigInt
        const maxTickets = details[4];
        const ticketsSold = details[5];
        const eventDateRaw = details[6];   // BigInt
        const bannerImage = details[7];

        const ticketPriceEth = ethers.formatEther(ticketPriceWei); // Convert to ETH
        const dateStr = new Date(Number(eventDateRaw) * 1000).toLocaleString();
        
        // Fetch actual earnings from the smart contract
        const organizerAddress = eventInfo[8];
        const totalEarningsWei = eventInfo[9];
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

  // Withdraw function
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
      setTotalEarnings("0"); // Reset earnings after withdrawal
    } catch (error) {
      console.error("❌ Withdrawal failed:", error);
      alert("Withdrawal failed!");
    }
    setWithdrawLoading(false);
  };

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

      {/* Display Actual Earnings from Smart Contract */}
      <p><strong>Total Earnings (Smart Contract):</strong> {totalEarnings} ETH</p>

      {/* Show Withdraw Button Only If Organizer */}
      {account.toLowerCase() === organizer?.toLowerCase() && (
        <button onClick={withdrawEarnings} disabled={withdrawLoading || totalEarnings === "0"}>
          {withdrawLoading ? "Processing..." : "Withdraw Earnings"}
        </button>
      )}
    </div>
  );
}
