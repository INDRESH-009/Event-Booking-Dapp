"use client";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useContext } from "react";
import { WalletContext } from "../context/WalletContext";

export default function Navbar() {
  const { account } = useContext(WalletContext);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="flex items-center justify-between bg-black px-6 py-4 backdrop-blur-sm border-b border-white/10"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/logo-new.png" alt="Block My Show" width={180} height={180} />
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/events">Events</NavLink>
        {account && <NavLink href="/profile">Profile</NavLink>}
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <Button variant="ghost" className="text-white hover:text-purple-400">
          Sign In
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          Get Tickets
        </Button>
      </div>

      <Button variant="ghost" size="icon" className="md:hidden text-white">
        <Menu className="w-6 h-6" />
      </Button>
    </motion.nav>
  );
}

function NavLink({ href, children }) {
  return (
    <Link href={href} className="text-gray-300 hover:text-white transition-colors relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
    </Link>
  );
}
