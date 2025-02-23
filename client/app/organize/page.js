"use client";
import { useState, useContext } from "react";
import { WalletContext } from "../context/WalletContext.js";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";

export default function OrganizeEvent() {
  const { account, provider } = useContext(WalletContext);
  const router = useRouter();

  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    ticketPrice: "",
    maxTickets: "",
    eventDate: "",
    venue: "",
    image: "",
  });

  const [uploading, setUploading] = useState(false);

  // ✅ Handle input changes
  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  // ✅ Handle image upload & store in state
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("📢 Uploading image...");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      console.log("✅ Image uploaded successfully:", data.imageUrl);
      setEventData((prev) => ({ ...prev, image: data.imageUrl }));
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Create event function
  const createEvent = async () => {
    if (!account || !provider) return alert("Please connect your wallet.");
    if (!eventData.image) return alert("Please upload an event image.");

    try {
      console.log("📢 Getting signer...");
      const signer = await provider.getSigner();
      if (!signer) throw new Error("Signer not available");

      console.log("📢 Connecting to contract...");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        [
          "function createEvent(string memory, string memory, string memory, uint256, uint256, uint256, string memory) external"
        ],
        signer
      );

      console.log("📢 Creating event on blockchain...");
      const ticketPriceInWei = ethers.parseEther(eventData.ticketPrice);
      // Convert eventDate to Unix timestamp (in seconds)
      const eventDateTimestamp = Math.floor(new Date(eventData.eventDate).getTime() / 1000);
      const tx = await contract.createEvent(
        eventData.name,         // name
        eventData.description,  // description
        eventData.venue,        // venue
        ticketPriceInWei,       // ticketPrice
        eventData.maxTickets,   // maxTickets
        eventDateTimestamp,     // eventDate (uint256 timestamp)
        eventData.image         // bannerImage
      );

      console.log("⏳ Waiting for transaction confirmation...");
      await tx.wait();

      alert("✅ Event created successfully!");
      
      // ✅ Reset form after success
      setEventData({
        name: "",
        description: "",
        ticketPrice: "",
        maxTickets: "",
        eventDate: "",
        venue: "",
        image: "",
      });

      router.push("/events"); // Redirect to events page
    } catch (error) {
      console.error("❌ Error creating event:", error);
      alert("Failed to create event.");
    }
  };

  return (
    <div>
      <h1>🎭 Organize an Event</h1>
      <input
        type="text"
        name="name"
        placeholder="Event Name"
        value={eventData.name}
        onChange={handleChange}
        required
      />
      <textarea
        name="description"
        placeholder="Event Description"
        value={eventData.description}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="ticketPrice"
        placeholder="Ticket Price (ETH)"
        value={eventData.ticketPrice}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="maxTickets"
        placeholder="Maximum Tickets"
        value={eventData.maxTickets}
        onChange={handleChange}
        required
      />
      <input
        type="datetime-local"
        name="eventDate"
        value={eventData.eventDate}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="venue"
        placeholder="Venue"
        value={eventData.venue}
        onChange={handleChange}
        required
      />
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {uploading && <p>Uploading image...</p>}
      {eventData.image && <img src={eventData.image} alt="Event Banner" width="200" />}
      <button onClick={createEvent} disabled={uploading}>
        Create Event
      </button>
    </div>
  );
}
