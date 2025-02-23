"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext.js";
import { ethers } from "ethers";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

// Import UI components and icons from your design library
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Coins, MapPin, QrCode, Ticket as TicketIcon, Wallet as WalletIcon, DollarSign } from "lucide-react";
import Image from "next/image";

const approvalABI = [
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external"
];
const balanceABI = [
  "function sellerBalances(address) external view returns (uint256)",
  "function organizerBalances(address) external view returns (uint256)"
];

export default function Profile() {
  const { account, provider, signer } = useContext(WalletContext);
  const [tickets, setTickets] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [resalePrice, setResalePrice] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasApproval, setHasApproval] = useState(false);
  const [sellerFunds, setSellerFunds] = useState("0");
  const [organizerFunds, setOrganizerFunds] = useState("0");
  // New state variables for modals and loader for resale listing
  const [modal, setModal] = useState({ show: false, message: "" });
  const [listingProcessing, setListingProcessing] = useState(false);

  useEffect(() => {
    if (!account || !provider) return;

    const fetchUserTicketsAndEvents = async () => {
      try {
        console.log("📢 Getting signer...");
        const signer = await provider.getSigner();
        console.log("📢 Connecting to contract...");
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function balanceOf(address owner) external view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
            "function tickets(uint256 ticketId) external view returns (uint256 eventId, bool used, uint256 purchaseTimestamp, string txHash)",
            "function events(uint256 eventId) external view returns (string name, string description, string venue, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 eventDate, string bannerImage, address organizer, uint256 totalEarnings, uint256 totalResaleEarnings)",
            "function getOrganizerEvents(address organizer) external view returns (uint256[])",
            "function resalePrices(uint256 ticketId) external view returns (uint256)",
            "function resaleHistory(uint256 ticketId) external view returns (uint256)",
            "function isApprovedForAll(address owner, address operator) external view returns (bool)",
            "function setApprovalForAll(address operator, bool approved) external"
          ],
          signer
        );

        console.log("📢 Fetching ticket count...");
        const ticketCount = await contract.balanceOf(account);
        let userTickets = [];

        for (let i = 0; i < ticketCount; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(account, i);
          console.log(`📢 Fetching details for Ticket ID ${tokenId.toString()}...`);
          const [eventId, used, purchaseTimestamp, txHash] = await contract.tickets(tokenId);
          const eventData = await contract.events(eventId);
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
          const resaleCount = await contract.resaleHistory(tokenId);
          const rawResalePrice = await contract.resalePrices(tokenId);
          const formattedResalePrice = rawResalePrice > 0 ? ethers.formatEther(rawResalePrice) : null;

          userTickets.push({
            id: tokenId.toString(),
            eventId: eventId.toString(),
            used,
            transactionHash: txHash,
            purchaseDate: new Date(Number(purchaseTimestamp) * 1000).toLocaleString(),
            eventDate: new Date(Number(eventDate) * 1000).toLocaleString(),
            venue,
            eventName: name,
            eventImage: bannerImage,
            resalePrice: formattedResalePrice,
            originalPrice: ethers.formatEther(ticketPrice),
            resaleCount: Number(resaleCount)
          });
        }

        console.log("📢 Fetching organizer's events...");
        const eventsCreated = await contract.getOrganizerEvents(account);
        let createdEvents = [];
        for (let eventId of eventsCreated) {
          const eventData = await contract.events(eventId);
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
          createdEvents.push({
            id: eventId.toString(),
            name,
            description,
            ticketPrice: ethers.formatEther(ticketPrice) + " ETH",
            maxTickets,
            ticketsSold,
            eventDate: new Date(Number(eventDate) * 1000).toLocaleString(),
            venue,
            image: bannerImage,
          });
        }

        setTickets(userTickets);
        setOrganizerEvents(createdEvents);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchUserTicketsAndEvents();
  }, [account, provider]);

  useEffect(() => {
    if (!account || !provider) return;

    async function fetchBalances() {
      try {
        const balanceContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          balanceABI,
          provider
        );
        const sellerBalanceWei = await balanceContract.sellerBalances(account);
        const organizerBalanceWei = await balanceContract.organizerBalances(account);
        setSellerFunds(ethers.formatEther(sellerBalanceWei));
        setOrganizerFunds(ethers.formatEther(organizerBalanceWei));
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    }

    fetchBalances();
  }, [account, provider]);

  const handleSetApprovalForAll = async () => {
    try {
      console.log("📢 Setting global approval for contract...");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        approvalABI,
        signer
      );
      const tx = await contract.setApprovalForAll(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, true);
      await tx.wait();
      setModal({ show: true, message: "✅ Contract approved for all transfers." });
      setHasApproval(true);
    } catch (error) {
      console.error("❌ Error setting approval:", error);
      setModal({ show: true, message: "⚠️ Failed to set approval." });
    }
  };

  const handleWithdrawSellerFunds = async () => {
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function withdrawSellerFunds() external"],
        signer
      );
      const tx = await contract.withdrawSellerFunds();
      await tx.wait();
      setModal({ show: true, message: "Seller withdrawal successful!" });
    } catch (error) {
      console.error("Withdrawal failed", error);
      setModal({ show: true, message: "Withdrawal failed!" });
    }
  };

  const handleWithdrawOrganizerFunds = async () => {
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function withdrawOrganizerFunds() external"],
        signer
      );
      const tx = await contract.withdrawOrganizerFunds();
      await tx.wait();
      setModal({ show: true, message: "Organizer withdrawal successful!" });
    } catch (error) {
      console.error("Organizer withdrawal failed", error);
      setModal({ show: true, message: "Organizer withdrawal failed!" });
    }
  };

  useEffect(() => {
    if (!account || !provider) return;

    async function checkApproval() {
      try {
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          approvalABI,
          provider
        );
        const approved = await contract.isApprovedForAll(account, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
        setHasApproval(approved);
        console.log("Global approval status:", approved);
      } catch (error) {
        console.error("Error checking approval:", error);
      }
    }

    checkApproval();
  }, [account, provider]);

  const handleListForResale = async (ticketId) => {
    if (!resalePrice[ticketId] || isNaN(resalePrice[ticketId])) {
      return setModal({ show: true, message: "❌ Please enter a valid resale price." });
    }

    setListingProcessing(true);
    try {
      console.log("📢 Listing ticket for resale...");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function listForSale(uint256 ticketId, uint256 price) external"],
        signer
      );
      const tx = await contract.listForSale(ticketId, ethers.parseEther(resalePrice[ticketId].toString()));
      await tx.wait();
      setModal({ show: true, message: `✅ Ticket ID ${ticketId} listed for resale at ${resalePrice[ticketId]} ETH!` });
      setResalePrice((prev) => ({ ...prev, [ticketId]: "" }));
    } catch (error) {
      console.error("❌ Error listing ticket for resale:", error);
      setModal({ show: true, message: "⚠️ Failed to list ticket." });
    } finally {
      setListingProcessing(false);
    }
  };

  const closeModal = () => {
    setModal({ show: false, message: "" });
  };

  // Loader for listing processing
  if (listingProcessing) {
    return (
      <div className="flex flex-col space-y-4 justify-center items-center bg-black h-screen">
        <div className="flex space-x-2 justify-center items-center">
          <span className="sr-only">Loading...</span>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce"></div>
        </div>
        <p className="text-white text-lg animate-pulse">Listing Ticket for Resale...</p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex flex-col space-y-4 justify-center items-center bg-black h-screen">
        <div className="flex space-x-2 justify-center items-center">
          <span className="sr-only">Loading...</span>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce"></div>
        </div>
        <p className="text-white text-lg animate-pulse">Loading your profile ...</p>
      </div>
    );
  if (!account)
    return <p className="text-center text-white py-8">❌ Please connect your wallet.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black p-6 pt-14">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Your Tickets Section */}
        <section className="space-y-4 mt-14">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-8 w-8 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Your Tickets</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.length === 0 ? (
              <p className="text-center text-white">❌ You haven't bought any tickets yet.</p>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} className="group relative overflow-hidden border-0 bg-black/40 backdrop-blur-xl transition-all hover:bg-black/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                  <CardHeader className="relative">
                    <div className="relative h-48 overflow-hidden rounded-lg">
                      <Image
                        src={ticket.eventImage}
                        alt={ticket.eventName}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        fill
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{ticket.eventName}</h3>
                      <Badge variant="secondary" className={`mt-2 ${ticket.used ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}`}>
                        {ticket.used ? "Used" : "Valid"}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        {ticket.eventDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        {ticket.venue}
                      </div>
                      <div className="flex items-center gap-2">
                        <TicketIcon className="h-4 w-4 text-purple-400" />
                        Ticket ID: {ticket.id}
                      </div>
                    </div>
                    <div className="flex justify-center pt-4">
                      <div className="group relative">
                        <div className="absolute -inset-1 animate-pulse rounded-lg bg-purple-500/20 blur-lg transition-all group-hover:bg-purple-500/30" />
                        <QRCodeCanvas
                          value={`https://sepolia.etherscan.io/tx/${ticket.transactionHash}`}
                          size={96}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="relative">
                    {ticket.resalePrice ? (
                      <p className="text-sm text-purple-300">Resale Price: {ticket.resalePrice} ETH</p>
                    ) : (
                      <>
                        {!hasApproval ? (
                          <Button
                            onClick={handleSetApprovalForAll}
                            className="w-full bg-purple-500 text-white hover:bg-purple-600"
                            variant="secondary"
                          >
                            Approve for Resale
                          </Button>
                        ) : (
                          <div className="flex flex-col gap-2 w-full">
                            <input
                              type="number"
                              placeholder="Set resale price (ETH)"
                              className="w-full border border-gray-500 p-2 rounded bg-gray-700 text-white"
                              value={resalePrice[ticket.id] || ""}
                              onChange={(e) =>
                                setResalePrice({ ...resalePrice, [ticket.id]: e.target.value })
                              }
                            />
                            <Button
                              onClick={() => handleListForResale(ticket.id)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              List for Resale
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Your Events Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Your Events</h2>
          </div>
          {organizerEvents.length === 0 ? (
            <p className="text-center text-white">You haven't organized any events yet.</p>
          ) : (
            organizerEvents.map((event) => (
              <Card key={event.id} className="border-0 bg-black/40 backdrop-blur-xl">
                <CardContent className="flex flex-col md:flex-row items-stretch p-6 gap-6">
                  {/* Image Section */}
                  <div className="relative h-48 md:h-auto md:flex-1 overflow-hidden rounded-lg">
                    <Image
                      src={event.image}
                      alt={event.name}
                      className="object-cover transition-transform duration-500"
                      fill
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent" />
                  </div>
                  {/* Details Section */}
                  <div className="flex flex-col justify-between md:flex-1">
                    <div>
                      <h3 className="text-xl font-bold text-white">{event.name}</h3>
                      <p className="text-sm text-gray-400">Organizer Dashboard</p>
                    </div>
                    <div className="grid gap-2 text-sm text-gray-300 mt-4">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-purple-400" />
                        Price: {event.ticketPrice}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        {event.venue}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        {event.eventDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <TicketIcon className="h-4 w-4 text-purple-400" />
                        Tickets Sold: {event.ticketsSold} / {event.maxTickets}
                      </div>
                    </div>
                    <Link href={`/dashboard/${event.id}`} className="mt-4">
                      <Button className="w-full bg-purple-500 text-white hover:bg-purple-600">
                        View Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        {/* Withdrawal Balances Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">My Withdrawal Balances</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Seller Funds</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <p className="text-2xl font-bold text-purple-400">{sellerFunds}</p>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">ETH</Badge>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleWithdrawSellerFunds}
                  className="w-full bg-purple-500 text-white hover:bg-purple-600"
                  variant="secondary"
                  disabled={parseFloat(sellerFunds) === 0}
                >
                  Withdraw Seller Funds
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-0 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Organizer Funds</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <p className="text-2xl font-bold text-purple-400">{organizerFunds}</p>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">ETH</Badge>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleWithdrawOrganizerFunds}
                  className="w-full bg-purple-500 text-white hover:bg-purple-600"
                  disabled={parseFloat(organizerFunds) === 0}
                >
                  Withdraw Organizer Funds
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-0 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/organize" className="w-full">
                  <Button className="w-full bg-green-500 text-white hover:bg-green-600">
                    Organize an Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Modal */}
      {modal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 z-10 max-w-sm w-full">
            <p className="text-gray-900 dark:text-gray-100 mb-4">{modal.message}</p>
            <Button onClick={closeModal} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
