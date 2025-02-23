"use client";
import { useContext, useState, useEffect } from "react";
import { WalletContext } from "../context/WalletContext";
import Link from "next/link";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, MapPin, Clock } from "lucide-react";

export default function EventsPage() {
  const { account, provider } = useContext(WalletContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provider) return;

    const fetchEvents = async () => {
      try {
        console.log("📢 Connecting to contract...");
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function getTotalEvents() external view returns (uint256)",
            "function events(uint256 eventId) external view returns (string name, string description, string venue, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 eventDate, string bannerImage, address organizer, uint256 totalEarnings, uint256 totalResaleEarnings)"
          ],
          provider
        );

        console.log("📢 Fetching total events...");
        const totalEvents = await contract.getTotalEvents();
        let fetchedEvents = [];

        for (let i = 1; i <= totalEvents; i++) {
          console.log(`📢 Fetching details for Event ID ${i}...`);
          const eventData = await contract.events(i);
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
          
          fetchedEvents.push({
            id: i,
            name,
            description,
            venue,
            ticketPrice: ethers.formatEther(ticketPrice) + " ETH",
            maxTickets,
            ticketsSold,
            eventDate: new Date(Number(eventDate) * 1000).toLocaleString(),
            image: bannerImage
          });
        }

        setEvents(fetchedEvents);
        console.log("✅ Events fetched:", fetchedEvents);
      } catch (error) {
        console.error("❌ Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [provider]);

  if (!account) return <p>Please connect your wallet.</p>;
  if (loading) return <p>Loading events...</p>;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-8">
        {/* Search and Filter */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>
              <Select>
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="conference">Conferences</SelectItem>
                  <SelectItem value="concert">Concerts</SelectItem>
                  <SelectItem value="workshop">Workshops</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            {events.length === 0 ? (
              <p>No events found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="group relative bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={event.image || "/placeholder.svg?height=300&width=400"}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
                        {event.ticketPrice}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                      <p className="text-gray-300 mb-4">{event.description}</p>
                      <div className="flex flex-col gap-2 text-gray-300 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{event.eventDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {event.ticketsSold} / {event.maxTickets} Sold
                          </span>
                        </div>
                      </div>
                      <Link href={`/event-details/${event.id}`} className="w-full block">
                        <Button className="w-full bg-purple-500 hover:bg-purple-600">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
