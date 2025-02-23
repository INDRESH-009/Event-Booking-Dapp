// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 public ticketCounter;
    uint256 public eventCounter;
    uint256 public constant MAX_RESALE_PRICE = 10 ether; // Price cap for resale
    uint256 public constant ROYALTY_PERCENT = 10; // 10% royalty to organizer

    struct Event {
        string name;
        string description;
        string venue;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 eventDate; // 📅 New: Event Date
        string bannerImage; // 🖼️ New: Event Banner
        address organizer; // 👤 New: Organizer
        uint256 totalEarnings; // 💰 New: Earnings Tracker
        uint256 totalResaleEarnings; // 🔄 New: Resale Royalty Earnings
    }

    struct Ticket {
        uint256 eventId;
        bool used;
        uint256 purchaseTimestamp; // ⏳ New: Store purchase timestamp
        string txHash; // 🔗 New: Store transaction hash
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256) public resalePrices;
    mapping(address => uint256[]) public organizerEvents; // Organizers' event list

    constructor() ERC721("EventTicket", "ETK") {
        ticketCounter = 0;
        eventCounter = 0;
    }

    /** 📌 Create a new event */
    function createEvent(
        string memory name,
        string memory description,
        string memory venue,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 eventDate,
        string memory bannerImage
    ) external {
        eventCounter++;
        events[eventCounter] = Event(
            name, description, venue, ticketPrice, maxTickets, 0, eventDate, bannerImage, msg.sender, 0, 0
        );
        organizerEvents[msg.sender].push(eventCounter);
    }
    
    /** 🔎 Get Total Events */
    function getTotalEvents() external view returns (uint256) {
        return eventCounter;
    }

    /** 🎟️ Buy a Ticket */
    function buyTicket(uint256 eventId, string memory metadataURI, string memory txHash) external payable {
        Event storage eventDetails = events[eventId];
        require(eventDetails.ticketsSold < eventDetails.maxTickets, "Sold out");
        require(msg.value >= eventDetails.ticketPrice, "Insufficient payment");

        ticketCounter++;
        _safeMint(msg.sender, ticketCounter);
        _setTokenURI(ticketCounter, metadataURI);
        
        tickets[ticketCounter] = Ticket(eventId, false, block.timestamp, txHash);
        
        eventDetails.ticketsSold++;
        eventDetails.totalEarnings += msg.value;
    }

    /** ❌ Mark Ticket as Used */
    function markAsUsed(uint256 ticketId) external onlyOwner {
        require(_exists(ticketId), "Ticket does not exist");
        tickets[ticketId].used = true;
    }

    /** ✅ Check if Ticket is Used */
    function isTicketUsed(uint256 ticketId) external view returns (bool) {
        require(_exists(ticketId), "Ticket does not exist");
        return tickets[ticketId].used;
    }

    /** 🔄 List Ticket for Resale */
    function listForSale(uint256 ticketId, uint256 price) external {
        require(ownerOf(ticketId) == msg.sender, "Not owner");
        require(price <= MAX_RESALE_PRICE, "Price exceeds cap");
        resalePrices[ticketId] = price;
        approve(address(this), ticketId); // Allow contract to transfer
    }

    /** 💰 Buy Resale Ticket */
    function buyResaleTicket(uint256 ticketId) external payable {
        uint256 price = resalePrices[ticketId];
        require(price > 0, "Not for sale");
        require(msg.value >= price, "Insufficient payment");

        address seller = ownerOf(ticketId);
        uint256 royalty = (price * ROYALTY_PERCENT) / 100;
        payable(events[tickets[ticketId].eventId].organizer).transfer(royalty); // Royalty to organizer
        payable(seller).transfer(price - royalty);
        
        safeTransferFrom(seller, msg.sender, ticketId);
        resalePrices[ticketId] = 0;
        
        events[tickets[ticketId].eventId].totalResaleEarnings += royalty;
    }

    /** 📊 Get Event Details */
    function getEventDetails(uint256 eventId)
        external
        view
        returns (
            string memory name,
            string memory description,
            string memory venue,
            uint256 ticketPrice,
            uint256 maxTickets,
            uint256 ticketsSold,
            uint256 eventDate,
            string memory bannerImage
        )
    {
        Event memory eventDetails = events[eventId];
        return (
            eventDetails.name,
            eventDetails.description,
            eventDetails.venue,
            eventDetails.ticketPrice,
            eventDetails.maxTickets,
            eventDetails.ticketsSold,
            eventDetails.eventDate,
            eventDetails.bannerImage
        );
    }

    /** 🎟️ Get Ticket Details */
    function getTicketDetails(uint256 ticketId)
        external
        view
        returns (uint256 eventId, bool used, uint256 purchaseTimestamp, string memory txHash)
    {
        require(_exists(ticketId), "Ticket does not exist");
        return (
            tickets[ticketId].eventId,
            tickets[ticketId].used,
            tickets[ticketId].purchaseTimestamp,
            tickets[ticketId].txHash
        );
    }

    /** 📈 Get Organizer's Events */
    function getOrganizerEvents(address organizer) external view returns (uint256[] memory) {
        return organizerEvents[organizer];
    }

    /** 🔥 Override ERC721 Functions */
    function _burn(uint256 tokenId) internal override(ERC721URIStorage, ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage, ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721Enumerable, ERC721)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
