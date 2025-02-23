async function main() {
    const TicketNFT = await ethers.getContractFactory("TicketNFT");
    console.log("Deploying NFT...");
    const ticketNFT = await TicketNFT.deploy();
    await ticketNFT.waitForDeployment();
    console.log("TicketNFT deployed to:", ticketNFT.target);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  