import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

const WalletConnect = () => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");

  const handleConnect = () => {
    // Simulated wallet connection
    const mockAddress = "0x1a2b...3c4d";
    setAddress(mockAddress);
    setConnected(true);
  };

  const handleDisconnect = () => {
    setAddress("");
    setConnected(false);
  };

  if (connected) {
    return (
      <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-glow animate-pulse-green" />
        {address}
      </Button>
    );
  }

  return (
    <Button variant="wallet" size="sm" onClick={handleConnect} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
};

export default WalletConnect;
