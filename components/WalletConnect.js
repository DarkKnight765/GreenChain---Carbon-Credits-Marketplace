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
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [isActive]);

  const connect = async () => {
    try {
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
    <div>
      {isActive ? (
        <div>
          <p>
            Connected with{" "}
            <b>
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </b>
          </p>
          <p>Chain ID: {chainId}</p>
          <button onClick={switchAccount} style={{ marginRight: "10px" }}>
            Switch Account
          </button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
