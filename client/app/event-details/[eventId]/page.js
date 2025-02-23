"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../../context/WalletContext";
import { useRouter, useParams } from "next/navigation";
import { ethers } from "ethers";
// ✅ Import the named export from qrcode.react, e.g. QRCodeSVG:
import { QRCodeSVG } from "qrcode.react";

export default function EventDetails() {
  const { account, provider } = useContext(WalletContext);
  const router = useRouter();
  const { eventId } = useParams();

  const [eventDetails, setEventDetails] = useState(null);
  const [ticketsAvailable, setTicketsAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionHash, setTransactionHash] = useState(null);

  useEffect(() => {
    if (!provider || !eventId) return;

    const fetchEventDetails = async () => {
      try {
        console.log("📢 Connecting to contract...");
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            // getEventDetails returns:
            // name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage
            "function getEventDetails(uint256 eventId) external view returns (string memory, string memory, string memory, uint256, uint256, uint256, uint256, string memory)"
          ],
          provider
        );

        console.log("📢 Fetching event details...");
        const details = await contract.getEventDetails(eventId);

        const name = details[0];
        const description = details[1];
        const venue = details[2];
        const ticketPriceRaw = details[3]; // BigInt value (wei)
        const maxTickets = details[4];
        const ticketsSold = details[5];
        const eventDateRaw = details[6];   // BigInt (seconds)
        const image = details[7];

        // Format for display
        const ticketPrice = ethers.formatEther(ticketPriceRaw) + " ETH";
        const eventDate = new Date(Number(eventDateRaw) * 1000).toLocaleString();
        const available = maxTickets - ticketsSold;

        setEventDetails({
          name,
          description,
          venue,
          ticketPrice, // For display
          ticketPriceValue: ticketPriceRaw, // Raw value (wei)
          maxTickets,
          ticketsSold,
          eventDate,
          image,
        });

        setTicketsAvailable(available);
      } catch (error) {
        console.error("❌ Error fetching event details:", error);
        setTicketsAvailable(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [provider, eventId]);

  console.log("Connected Wallet:", account);

  const buyTicket = async () => {
    if (!account || !provider) return alert("Please connect your wallet.");
    if (ticketsAvailable === 0) return alert("Tickets are sold out!");

    try {
      console.log("📢 Getting signer...");
      const signer = await provider.getSigner();

      console.log("📢 Connecting to contract...");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        [
          // buyTicket includes the txHash parameter
          "function buyTicket(uint256 eventId, string memory metadataURI, string memory txHash) external payable"
        ],
        signer
      );

      console.log("📢 Preparing transaction...");
      const priceToPay = eventDetails.ticketPriceValue;
      console.log("Ticket price (wei):", priceToPay.toString());

      console.log("📢 Forcing MetaMask prompt...");
      // Passing an empty string as txHash if not available
      const tx = await contract.buyTicket(eventId, "ipfs://your-metadata-uri", "", {
        value: priceToPay,
        gasLimit: ethers.toBigInt(500000),
      });
      console.log("⏳ Waiting for transaction confirmation...");
      await tx.wait();

      setTransactionHash(tx.hash);
      alert("✅ Ticket purchased successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("❌ Error buying ticket:", error);
      alert("Failed to buy ticket: " + error.message);
    }
  };

  if (loading) return <p>Loading event details...</p>;
  if (!eventDetails) return <p>❌ Event not found.</p>;
  if (!account) return <p>Please connect your wallet.</p>;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>🎟 {eventDetails.name}</h1>
      <img
        src={eventDetails.image}
        alt={eventDetails.name}
        width="100%"
        height="300px"
        style={{ borderRadius: "10px", objectFit: "cover" }}
      />
      <p><strong>Description:</strong> {eventDetails.description}</p>
      <p><strong>Ticket Price:</strong> {eventDetails.ticketPrice}</p>
      <p>
        <strong>Seats Available:</strong> {ticketsAvailable} / {eventDetails.maxTickets}
      </p>
      <p><strong>Tickets Sold:</strong> {eventDetails.ticketsSold}</p>
      <p><strong>Venue:</strong> {eventDetails.venue}</p>
      <p><strong>Event Date:</strong> {eventDetails.eventDate}</p>

      {ticketsAvailable === 0 ? (
        <button
          onClick={() => router.push(`/resale/${eventId}`)}
          style={{
            padding: "10px",
            backgroundColor: "orange",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Get Resale Ticket
        </button>
      ) : (
        <button
          onClick={buyTicket}
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
          Buy Ticket
        </button>
      )}

      {transactionHash && (
        <div style={{ marginTop: "20px" }}>
          <p><strong>Transaction Hash:</strong> {transactionHash}</p>
          <p><strong>QR Code for Ticket:</strong></p>
          {/* ✅ Use QRCodeSVG (or QRCodeCanvas) from 'qrcode.react' */}
          <QRCodeSVG value={transactionHash} size={150} />
        </div>
      )}
    </div>
  );
}
