"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../context/WalletContext";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { Ticket as TicketIcon, Calendar as CalendarIcon, MapPin, DollarSign, Hash } from "lucide-react";

export default function ResaleTicketsPage() {
  const { account, provider, signer } = useContext(WalletContext);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  // modal now also includes a redirect flag
  const [modal, setModal] = useState({ show: false, message: "", redirect: false });
  const router = useRouter();

  useEffect(() => {
    if (!provider) return;

    async function fetchResaleTickets() {
      try {
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function getResaleTickets() external view returns (uint256[])",
            "function tickets(uint256 ticketId) external view returns (uint256 eventId, bool used, uint256 purchaseTimestamp, string txHash)",
            "function events(uint256 eventId) external view returns (string name, string description, string venue, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 eventDate, string bannerImage, address organizer, uint256 totalEarnings, uint256 totalResaleEarnings)",
            "function resalePrices(uint256 ticketId) external view returns (uint256)"
          ],
          provider
        );
        const ticketIds = await contract.getResaleTickets();
        const ticketsData = [];

        for (let ticketId of ticketIds) {
          const [eventId, used, purchaseTimestamp, txHash] = await contract.tickets(ticketId);
          const eventData = await contract.events(eventId);
          const [name, description, venue, ticketPrice, maxTickets, ticketsSold, eventDate, bannerImage] = eventData;
          const resalePriceWei = await contract.resalePrices(ticketId);
          const resalePriceEth = ethers.formatEther(resalePriceWei);

          ticketsData.push({
            ticketId: ticketId.toString(),
            eventId: eventId.toString(),
            used,
            purchaseTimestamp,
            txHash,
            eventName: name,
            eventDate: new Date(Number(eventDate) * 1000).toLocaleString(),
            venue,
            bannerImage,
            resalePrice: resalePriceEth
          });
        }
        setResaleTickets(ticketsData);
      } catch (error) {
        console.error("❌ Error fetching resale tickets:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResaleTickets();
  }, [provider]);

  const buyResaleTicket = async (ticketId, price) => {
    if (!signer)
      return setModal({ show: true, message: "Please connect your wallet.", redirect: false });
    setPaymentProcessing(true);
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        ["function buyResaleTicket(uint256 ticketId) external payable"],
        signer
      );
      console.log("Buying resale ticket", ticketId, "for", price, "ETH");
      const tx = await contract.buyResaleTicket(ticketId, { value: ethers.parseEther(price) });
      await tx.wait();
      // Set modal with redirect flag on success
      setModal({ show: true, message: "✅ Resale ticket purchased successfully!", redirect: true });
    } catch (error) {
      console.error("❌ Error buying resale ticket:", error);
      setModal({ show: true, message: "Failed to purchase resale ticket: " + error.message, redirect: false });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const closeModal = () => {
    // if redirect flag is set, navigate after closing modal
    if (modal.redirect) {
      router.push("/profile");
    }
    setModal({ show: false, message: "", redirect: false });
  };

  // Loader for payment processing
  if (paymentProcessing) {
    return (
      <div className="flex flex-col space-y-4 justify-center items-center bg-black h-screen">
        <div className="flex space-x-2 justify-center items-center">
          <span className="sr-only">Loading...</span>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce"></div>
        </div>
        <p className="text-white text-lg animate-pulse">Payment Processing...</p>
      </div>
    );
  }

  if (!account)
    return <p className="text-center text-white py-8">Please connect your wallet.</p>;
  if (loading)
    return (
      <div className="flex flex-col space-y-4 justify-center items-center bg-black h-screen">
        <div className="flex space-x-2 justify-center items-center">
          <span className="sr-only">Loading...</span>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-8 w-8 bg-white rounded-full animate-bounce"></div>
        </div>
        <p className="text-white text-lg animate-pulse">Loading tickets for resale ...</p>
      </div>
    );
  if (resaleTickets.length === 0)
    return (
      <div className="flex items-center justify-center bg-black h-screen">
        <p className="text-white text-xl">No Tickets available for resale</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white px-8 py-8 pt-12">
      <h1 className="flex items-center text-3xl font-bold mb-6 mt-14">
        <TicketIcon className="mr-2 h-8 w-8 text-orange-500" />
        Resale Tickets
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resaleTickets.map((ticket) => (
          <div key={ticket.ticketId} className="bg-black/40 backdrop-blur-xl transition-all hover:bg-black/60 rounded-xl shadow-lg p-4">
            <img
              src={ticket.bannerImage}
              alt={ticket.eventName}
              className="w-full h-44 object-cover rounded-lg mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">{ticket.eventName}</h2>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <TicketIcon className="h-4 w-4 text-purple-400" />
                <span>
                  <strong>Ticket ID:</strong> {ticket.ticketId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-purple-400" />
                <span>
                  <strong>Event ID:</strong> {ticket.eventId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-400" />
                <span>
                  <strong>Venue:</strong> {ticket.venue}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-purple-400" />
                <span>
                  <strong>Event Date:</strong> {ticket.eventDate}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-400" />
                <span>
                  <strong>Resale Price:</strong> {ticket.resalePrice} ETH
                </span>
              </div>
            </div>
            <button
              onClick={() => buyResaleTicket(ticket.ticketId, ticket.resalePrice)}
              className="w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded mt-4"
            >
              Buy Resale Ticket
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 z-10 max-w-sm w-full">
            <p className="text-gray-900 dark:text-gray-100 mb-4">{modal.message}</p>
            <button
              onClick={closeModal}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
