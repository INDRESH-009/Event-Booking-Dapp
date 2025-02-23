require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks:{
    sepolia:{
      // Alchemy or Infura RPC URL
      url:process.env.ALCHEMY_SEPOLIA_URL,
      // Private key of the deployer wallet
      accounts:[process.env.PRIVATE_KEY],
      chainId:11155111, 
    },
  },
  etherscan: {
    // for verifying contracts
    apiKey:process.env.POLYGONSCAN_API_KEY,
  }
};
