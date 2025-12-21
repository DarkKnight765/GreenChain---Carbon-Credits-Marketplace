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
      `✅ Wallet association cleared for ${user.email}!\n\nPlease disconnect and reconnect with the correct MetaMask account.`
    );
  };

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>⚙️ Settings</h1>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2>Contract Address</h2>
        <p>Save the address of your deployed contract:</p>
        <input
          type="text"
          placeholder="Contract Address"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "0.9em",
          }}
        />
        <button
          onClick={handleSave}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Save Address
        </button>
      </div>

      <div
        className="card"
        style={{ marginBottom: "2rem", borderLeft: "4px solid #f59e0b" }}
      >
        <h2>🔄 Reset Wallet Association</h2>
        <p>
          <strong>Current Account:</strong> {user.email} ({user.role})
        </p>
        <p style={{ color: "#666", fontSize: "0.9em" }}>
          If you're seeing a warning about using the wrong wallet, click below
          to reset the saved wallet for this account. Then disconnect and
          reconnect with the correct MetaMask account.
        </p>
        <button
          onClick={handleResetWallet}
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔄 Reset Wallet
        </button>
      </div>

      <div
        className="card"
        style={{ background: "#f0fdf4", borderLeft: "4px solid #10b981" }}
      >
        <h2>ℹ️ Wallet Guide</h2>
        <ul style={{ lineHeight: "1.8", color: "#333" }}>
          <li>
            <strong>NGO Account:</strong> Use MetaMask Account 1
          </li>
          <li>
            <strong>Company Account:</strong> Use MetaMask Account 2
          </li>
          <li>Each email address is linked to ONE wallet forever</li>
          <li>If you use the wrong wallet, the system will warn you</li>
          <li>
            Use the "Reset Wallet" button above to change which wallet is linked
          </li>
        </ul>
      </div>
    </div>
  );
}
