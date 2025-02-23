"use client";
import { useState } from "react";
import { ethers } from "ethers";

export default function Verify() {
  const [ticketId, setTicketId] = useState("");
  const [isUsed, setIsUsed] = useState(null);

  const checkTicket = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function isTicketUsed(uint256 ticketId) external view returns (bool)"],
        provider
      );
      const used = await contract.isTicketUsed(ticketId);
      setIsUsed(used);
    } catch (error) {
      console.error(error);
      alert("Failed to verify ticket");
    }
  };

  return (
    <div>
      <h1>Verify Ticket</h1>
      <input
        type="text"
        value={ticketId}
        onChange={(e) => setTicketId(e.target.value)}
        placeholder="Enter Ticket ID"
      />
      <button onClick={checkTicket}>Check</button>
      {isUsed !== null && <p>Ticket Used: {isUsed ? "Yes" : "No"}</p>}
    </div>
  );
}