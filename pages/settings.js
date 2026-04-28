import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Settings() {
  const [contractAddress, setContractAddress] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }

    const storedAddress = localStorage.getItem("contractAddress");
    if (storedAddress) {
      setContractAddress(storedAddress);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("contractAddress", contractAddress);
    alert("Contract address saved!");
  };

  const handleResetWallet = () => {
    if (!user) return;
    const walletKey = `wallet_${user.email}`;
    localStorage.removeItem(walletKey);
    alert(
      `✅ Wallet association cleared for ${user.email}!\n\nPlease disconnect and reconnect with the correct MetaMask account.`,
    );
  };

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>⚙️ Settings</h1>

      <div className="card settings-card">
        <h2>Contract Address</h2>
        <p>Save the address of your deployed contract:</p>
        <input
          className="settings-input"
          type="text"
          placeholder="Contract Address"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
        <button onClick={handleSave} className="app-button">
          Save Address
        </button>
      </div>

      <div className="card settings-card settings-highlight">
        <h2>👤 Wallets & Profile</h2>
        <p>
          <strong>Current Account:</strong> {user.email} ({user.role})
        </p>
        <p className="settings-tip">
          You can link multiple wallets to this account now. Open your profile
          to manage wallet history and review linked addresses.
        </p>
        <button
          onClick={() => router.push("/profile")}
          className="app-button warn"
        >
          Open Profile
        </button>
      </div>

      <div className="card settings-guide">
        <h2>ℹ️ Wallet Guide</h2>
        <ul className="settings-list">
          <li>Each email address can link multiple wallets over time</li>
          <li>Wallets already linked to a different user are blocked</li>
          <li>See your wallet connection history in the Profile page</li>
          <li>Use the Profile page to review and manage linked wallets</li>
        </ul>
      </div>
    </div>
  );
}
