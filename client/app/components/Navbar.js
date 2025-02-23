"use client";
import { Button } from "@/components/ui/button";
import { Menu, Calendar, User, ShoppingBag } from "lucide-react";
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
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-black px-6 py-4 backdrop-blur-sm border-b border-white/10"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/logo-new.png" alt="Block My Show" width={180} height={180} />
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        <NavLink href="/events" Icon={Calendar}>
          Events
        </NavLink>
        {account && (
          <>
            <NavLink href="/resale" Icon={ShoppingBag}>
              Secondary Market
            </NavLink>
            <NavLink href="/profile" Icon={User}>
              Profile
            </NavLink>
          </>
        )}
      </div>

      <Button variant="ghost" size="icon" className="md:hidden text-white">
        <Menu className="w-6 h-6" />
      </Button>
    </motion.nav>
  );
}

function NavLink({ href, children, Icon }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors relative group"
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
    </Link>
  );
}
