import { useWeb3React } from "@web3-react/core";
import { metaMask } from "../pages/utils/web3";
import { useEffect } from "react";

export default function WalletConnect() {
  const { connector, account, chainId, isActive } = useWeb3React();

  // Listen for account and chain changes
  useEffect(() => {
    if (window.ethereum && isActive) {
      const handleAccountsChanged = (accounts) => {
        console.log("Account changed to:", accounts[0]);
        if (accounts.length > 0) {
          // Reload page to refresh with new account
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          // Disconnected
          window.location.reload();
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("Chain changed to:", chainId);
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged,
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [isActive]);

  const connect = async () => {
    try {
      if (!window.ethereum) {
        console.error("MetaMask not detected");
        return;
      }

      // Ask for eth_accounts permission first so MetaMask opens account selection.
      if (window.ethereum.request) {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }

      // Activate MetaMask with Sepolia chain ID
      await metaMask.activate(11155111);
    } catch (error) {
      console.error("Failed to connect", error);
    }
  };

  const disconnect = async () => {
    try {
      if (connector?.deactivate) {
        await connector.deactivate();
      }
      if (connector?.resetState) {
        await connector.resetState();
      }

      // Best-effort revoke so next connect prompts account picker again.
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

      // Clear any cached connection
      localStorage.removeItem("walletconnect");
      // Small delay before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Failed to disconnect", error);
      window.location.reload();
    }
  };

  const switchAccount = async () => {
    try {
      // Get current account before switch
      const currentAccounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const oldAccount = currentAccounts[0];

      // Request MetaMask to show account switcher
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // Check if account actually changed
      setTimeout(async () => {
        const newAccounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        const newAccount = newAccounts[0];

        if (newAccount && newAccount !== oldAccount) {
          console.log("Account switched from", oldAccount, "to", newAccount);
          // Force reload with new account
          window.location.reload();
        }
      }, 100);
    } catch (error) {
      console.error("Failed to switch account", error);
    }
  };

  return (
    <div className="wallet-panel">
      {isActive ? (
        <div>
          <p className="wallet-meta">
            Connected with{" "}
            <b>
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </b>
          </p>
          <p className="wallet-meta">Chain ID: {chainId}</p>
          <div className="wallet-actions">
            <button onClick={switchAccount} className="app-button warn">
              Switch Account
            </button>
            <button onClick={disconnect} className="app-button danger">
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button onClick={connect} className="app-button">
          Connect Wallet
        </button>
      )}
    </div>
  );
}
