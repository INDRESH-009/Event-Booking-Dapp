# Decentralized Event Ticket Booking DApp

## Overview
![Landing Page](https://res.cloudinary.com/drxdayeg3/image/upload/v1740342006/Screenshot_2025-02-24_at_1.49.55_AM_vfoqk4.png)
This is a **decentralized event ticket booking application** built on the **Ethereum Sepolia Testnet**. It enables users to **buy, sell, and validate event tickets** as **ERC-721 NFTs**, ensuring secure transactions, resale price regulation, and fraud prevention using blockchain technology.

## Features
- **NFT-Based Ticketing**: Tickets are minted as **ERC-721 NFTs**.
- **Wallet Connection**: Users connect their wallets via MetaMask.
- **Event Booking**: Users can book tickets for various events.
- **Profile Page**: Displays purchased tickets along with QR codes.
- **Resale Marketplace**: Allows users to resell tickets within 175%-200% of the original price.
- **Organizer Portal**: Users can create and manage events, with earnings directly sent to their wallets.
- **IPFS Integration**: Ticket metadata stored on **IPFS via Pinata**.
- **QR Code-Based Validation**: Ensures ticket authenticity.
- **Cloudinary Integration**: Stores event images.

## User Flow

### Events Page
![Events Page](https://res.cloudinary.com/drxdayeg3/image/upload/v1740343114/Screenshot_2025-02-24_at_2.08.19_AM_fs8vkk.png)

### Organizer Dashboard
![Organizer Dashboard](https://res.cloudinary.com/drxdayeg3/image/upload/v1740343232/Screenshot_2025-02-24_at_2.10.15_AM_c2zbze.png)

### Secondary Market
![Secondary Market](https://res.cloudinary.com/drxdayeg3/image/upload/v1740343656/Screenshot_2025-02-24_at_2.17.24_AM_pd3fce.png)

### Purchased Tickets & QR Code
![Purchased Tickets](https://res.cloudinary.com/drxdayeg3/image/upload/v1740343887/Screenshot_2025-02-24_at_2.21.00_AM_utmkgy.png)

1. **Landing Page** → Users visit the homepage.
2. **Connect Wallet** → Users connect their MetaMask wallets.
3. **Events Page** → Displays available events where users can book tickets.
4. **Book Ticket** → Users select an event, purchase a ticket, and are redirected to their **Profile Page**.
5. **Profile Page** → Shows booked tickets with **QR codes** for entry validation.
6. **Resale Market** (Optional) → Users can list tickets for resale, but pricing is regulated to be within **175%-200%** of the original price.
7. **Secondary Market Purchase** → If another user buys a resold ticket:
   - **90%** of the resale price goes to the **reseller**.
   - **10%** goes to the **event organizer as royalty**.
   - **Event organizers can claim their royalties anytime**.
8. **Create Event** → Users can **organize events** by submitting event details. All ticket sales are credited to their wallets, which they can claim anytime.

## Tech Stack
### **Frontend (Next.js 15 - App Router)**
- Next.js (App Router)
- Radix UI, Framer Motion, ShadCN, Tailwind (for styling)
- Context API (for wallet state management)
- Ethers.js (for blockchain interaction)
- QR Code Generator & Scanner (for ticket validation)
- Cloudinary (for image storage)

### **Backend (Node.js & Express.js)**
- Ethers.js (Ethereum interaction)
- Alchemy RPC (for Ethereum Sepolia node connection)

### **Blockchain (Ethereum - Solidity - Hardhat)**
- ERC-721 Smart Contract for NFT Tickets
- IPFS (for metadata storage) using Pinata
- Hardhat (development & deployment framework)
- Alchemy RPC (for contract interaction)

## Folder Structure
```
/event-booking
│── backend/              # Express.js backend
│   ├── config/           # Contract ABI & database config
│   ├── routes/           # API endpoints for tickets & events
│   ├── server.js         # Backend entry point
│── blockchain/           # Hardhat & Solidity contracts
│   ├── contracts/        # Solidity contracts
│   ├── scripts/          # Deployment scripts
│   ├── metadata/         # Ticket metadata on IPFS
│── client/               # Next.js frontend
│   ├── app/              # Next.js App Router components
│   ├── components/       # Reusable UI components
│   ├── context/          # Wallet & contract state management
│── .env                  # Environment variables
│── README.md             # Project documentation
```

## Smart Contract Details
- **TicketNFT.sol**: Implements ERC-721 ticket NFTs.
- **Functions:**
  - `mintTicket(address buyer, uint256 eventId)` → Mints a new ticket.
  - `getTicketDetails(uint256 tokenId)` → Returns ticket details.
  - `markTicketAsUsed(uint256 tokenId)` → Marks a ticket as used.
  - `resellTicket(uint256 tokenId, uint256 price)` → Lists ticket for resale within 175%-200% price range.
  - `buyResaleTicket(uint256 tokenId)` → Purchases a resale ticket.
  - `withdrawSellerFunds()` → Withdraws resale earnings (90% of resale price).
  - `withdrawOrganizerFunds()` → Withdraws event earnings and royalties (10% of resale price).
  - `listForSale(uint256 ticketId, uint256 price)` → Lists a ticket for resale with price caps.
  - `getResaleTickets()` → Fetches all resale tickets.

## Installation & Setup
### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/event-booking.git
cd event-booking
```

### **2. Install Dependencies**
#### Install Frontend
```bash
cd client
npm install
```
#### Install Backend
```bash
cd backend
npm install
```
#### Install Blockchain Dependencies
```bash
cd blockchain
npm install
```

### **3. Set Up Environment Variables**
Create a `.env` file in both `backend/` and `blockchain/` folders with:
```bash
ALCHEMY_SEPOLIA_URL:
PRIVATE_KEY:
PINATA_API_KEY:
PINATA_SECRET_KEY:
PINATA_JWT:
CONTRACT_ADDRESS:
```

Create a `.env` file in `client/` folders with:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS:
NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL:
CLOUDINARY_CLOUD_NAME:
CLOUDINARY_API_KEY:
CLOUDINARY_API_SECRET:
```

### **4. Deploy Smart Contracts**
```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### **5. Start Backend Server**
```bash
cd backend
node server.js
```

### **6. Run Frontend**
```bash
cd client
npm run dev
```

## Roadmap & Future Enhancements
- ✅ Implement ERC-721-based ticketing
- ✅ Store metadata on IPFS
- ✅ Implement resale functionality with price caps
- ✅ Add organizer royalty system
- 🔄 Improve event management UI
- 🔄 Implement fiat payment support
- 🔄 Expand multi-chain compatibility (Polygon, Arbitrum)
- 🔄 Add images for all screens in README

## License
This project is licensed under the **MIT License**.

## Contributors
- **Indresh** - [GitHub](https://github.com/INDRESH-009)
- **Haryshwa** - [GitHub](https://github.com/haryshwa05)

---
_This project is under active development. Contributions are welcome!_ 🚀
