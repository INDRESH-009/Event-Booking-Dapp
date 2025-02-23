"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter, useParams } from "next/navigation";
import { WalletContext } from "../../context/WalletContext";
import { ethers } from "ethers";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Calendar as CalendarIcon, MapPin, DollarSign, Ticket as TicketIcon } from "lucide-react";

const contractABI = [
  // Using auto-generated getter for events:
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

        // Fetch event details using the auto-generated getter:
        const eventInfo = await contract.events(eventId);

        // Destructure the values (we use the first eight for display)
        const [name, description, venue, ticketPriceWei, maxTickets, ticketsSold, eventDateRaw, bannerImage, organizerAddress, totalEarningsWei] = eventInfo;
        
        const ticketPriceEth = ethers.formatEther(ticketPriceWei);
        const dateStr = new Date(Number(eventDateRaw) * 1000).toLocaleString();
        const totalEarningsEth = ethers.formatEther(totalEarningsWei);

        setEventData({
          name,
          description,
          venue,
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

  if (!account) return <p className="text-center text-white py-8">Please connect your wallet.</p>;
  if (loading) return <p className="text-center text-white py-8">Loading event data...</p>;
  if (!eventData) return <p className="text-center text-white py-8">Event not found.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white p-6 pt-24">
      <Card className="max-w-4xl border-none mx-auto bg-black/40 backdrop-blur-xl rounded-xl shadow-lg">
        <CardHeader className="relative h-64">
          <Image
            src={eventData.bannerImage}
            alt={eventData.name}
            fill
            className="object-cover rounded-t-xl"
          />
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <CardTitle className="text-3xl font-bold">{eventData.name}</CardTitle>
          <p className="text-gray-300">{eventData.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              <span><strong>Venue:</strong> {eventData.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
              <span><strong>Date:</strong> {eventData.eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <span><strong>Ticket Price:</strong> {eventData.ticketPriceEth} ETH</span>
            </div>
            <div className="flex items-center gap-2">
              <TicketIcon className="w-5 h-5 text-purple-400" />
              <span><strong>Tickets Sold:</strong> {eventData.ticketsSold} / {eventData.maxTickets}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <DollarSign className="w-5 h-5 text-purple-400" />
            <span><strong>Total Earnings:</strong> {totalEarnings} ETH</span>
          </div>
        </CardContent>
        {account.toLowerCase() === organizer?.toLowerCase() && (
          <CardFooter className="p-6">
            <Button
              onClick={withdrawEarnings}
              disabled={withdrawLoading || totalEarnings === "0"}
              className="w-full bg-purple-500 text-white hover:bg-purple-600"
            >
              {withdrawLoading ? "Processing..." : "Withdraw Earnings"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
