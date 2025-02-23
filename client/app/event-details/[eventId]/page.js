"use client";
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../../context/WalletContext";
import { useRouter, useParams } from "next/navigation";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, Clock, Ticket } from "lucide-react";

export default function EventDetails() {
  const { account, provider } = useContext(WalletContext);
  const router = useRouter();
  const { eventId } = useParams();

  const [eventDetails, setEventDetails] = useState(null);
  const [ticketsAvailable, setTicketsAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionHash, setTransactionHash] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    if (!provider || !eventId) return;

    const fetchEventDetails = async () => {
      try {
        console.log("📢 Connecting to contract...");
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          [
            "function events(uint256) external view returns (string name, string description, string venue, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 eventDate, string bannerImage, address organizer, uint256 totalEarnings, uint256 totalResaleEarnings)"
          ],
          provider
        );

        console.log("📢 Fetching event details...");
        const details = await contract.events(eventId);

        // Destructure the first eight values for display
        const [name, description, venue, ticketPriceRaw, maxTickets, ticketsSold, eventDateRaw, bannerImage] = details;

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
          image: bannerImage,
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
      setIsProcessing(true);
      console.log("📢 Getting signer...");
      const signer = await provider.getSigner();

      console.log("📢 Connecting to contract...");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        [
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
      setIsProcessing(false);
      setPopup({
        title: "Payment Successful",
        message: "Your ticket has been purchased successfully!",
        success: true,
      });
    } catch (error) {
      console.error("❌ Error buying ticket:", error);
      setIsProcessing(false);
      setPopup({
        title: "Payment Failed",
        message: "Failed to buy ticket: " + error.message,
        success: false,
      });
    }
  };

  if (loading)
    return <p className="text-center text-white py-8">Loading event details...</p>;
  if (!eventDetails)
    return <p className="text-center text-white py-8">❌ Event not found.</p>;
  if (!account)
    return <p className="text-center text-white py-8">Please connect your wallet.</p>;

  return (
    <div className="min-h-screen bg-black text-white px-8 py-8 pt-24 relative">
      {/* Main Card */}
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left: Event Image */}
          <div className="md:w-1/2">
            <img
              src={eventDetails.image}
              alt={eventDetails.name}
              className="w-full h-72 md:h-full object-cover"
            />
          </div>
          {/* Right: Event Details */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4">{eventDetails.name}</h1>
              <p className="mb-4 text-gray-300">
                <strong>Description:</strong> {eventDetails.description}
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>
                    <strong>Event Date:</strong> {eventDetails.eventDate}
                  </span>
                </div>
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>
                    <strong>Venue:</strong> {eventDetails.venue}
                  </span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Ticket className="w-5 h-5 mr-2" />
                  <span>
                    <strong>Ticket Price:</strong> {eventDetails.ticketPrice}
                  </span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>
                    <strong>Seats Available:</strong> {ticketsAvailable} / {eventDetails.maxTickets}
                  </span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Ticket className="w-5 h-5 mr-2" />
                  <span>
                    <strong>Tickets Sold:</strong> {eventDetails.ticketsSold}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              {ticketsAvailable === 0 ? (
                <button
                  onClick={() => router.push(`/resale/${eventId}`)}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md cursor-pointer"
                >
                  Get Resale Ticket
                </button>
              ) : (
                <button
                  onClick={buyTicket}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md cursor-pointer"
                >
                  Buy Ticket
                </button>
              )}
              {transactionHash && (
                <div className="mt-6 text-center">
                  <p className="mb-2">
                    <strong>Transaction Hash:</strong> {transactionHash}
                  </p>
                  <p className="mb-2">
                    <strong>QR Code for Ticket:</strong>
                  </p>
                  <div className="mx-auto">
                    <QRCodeSVG value={transactionHash} size={150} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loader Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 flex flex-col justify-center items-center bg-black h-screen z-50">
          <span className="sr-only">Loading...</span>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-8 w-8 bg-white rounded-full animate-bounce"></div>
          </div>
          <p className="mt-4 text-white text-lg animate-pulse">Payment Processing...</p>
        </div>
      )}

      {/* Popup Modal */}
      {popup && (
        <>
          <div className="fixed inset-0 bg-black opacity-50 z-50 pointer-events-none"></div>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white text-black rounded-lg shadow-lg p-6 max-w-sm w-full relative pointer-events-auto">
              <h2 className="text-xl font-bold mb-4">{popup.title}</h2>
              <p className="mb-4">{popup.message}</p>
              <button
                onClick={() => {
                  setPopup(null);
                  if (popup.success) router.push("/profile");
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
