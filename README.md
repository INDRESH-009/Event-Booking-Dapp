# Decentralized Event Ticket Booking DApp

## Overview
This is a **decentralized event ticket booking application** built on the **Ethereum Sepolia Testnet**. It allows users to buy, sell, and validate event tickets as **ERC-721 NFTs**. The application ensures secure transactions, resale price capping, and fraud prevention using blockchain technology.

## Features
- **NFT-Based Ticketing**: Tickets are minted as **ERC-721 NFTs**.
- **Wallet Connection**: Users connect their wallets via MetaMask.
- **Ticket Purchase & Resale**: Users can buy, sell, and validate tickets.
- **Event Management**: Events are dynamically created and managed.
- **IPFS Integration**: Ticket metadata is stored on **IPFS via Pinata**.
- **QR Code-Based Validation**: Tickets can be verified using a QR scanner.
- **Cloudinary Integration**: Stores event images.
- **Gas Fee Optimization**: Smart contracts are optimized to minimize gas costs.

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
  - `resellTicket(uint256 tokenId, uint256 price)` → Lists ticket for resale.
  - `buyResaleTicket(uint256 tokenId)` → Purchases a resale ticket.
  - `withdrawSellerFunds()` → Withdraws resale earnings.
  - `withdrawOrganizerFunds()` → Withdraws event earnings.
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
ALCHEMY_API_KEY=your-alchemy-api-key
PRIVATE_KEY=your-wallet-private-key
IPFS_API_KEY=your-ipfs-api-key
IPFS_SECRET=your-ipfs-secret
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

## Usage
1. **Connect Wallet**: Click "Connect Wallet" on the homepage.
2. **View Events**: Browse upcoming events.
3. **Buy Tickets**: Purchase event tickets (minted as NFTs).
4. **View Tickets**: Check your owned tickets in the profile section.
5. **Resell Tickets**: List purchased tickets for resale.
6. **Validate Entry**: Scan QR code to verify ticket authenticity.

## Roadmap & Future Enhancements
- ✅ Implement ERC-721-based ticketing
- ✅ Store metadata on IPFS
- ✅ Implement resale functionality with price caps
- 🔄 Improve event management UI
- 🔄 Implement fiat payment support
- 🔄 Expand multi-chain compatibility (Polygon, Arbitrum)

## License
This project is licensed under the **MIT License**.

## Contributors
- **Your Name** - [GitHub](https://github.com/INDRESH-009)
- **Collaborator Name** - [GitHub](https://github.com/haryshwa05)

---
_This project is under active development. Contributions are welcome!_ 🚀

