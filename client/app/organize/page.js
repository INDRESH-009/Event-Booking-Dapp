"use client";
import { useState, useContext, useRef } from "react";
import { WalletContext } from "../context/WalletContext.js";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function OrganizeEvent() {
  const { account, provider } = useContext(WalletContext);
  const router = useRouter();
  const inputRef = useRef(null);

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

  // Handle input changes
  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  // Handle image upload & store in state
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

  // Create event function
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
        eventDateTimestamp,     // eventDate (timestamp)
        eventData.image         // bannerImage
      );

      console.log("⏳ Waiting for transaction confirmation...");
      await tx.wait();

      alert("✅ Event created successfully!");
      
      // Reset form after success
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
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-black via-purple-950 to-black">
      <Card className="max-w-2xl mt-20 mx-auto bg-black border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-white">
            Organize an Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Event Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter event name"
              value={eventData.name}
              onChange={handleChange}
              className="text-lg border border-gray-700 rounded bg-gray-800 text-white"
              required
            />
          </div>
          {/* Event Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Event Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your event"
              value={eventData.description}
              onChange={handleChange}
              className="min-h-[120px] resize-none border border-gray-700 rounded bg-gray-800 text-white"
              required
            />
          </div>
          {/* Ticket Price & Maximum Tickets */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticketPrice" className="text-white">Ticket Price (ETH)</Label>
              <Input
                id="ticketPrice"
                name="ticketPrice"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.00"
                value={eventData.ticketPrice}
                onChange={handleChange}
                className="border border-gray-700 rounded bg-gray-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTickets" className="text-white">Maximum Tickets</Label>
              <Input
                id="maxTickets"
                name="maxTickets"
                type="number"
                min="1"
                placeholder="100"
                value={eventData.maxTickets}
                onChange={handleChange}
                className="border border-gray-700 rounded bg-gray-800 text-white"
                required
              />
            </div>
          </div>
          {/* Event Date & Venue */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="text-white">Event Date</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="datetime-local"
                value={eventData.eventDate}
                onChange={handleChange}
                className="border border-gray-700 rounded bg-gray-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue" className="text-white">Venue</Label>
              <Input
                id="venue"
                name="venue"
                placeholder="Enter venue details"
                value={eventData.venue}
                onChange={handleChange}
                className="border border-gray-700 rounded bg-gray-800 text-white"
                required
              />
            </div>
          </div>
          {/* Event Image */}
          <div className="space-y-2">
            <Label className="text-white">Event Image</Label>
            <div className="border-2 border-dotted border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={handleImageUpload}
              />
              <div className="space-y-2">
                <div className="text-gray-400">
                  Drop your image here or click to browse
                </div>
                <Button 
                  variant="secondary" 
                  type="button" 
                  className="bg-black text-white"
                  onClick={() => inputRef.current && inputRef.current.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>
            {uploading && <p className="text-center text-sm text-gray-400">Uploading image...</p>}
            {eventData.image && (
              <div className="text-center">
                <img src={eventData.image} alt="Event Banner" className="mx-auto mt-2 rounded" width="200" />
              </div>
            )}
          </div>
          {/* Create Event Button */}
          <Button onClick={createEvent} className="w-full bg-purple-500 hover:bg-purple-600" size="lg" disabled={uploading}>
            Create Event
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
