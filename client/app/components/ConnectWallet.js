"use client";
import { useContext, useEffect } from "react";
import { WalletContext } from "../context/WalletContext";
import { useRouter } from "next/navigation";

export default function ConnectWallet() {
  const { account, connectWallet } = useContext(WalletContext);
  const router = useRouter();

  useEffect(() => {
    if (account) {
      router.push("/events"); // Redirect to events page after connection
    }
  }, [account, router]);

  return (
    <button onClick={connectWallet}>
      {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}
