import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import abi from "../contracts/abi.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [ownedCredits, setOwnedCredits] = useState([]);
  const [listings, setListings] = useState([]);
  const [contract, setContract] = useState(null);
  const router = useRouter();
  const { provider, isActive, account } = useWeb3React();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    if (isActive && provider) {
      const contractAddress = localStorage.getItem("contractAddress");
      if (contractAddress) {
        const signer = provider.getSigner();
        const loadedContract = new ethers.Contract(
          contractAddress,
          abi,
          signer
        );
        setContract(loadedContract);
      }
    }
  }, [isActive, provider]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchListings();
      if (contract && account) {
        fetchOwnedCredits();
      }
    }
  }, [user, contract, account]);

  const fetchListings = async () => {
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      const filtered = data.filter(
        (tx) => tx.buyerId === user.id || tx.sellerId === user.id
      );
      setTransactions(filtered);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchOwnedCredits = async () => {
    try {
      const owned = [];
      const txRes = await fetch("/api/transactions");
      const allTransactions = await txRes.json();
      const userPurchases = allTransactions.filter(
        (tx) => tx.buyerId === user.id
      );

      const tokenToTx = {};
      for (const tx of userPurchases) {
        if (tx.tokenIds && tx.tokenIds.length > 0) {
          tx.tokenIds.forEach((id) => {
            tokenToTx[id] = tx;
          });
        }
      }

      for (const tokenId in tokenToTx) {
        try {
          const credit = await contract.carbonCredits(tokenId);
          if (credit.owner.toLowerCase() === account.toLowerCase()) {
            const tx = tokenToTx[tokenId];
            owned.push({
              tokenId: parseInt(tokenId),
              listingName: tx.listingName,
              price: ethers.utils.formatEther(credit.price),
              isForSale: credit.isForSale,
            });
          }
        } catch (err) {
          console.error(`Error checking token ${tokenId}:`, err);
        }
      }
      setOwnedCredits(owned);
    } catch (error) {
      console.error("Error fetching owned credits:", error);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-outfit antialiased">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div className="mb-8" {...fadeUp} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              <Badge variant="outline" className="mr-2 uppercase">{user.role}</Badge> 
              {user.email}
            </p>
          </motion.div>

          {/* Owned Credits Section (Companies) */}
          {user.role === "company" && (
            <motion.section className="mb-12" {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" /> My Owned Credits
              </h2>
              {ownedCredits.length === 0 ? (
                <p className="text-muted-foreground italic bg-muted/30 p-4 rounded-xl">You don't own any carbon credits yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ownedCredits.map((credit, index) => (
                    <div key={index} className="glass-card rounded-2xl p-5">
                      <h3 className="font-semibold text-foreground text-lg mb-2">{credit.listingName}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Token ID:</strong> #{credit.tokenId}</p>
                        <p><strong>Price:</strong> {credit.price} ETH</p>
                        <Badge className="mt-2" variant={credit.isForSale ? "outline" : "default"}>
                          {credit.isForSale ? "Listed for Sale" : "In Portfolio"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {/* Active Listings Section (NGOs) */}
          {user.role === "ngo" && (
            <motion.section className="mb-12" {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> My Active Listings
              </h2>
              {listings.filter((l) => l.sellerId === user.id && l.tokenIds && l.tokenIds.length > 0).length === 0 ? (
                <p className="text-muted-foreground italic bg-muted/30 p-4 rounded-xl">You have no active listings. Create one to start selling!</p>
              ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Available Qty</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Token IDs</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listings
                          .filter((l) => l.sellerId === user.id && l.tokenIds && l.tokenIds.length > 0)
                          .map((listing) => (
                          <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="p-4 font-medium text-foreground">{listing.name}</td>
                            <td className="p-4 text-muted-foreground">{listing.tokenIds?.length || 0}</td>
                            <td className="p-4 text-muted-foreground font-semibold">{listing.price} ETH</td>
                            <td className="p-4 text-muted-foreground text-xs">{listing.tokenIds?.join(", ")}</td>
                            <td className="p-4">
                              <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* Transaction History */}
          <motion.section className="mb-12" {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }}>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> 
              {user.role === "ngo" ? "Sales History" : "Purchase History"}
            </h2>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground italic bg-muted/30 p-4 rounded-xl">No transactions yet.</p>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Listing</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Qty</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Price (ETH)</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">{user.role === "ngo" ? "Buyer" : "Seller"}</th>
                        <th className="text-left p-4 font-medium text-foreground">Total (ETH)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, index) => {
                        // Determine if current user is buyer or seller
                        const isBuyer = tx.buyerId === user.id;
                        return (
                          <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="p-4 text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${isBuyer ? "text-primary" : "text-accent"}`}>
                                {isBuyer ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                {isBuyer ? "BUY" : "SELL"}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-foreground">{tx.listingName}</td>
                            <td className="p-4 text-muted-foreground">{tx.quantity}</td>
                            <td className="p-4 text-muted-foreground">{tx.pricePerUnit}</td>
                            <td className="p-4 text-muted-foreground">{user.role === "ngo" ? tx.buyerEmail : tx.sellerEmail}</td>
                            <td className="p-4 font-bold text-foreground">
                              {(parseFloat(tx.pricePerUnit) * parseInt(tx.quantity)).toFixed(6)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
