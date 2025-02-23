require("dotenv").config();
const { PinataSDK } = require("pinata-web3");
const fs = require("fs");

// Instantiate with a valid JWT and gateway
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
  });
  
async function uploadToIPFS() {
    try {
        // Upload ticket image
        const fileBuffer = fs.readFileSync("/Users/indreshmr/event-booking/blockchain/metadata/ticket.png");
        const blob = new Blob([fileBuffer]); // Node 18+ has a global Blob implementation
        const imageResponse = await pinata.upload.file(blob);
        console.log("Image uploaded:", `ipfs://${imageResponse.IpfsHash}`);

        // Update metadata with image URL
        const metadata = JSON.parse(fs.readFileSync("/Users/indreshmr/event-booking/blockchain/metadata/metadata.json", "utf8"));
        metadata.image = `ipfs://${imageResponse.IpfsHash}`;

        // Upload metadata.json to IPFS
        const metadataResponse = await pinata.upload.json(metadata);

        console.log("Metadata uploaded:", `ipfs://${metadataResponse.IpfsHash}`);
    } catch (error) {
        console.error("IPFS upload failed:", error);
    }
}

uploadToIPFS();
