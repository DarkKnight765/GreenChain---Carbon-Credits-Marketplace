import { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { metaMask } from "../pages/utils/web3";
import Link from "next/link";

export default function ProfileMenu({ user, onLogout, onUserUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [walletStatus, setWalletStatus] = useState(null); // 'valid', 'invalid', 'unlinked', etc.
  const [walletMessage, setWalletMessage] = useState("");
  const { connector, account, chainId, isActive } = useWeb3React();

  // Validate wallet when account or user changes
  useEffect(() => {
    if (isActive && account && user) {
      validateWallet(user.id, account);
    }
  }, [account, user, isActive]);

  // Auto-disconnect wallet if user is not logged in
  useEffect(() => {
    if (!user && isActive) {
      // User is not logged in but wallet is connected - disconnect it
      disconnectWallet();
    }
  }, [user, isActive]);

  const validateWallet = async (userId, walletAddress) => {
    try {
      const res = await fetch("/api/wallet/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, walletAddress }),
      });

      const data = await res.json();

      if (data.valid) {
        if (data.requiresLink) {
          // First time connecting - link the wallet
          await linkWallet(userId, walletAddress);
        } else {
          setWalletStatus("valid");
          setWalletMessage("✓ Wallet verified");
        }
      } else {
        setWalletStatus("invalid");
        setWalletMessage(data.message);
        console.warn("❌ Wrong wallet connected!");
      }
    } catch (error) {
      console.error("Wallet validation error:", error);
      setWalletStatus("error");
      setWalletMessage("Could not validate wallet");
    }
  };

  const linkWallet = async (userId, walletAddress) => {
    try {
      const res = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, walletAddress }),
      });

      const data = await res.json();

      if (res.ok) {
        setWalletStatus("valid");
        setWalletMessage("✓ Wallet linked successfully");
        if (onUserUpdate && data.user) {
          onUserUpdate(data.user);
        }
      } else {
        setWalletStatus("error");
        setWalletMessage(data.message);
      }
    } catch (error) {
      console.error("Wallet linking error:", error);
      setWalletStatus("error");
      setWalletMessage("Could not link wallet");
    }
  };

  const connect = async () => {
    if (!user) {
      alert("Please login first before connecting a wallet.");
      return;
    }

    try {
      if (!window.ethereum) {
        console.error("MetaMask not detected");
        return;
      }

      if (window.ethereum.request) {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }

      await metaMask.activate(11155111);
    } catch (error) {
      console.error("Failed to connect", error);
    }
  };

  const disconnectWallet = async (reload = true) => {
    try {
      if (connector?.deactivate) {
        await connector.deactivate();
      }
      if (connector?.resetState) {
        await connector.resetState();
      }

      if (window.ethereum?.request) {
        try {
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (revokeError) {
          console.warn("Could not revoke wallet permissions", revokeError);
        }
      }

      localStorage.removeItem("walletconnect");

      if (reload) {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error("Failed to disconnect", error);
      if (reload) {
        window.location.reload();
      }
    }
  };

  const switchAccount = async () => {
    try {
      const currentAccounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const oldAccount = currentAccounts[0];

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      setTimeout(async () => {
        const newAccounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        const newAccount = newAccounts[0];

        if (newAccount && newAccount !== oldAccount) {
          console.log("Account switched from", oldAccount, "to", newAccount);
          window.location.reload();
        }
      }, 100);
    } catch (error) {
      console.error("Failed to switch account", error);
    }
  };

  return (
    <div className="profile-menu-container">
      <button
        className="profile-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title={user ? user.email : "Profile"}
      >
        <div className="profile-avatar">
          {user ? user.email.charAt(0).toUpperCase() : "👤"}
        </div>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          {/* User Info Section */}
          {user && (
            <div className="dropdown-section user-section">
              <div className="user-display">
                <p className="user-email">{user.email}</p>
                <p className="user-role">{user.role.toUpperCase()}</p>
                <p className="user-wallet-count">
                  {Array.isArray(user.wallets) ? user.wallets.length : 0} linked
                  wallets
                </p>
              </div>
            </div>
          )}

          {user && (
            <div className="dropdown-section profile-section">
              <Link legacyBehavior href="/profile">
                <a className="auth-link" onClick={() => setIsOpen(false)}>
                  👤 Profile Page
                </a>
              </Link>
            </div>
          )}

          {/* Wallet Section */}
          <div className="dropdown-section wallet-section">
            <p className="section-label">Wallet</p>
            {isActive && account ? (
              <>
                <p className="wallet-info">
                  <span className="wallet-label">Connected:</span>
                  <span className="wallet-addr">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </p>
                <p className="wallet-info">
                  <span className="wallet-label">Chain:</span>
                  <span>{chainId}</span>
                </p>

                {user && Array.isArray(user.wallets) && (
                  <p className="wallet-info wallet-info-multi">
                    <span className="wallet-label">Saved:</span>
                    <span>{user.wallets.length} wallets</span>
                  </p>
                )}

                {/* Wallet Status */}
                {walletStatus && (
                  <div
                    className={`wallet-status wallet-status-${walletStatus}`}
                  >
                    {walletMessage}
                  </div>
                )}

                {/* Warning if wallet is invalid */}
                {walletStatus === "invalid" && (
                  <div className="wallet-warning">
                    ⚠️ This wallet is not linked to your account. Please use the
                    correct wallet or disconnect.
                  </div>
                )}

                <div className="wallet-actions">
                  <button
                    onClick={switchAccount}
                    className="wallet-btn switch-btn"
                  >
                    Switch Account
                  </button>
                  <button
                    onClick={() => disconnectWallet(true)}
                    className="wallet-btn disconnect-btn"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            ) : user ? (
              <button onClick={connect} className="wallet-btn connect-btn">
                Connect Wallet
              </button>
            ) : (
              <div className="wallet-login-required">
                <p>Login required to connect wallet</p>
                <Link legacyBehavior href="/login">
                  <a className="auth-link" onClick={() => setIsOpen(false)}>
                    Go to Login
                  </a>
                </Link>
              </div>
            )}
          </div>

          {/* Auth Section */}
          {!user && (
            <div className="dropdown-section auth-section">
              <Link legacyBehavior href="/login">
                <a className="auth-link" onClick={() => setIsOpen(false)}>
                  Login
                </a>
              </Link>
              <Link legacyBehavior href="/register">
                <a
                  className="auth-link register-link"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </a>
              </Link>
            </div>
          )}

          {/* Logout Section */}
          {user && (
            <div className="dropdown-section logout-section">
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
