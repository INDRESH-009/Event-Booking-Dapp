"use client";
import Link from "next/link";
import { useContext } from "react";
import { WalletContext } from "../context/WalletContext";

export default function Navbar() {
  const { account } = useContext(WalletContext);

  return (
    <nav style={{ padding: "10px", background: "#f0f0f0", display: "flex", gap: "20px" }}>
      <Link href="/">Home</Link>
      <Link href="/events">Events</Link>
      {account && <Link href="/profile">Profile</Link>}
      {account && <Link href="/resale">Secondary Market</Link>}
    </nav>
  );
}
