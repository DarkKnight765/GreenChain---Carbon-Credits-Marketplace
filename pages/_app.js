import "../styles/globals.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { metaMask, hooks } from "./utils/web3";
import { useRouter } from "next/router";
import WalletChecker from "../components/WalletChecker";

const connectors = [[metaMask, hooks]];

// Removed eager connect - users must manually connect wallet

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (router.pathname === "/listings/new" && parsedUser.role !== "ngo") {
        router.push("/");
      }
    }
  }, [router.pathname]);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  return (
    <Web3ReactProvider connectors={connectors}>
      <nav>
        <div className="nav-logo">
          <Link legacyBehavior href="/">
            <a className="logo">🌱 GreenChain</a>
          </Link>
        </div>

        <div className="nav-links">
          <Link legacyBehavior href="/">
            <a>Home</a>
          </Link>
          <Link legacyBehavior href="/market">
            <a>Marketplace</a>
          </Link>
          {user && (
            <Link legacyBehavior href="/dashboard">
              <a>📊 Dashboard</a>
            </Link>
          )}
          {user && user.role === "ngo" && (
            <Link legacyBehavior href="/listings/new">
              <a>➕ Create Listing</a>
            </Link>
          )}
          <Link legacyBehavior href="/deploy">
            <a>Deploy</a>
          </Link>
          <Link legacyBehavior href="/settings">
            <a>⚙️ Settings</a>
          </Link>
        </div>

        <div className="nav-user">
          {user ? (
            <>
              <span className="user-info">
                {user.email} <span className="role-badge">{user.role}</span>
              </span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link legacyBehavior href="/login">
                <a>Login</a>
              </Link>
              <Link legacyBehavior href="/register">
                <a className="register-btn">Register</a>
              </Link>
            </>
          )}
        </div>
      </nav>
      <WalletChecker user={user} />
      <Component {...pageProps} user={user} />
    </Web3ReactProvider>
  );
}

export default MyApp;
