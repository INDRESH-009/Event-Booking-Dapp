import { ethers } from "ethers";

const contractABI = require("../config/contractABI.json");
const contractAddress = "0xcf3e6E02b14dD0346dB40E357F333A1678099D25";

export const getContract = () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
};
