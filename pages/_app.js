import "../styles/globals.css";
import { useState, useEffect } from "react";
import { Web3ReactProvider } from "@web3-react/core";
import { metaMask, hooks } from "./utils/web3";
import { useRouter } from "next/router";
import WalletChecker from "../components/WalletChecker";

const connectors = [[metaMask, hooks]];

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
      {/* Navbar is now handled inside each page or layout if desired, 
          but for simplicity, we let the new UI pages include their own <Navbar /> 
          as designed in the Vite app. Thus we remove the old <nav> here. */}
      <WalletChecker user={user} />
      <Component {...pageProps} user={user} logout={logout} />
    </Web3ReactProvider>
  );
}

export default MyApp;
