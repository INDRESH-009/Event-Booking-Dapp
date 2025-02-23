"use client";
import { useContext, useEffect } from "react";
import { WalletContext } from "./context/WalletContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ticket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingPaper } from "@/app/components/floating-paper";
import { RoboAnimation } from "@/app/components/robo-animation";
import { SparklesCore } from "@/app/components/sparkles";

export default function Home() {
  const { account, connectWallet } = useContext(WalletContext);
  const router = useRouter();

  useEffect(() => {
    if (account) {
      router.push("/events"); // Redirect to events page after connection
    }
  }, [account, router]);

  return (
    <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
      {/* Background Particle Effect */}
      <div className="h-full w-full absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Hero Section */}
      <div className="relative min-h-[calc(100vh-76px)] flex items-center">
        {/* Floating tickets background */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingPaper count={6} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                Secure & Transparent Ticketing with
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  {" "}
                  Block My Show
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
            >
              Say goodbye to fraud, scalping, and overpriced tickets. Book, resell, and verify event tickets seamlessly 
              with blockchain-powered NFT tickets.
            </motion.p>

            {/* Wallet Connection Button (Replacing Get Tickets) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                onClick={connectWallet}
              >
                <Ticket className="mr-2 h-5 w-5" />
                {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
              </Button>
              <Button size="lg" variant="outline" className="text-black bg-white hover:bg-purple-500/20">
                <Sparkles className="mr-2 h-5 w-5" />
                Explore Features
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Animated Robot Effect */}
        <div className="absolute bottom-0 right-0 w-96 h-96">
          <RoboAnimation />
        </div>
      </div>
    </main>
  );
}
