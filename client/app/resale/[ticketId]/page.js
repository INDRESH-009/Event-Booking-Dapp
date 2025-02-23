"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "@/context/WalletContext.js";
import { useRouter, useParams } from "next/navigation";
import { ethers } from "ethers";

export default function ResalePage() {
  const { account, provider } = useContext(WalletContext);
  const router = useRouter();
  const { ticketId } = useParams();

  const [ticketDetails, setTicketDetails] = useState(null);
  const [resalePrice, setResalePrice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provider || !ticketId) return;

    const fetchResaleTickets = async () => {
      try {
        console.log("📢 Connecting to contract...");
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function getTicketDetails(uint256 ticketId) external view returns (uint256, bool, string memory, string memory, string memory, string memory)",
            "function getEventDetails(uint256 eventId) external view returns (string memory, string memory, uint256, uint256, uint256, string memory, string memory, string memory)",
            "function resalePrices(uint256 ticketId) external view returns (uint256)",
            "function ownerOf(uint256 tokenId) external view returns (address)"
          ],
          signer
        );

        console.log(`📢 Fetching details for Ticket ID ${ticketId}...`);
        const [eventId, used, txnHash, purchaseDate, eventDate, venue] = await contract.getTicketDetails(ticketId);
        const eventDetails = await contract.getEventDetails(eventId);
        const price = await contract.resalePrices(ticketId);
        const owner = await contract.ownerOf(ticketId);

        setTicketDetails({
          id: ticketId,
          eventId,
          used,
          transactionHash: txnHash,
          purchaseDate,
          eventDate,
          venue,
          eventName: eventDetails[0],
          eventImage: eventDetails[7],
          price: price > 0 ? ethers.formatEther(price) : null,
          owner
        });

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching resale tickets:", error);
        setLoading(false);
      }
    };

    fetchResaleTickets();
  }, [provider, ticketId]);

  const listForResale = async () => {
    if (!account || !provider) return alert("❌ Please connect your wallet.");
    if (!resalePrice || isNaN(resalePrice)) return alert("❌ Enter a valid price!");

    try {
      console.log("📢 Getting signer...");
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function listForSale(uint256 ticketId, uint256 price) external"],
        signer
      );

      console.log("📢 Listing ticket for resale...");
      const tx = await contract.listForSale(ticketId, ethers.parseEther(resalePrice.toString()));
      await tx.wait();

      alert(`✅ Ticket ID ${ticketId} listed for resale at ${resalePrice} ETH!`);
      router.refresh();
    } catch (error) {
      console.error("❌ Error listing ticket for resale:", error);
      alert("⚠️ Failed to list ticket.");
    }
  };

  const buyResaleTicket = async () => {
    if (!account || !provider) return alert("❌ Please connect your wallet.");
    if (!ticketDetails || !ticketDetails.price) return alert("⚠️ This ticket is not available for resale.");

    try {
      console.log("📢 Getting signer...");
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function buyResaleTicket(uint256 ticketId) external payable"],
        signer
      );

      console.log("📢 Buying resale ticket...");
      const tx = await contract.buyResaleTicket(ticketId, {
        value: ethers.parseEther(ticketDetails.price.toString())
      });
      await tx.wait();

      alert("✅ Ticket purchased successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("❌ Error buying resale ticket:", error);
      alert("⚠️ Failed to buy resale ticket.");
    }
  };

  if (loading) return <p>⏳ Loading resale details...</p>;
  if (!ticketDetails) return <p>❌ Ticket not found or not listed for resale.</p>;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>🎟 Resale Ticket</h1>
      <img
        src={ticketDetails.eventImage}
        alt={ticketDetails.eventName}
        width="100%"
        height="300px"
        style={{ borderRadius: "10px", objectFit: "cover" }}
      />
      <h2>{ticketDetails.eventName}</h2>
      <p><strong>Ticket ID:</strong> {ticketDetails.id}</p>
      <p><strong>Event ID:</strong> {ticketDetails.eventId}</p>
      <p><strong>Venue:</strong> {ticketDetails.venue}</p>
      <p><strong>Event Date:</strong> {ticketDetails.eventDate}</p>
      <p><strong>Purchase Date:</strong> {ticketDetails.purchaseDate}</p>
      <p>
        <strong>Transaction Hash:</strong>{" "}
        <a
          href={`https://sepolia.etherscan.io/tx/${ticketDetails.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {ticketDetails.transactionHash.slice(0, 10)}...
        </a>
      </p>
      <p><strong>Status:</strong> {ticketDetails.used ? "❌ Used" : "✅ Valid"}</p>

      {ticketDetails.owner.toLowerCase() === account.toLowerCase() ? (
        <>
          <h3>List Ticket for Resale</h3>
          <input
            type="number"
            placeholder="Enter price in ETH"
            value={resalePrice}
            onChange={(e) => setResalePrice(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={listForResale}
            style={{
              marginLeft: "10px",
              padding: "10px",
              backgroundColor: "orange",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            List for Resale
          </button>
        </>
      ) : ticketDetails.price ? (
        <button
          onClick={buyResaleTicket}
          style={{
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px"
          }}
        >
          Buy Resale Ticket ({ticketDetails.price} ETH)
        </button>
      ) : (
        <p>❌ No resale listing found.</p>
      )}
    </div>
  );
}
