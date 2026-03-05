import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../contracts/abi.json";
import { useWeb3React } from "@web3-react/core";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WalletConnect from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ServerCog, CheckCircle2 } from "lucide-react";

export default function Deploy() {
  const [contractAddress, setContractAddress] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const { provider, isActive } = useWeb3React();

  const handleDeploy = async () => {
    if (isActive && provider) {
      setIsDeploying(true);
      try {
        const res = await fetch("/api/bytecode");
        if (!res.ok) throw new Error("Failed to fetch bytecode");
        const { bytecode } = await res.json();
        if (!bytecode) throw new Error("Bytecode is empty or undefined");

        const signer = provider.getSigner();
        const factory = new ethers.ContractFactory(abi, bytecode, signer);
        
        const contract = await factory.deploy();
        await contract.deployed();
        const address = contract.address;
        setContractAddress(address);
        localStorage.setItem("contractAddress", address);
        alert("Contract deployed successfully to: " + address);
      } catch (error) {
        console.error("Error deploying contract:", error);
        alert("Error deploying contract. Check console for details.");
      } finally {
        setIsDeploying(false);
      }
    } else {
      alert("Please connect your wallet to deploy the contract.");
    }
  };

  useEffect(() => {
    const savedAddress = localStorage.getItem("contractAddress");
    if (savedAddress) {
      setContractAddress(savedAddress);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-outfit antialiased">
      <Navbar />
      <div className="pt-24 pb-16 min-h-[80vh] flex flex-col items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            className="glass-card rounded-3xl p-8 md:p-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto h-16 w-16 rounded-2xl gradient-forest flex items-center justify-center mb-6">
              <ServerCog className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-foreground">Deploy Smart Contract</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              This admin panel deploys the core GreenChain smart contract to the selected blockchain network.
              Ensure your wallet is connected and you have sufficient funds for gas.
            </p>

            <div className="bg-muted/50 border border-border rounded-xl p-6 mb-8 flex flex-col items-center justify-center space-y-4">
              <ShieldAlert className="h-6 w-6 text-accent" />
              <WalletConnect />
            </div>

            <Button
              onClick={handleDeploy}
              size="xl"
              variant="hero"
              disabled={isDeploying || !isActive}
              className="w-full text-lg mb-6"
            >
              {isDeploying ? "Deploying Contract..." : "Deploy Contract Node"}
            </Button>

            {contractAddress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-left mt-8"
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h3 className="text-primary font-bold text-lg">Contract Deployed Successfully!</h3>
                </div>
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-muted-foreground">Contract Address:</p>
                  <code className="block w-full bg-background p-3 rounded-lg border border-border text-xs text-foreground font-mono break-all text-center">
                    {contractAddress}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  This address is saved locally and will be used by the marketplace automatically.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
