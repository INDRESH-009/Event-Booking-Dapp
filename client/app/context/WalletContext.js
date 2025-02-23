"use client";
import { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Use BrowserProvider for ethers v6
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await ethProvider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        // Obtain the signer from the provider
        const _signer = await ethProvider.getSigner();
        setSigner(_signer);
        setProvider(ethProvider);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        setAccount(accounts[0] || null);
        if (provider) {
          const _signer = await provider.getSigner();
          setSigner(_signer);
        }
      });
    }
  }, [provider]);

  return (
    <WalletContext.Provider value={{ account, provider, signer, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
