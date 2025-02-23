"use client";
import { useContext } from "react";
import { WalletContext } from "../context/WalletContext";
import { useRouter } from "next/navigation";

export default function Login() {
  const { account, connectWallet } = useContext(WalletContext);
  const router = useRouter();

  if (account) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={connectWallet}>Connect MetaMask</button>
    </div>
  );
}