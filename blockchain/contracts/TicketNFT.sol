// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 public ticketCounter;
    uint256 public eventCounter;
    uint256 public constant ROYALTY_PERCENT = 10; // 10% royalty to organizer

    struct Event {
        string name;
        string description;
        string venue;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 eventDate; 
        string bannerImage; 
        address organizer; 
        uint256 totalEarnings; 
        uint256 totalResaleEarnings;
    }

    struct Ticket {
        uint256 eventId;
        bool used;
        uint256 purchaseTimestamp; 
        string txHash; 
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256) public resalePrices;
    mapping(uint256 => uint256) public resaleHistory; // Tracks how many times ticket is resold
    mapping(uint256 => bool) public isListedForResale;
    mapping(address => uint256[]) public organizerEvents;
    mapping(address => uint256) public sellerBalances;
    mapping(address => uint256) public organizerBalances;


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

    /** 🔄 List Ticket for Resale with Dynamic Price Cap */
    function listForSale(uint256 ticketId, uint256 price) external {
        require(ownerOf(ticketId) == msg.sender, "Not owner");

        uint256 originalPrice = events[tickets[ticketId].eventId].ticketPrice;
        uint256 resaleCount = resaleHistory[ticketId];

        uint256 maxAllowedPrice;
        if (resaleCount == 0) {
            maxAllowedPrice = (originalPrice * 150) / 100; // 150% for 1st resale
        } else if (resaleCount == 1) {
            maxAllowedPrice = (originalPrice * 175) / 100; // 175% for 2nd resale
        } else {
            maxAllowedPrice = (originalPrice * 200) / 100; // 200% max
        }

        require(price <= maxAllowedPrice, "Exceeds allowed resale cap");

        resalePrices[ticketId] = price;
        isListedForResale[ticketId] = true;
        approve(address(this), ticketId);
    }

    /** 💰 Buy Resale Ticket */
    /** 💰 Buy Resale Ticket */
function buyResaleTicket(uint256 ticketId) external payable {
    uint256 price = resalePrices[ticketId];
    require(price > 0, "Not for sale");
    require(msg.value >= price, "Insufficient payment");

    address seller = ownerOf(ticketId);
    uint256 royalty = (price * ROYALTY_PERCENT) / 100;
// Credit the organizer’s balance
organizerBalances[events[tickets[ticketId].eventId].organizer] += royalty;
// Credit the seller’s balance
sellerBalances[seller] += (price - royalty);

    
    // Use the internal transfer function to bypass the approval check.
    _transfer(seller, msg.sender, ticketId);
    
    resalePrices[ticketId] = 0;
    isListedForResale[ticketId] = false;

    resaleHistory[ticketId] += 1; // Increment resale count
    events[tickets[ticketId].eventId].totalResaleEarnings += royalty;
}

    /** 📊 Fetch Resale Tickets */
    function getResaleTickets() external view returns (uint256[] memory) {
        uint256 totalTickets = ticketCounter;
        uint256 count = 0;

        for (uint256 i = 1; i <= totalTickets; i++) {
            if (isListedForResale[i]) {
                count++;
            }
        }

        uint256[] memory resaleTickets = new uint256[](count);
        count = 0;

        for (uint256 i = 1; i <= totalTickets; i++) {
            if (isListedForResale[i]) {
                resaleTickets[count] = i;
                count++;
            }
        }
        
        return resaleTickets;
    }

    /** 💵 Withdraw Resale Royalties */
    function withdrawResaleRoyalties(uint256 eventId) external {
        Event storage eventDetails = events[eventId];
        require(msg.sender == eventDetails.organizer, "Not the event organizer");
        require(eventDetails.totalResaleEarnings > 0, "No resale earnings to withdraw");

        uint256 amount = eventDetails.totalResaleEarnings;
        eventDetails.totalResaleEarnings = 0;

        payable(msg.sender).transfer(amount);
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

    function withdrawEarnings(uint256 eventId) external {
        Event storage eventDetails = events[eventId];
        require(msg.sender == eventDetails.organizer, "Not the event organizer");
        require(eventDetails.totalEarnings > 0, "No earnings to withdraw");

        uint256 amount = eventDetails.totalEarnings;
        eventDetails.totalEarnings = 0;

        payable(msg.sender).transfer(amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    function withdrawSellerFunds() external {
    uint256 amount = sellerBalances[msg.sender];
    require(amount > 0, "No funds to withdraw");
    sellerBalances[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Withdrawal failed");
}

function withdrawOrganizerFunds() external {
    uint256 amount = organizerBalances[msg.sender];
    require(amount > 0, "No funds to withdraw");
    organizerBalances[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Withdrawal failed");
}

}
