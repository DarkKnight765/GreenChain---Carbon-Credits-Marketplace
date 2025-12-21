import { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";

export default function WalletChecker({ user }) {
  const { account, isActive } = useWeb3React();
  const [warning, setWarning] = useState(null);
  const [savedWallet, setSavedWallet] = useState(null);

  useEffect(() => {
    if (user) {
      // Get saved wallet for this user
      const walletKey = `wallet_${user.email}`;
      const stored = localStorage.getItem(walletKey);
      setSavedWallet(stored);

      if (isActive && account) {
        if (!stored) {
          // First time connecting - save this wallet
          localStorage.setItem(walletKey, account.toLowerCase());
          setSavedWallet(account.toLowerCase());
          setWarning(null);
        } else if (stored.toLowerCase() !== account.toLowerCase()) {
          // Wrong wallet connected
          // setWarning(
          //   `⚠️ Warning: You're using a different wallet! Expected ${stored.slice(
          //     0,
          //     8
          //   )}...${stored.slice(-6)} for ${user.email}`
          // );
        } else {
          // Correct wallet
          setWarning(null);
        }
      }
    }
  }, [user, account, isActive]);

  if (!warning) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
        color: "white",
        padding: "1rem 2rem",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 9999,
        maxWidth: "600px",
        textAlign: "center",
        animation: "slideDown 0.3s ease-out",
      }}
    >
      <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.9em" }}>
        {warning}
      </p>
      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8em" }}>
        Please switch to the correct MetaMask account or use "Switch Account"
        button.
      </p>
    </div>
  );
}
