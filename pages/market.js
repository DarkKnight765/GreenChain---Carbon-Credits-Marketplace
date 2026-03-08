import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import abi from "../contracts/abi.json";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWeb3React } from "@web3-react/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Leaf, ShoppingCart, Tag, RotateCw } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function Market() {
  const [listings, setListings] = useState([]);
  const [user, setUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [onchainStatus, setOnchainStatus] = useState({});
  const [relistPrice, setRelistPrice] = useState({});
  const [relistQuantity, setRelistQuantity] = useState({});
  const [buyQuantity, setBuyQuantity] = useState({});
  const { provider, isActive, account } = useWeb3React();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const fetchListings = async () => {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setListings(data);
    };
    fetchListings();
  }, []);

  useEffect(() => {
    if (isActive && provider) {
      const contractAddress = localStorage.getItem("contractAddress");
      if (contractAddress) {
        const signer = provider.getSigner();
        const loadedContract = new ethers.Contract(contractAddress, abi, signer);
        setContract(loadedContract);
      }
    }
  }, [isActive, provider]);

  const fetchStatus = useCallback(async () => {
    if (!contract || listings.length === 0) return;
    const statusMap = {};
    for (const listing of listings) {
      try {
        const tokenIds = listing.tokenIds || [];
        for (const tokenId of tokenIds) {
          const credit = await contract.carbonCredits(tokenId);
          statusMap[tokenId] = credit;
        }
      } catch (error) {
        console.warn("Unable to fetch status for listing", listing.id);
      }
    }
    setOnchainStatus(statusMap);
  }, [contract, listings]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!contract) return undefined;
    const interval = setInterval(() => { fetchStatus(); }, 10000);
    return () => clearInterval(interval);
  }, [contract, fetchStatus]);

  const handleBuy = async (listing) => {
    if (!user || user.role !== "company") return alert("Only companies can buy credits.");
    const quantityToBuy = parseInt(buyQuantity[listing.id]) || 1;
    if (Number.isNaN(quantityToBuy) || quantityToBuy <= 0) return alert("Please enter a valid quantity (> 0).");
    const availableTokenIds = listing.tokenIds || [];
    if (quantityToBuy > availableTokenIds.length) return alert(`Only ${availableTokenIds.length} available.`);

    if (contract) {
      try {
        const tokensToBuy = availableTokenIds.slice(0, quantityToBuy);
        const firstCredit = await contract.carbonCredits(tokensToBuy[0]);
        const firstPrice = firstCredit?.price || firstCredit?.[1];
        const pricePerUnit = ethers.utils.formatEther(firstPrice);

        for (const tokenId of tokensToBuy) {
          const credit = await contract.carbonCredits(tokenId);
          if (account && credit.owner.toLowerCase() === account.toLowerCase()) {
            return alert("You cannot buy your own credit.");
          }
          const tx = await contract.buyCredit(tokenId, { value: credit.price });
          await tx.wait();
        }

        alert(`Purchase successful! Bought ${quantityToBuy} unit(s).`);

        const sellersRes = await fetch("/api/users");
        const allUsers = await sellersRes.json();
        const seller = allUsers.find((u) => u.id === listing.sellerId);
        const boughtTokenIds = availableTokenIds.slice(0, quantityToBuy);

        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id, listingName: listing.name, quantity: quantityToBuy,
            pricePerUnit: pricePerUnit, buyerId: user.id, sellerId: listing.sellerId,
            buyerEmail: user.email, sellerEmail: seller ? seller.email : "Unknown",
            tokenIds: boughtTokenIds,
          }),
        });

        const remainingTokenIds = availableTokenIds.slice(quantityToBuy);
        await fetch("/api/listings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: listing.id, tokenIds: remainingTokenIds, quantity: remainingTokenIds.length.toString(), isForSale: remainingTokenIds.length > 0 }),
        });

        setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, tokenIds: remainingTokenIds, quantity: remainingTokenIds.length.toString() } : l));
        setBuyQuantity((prev) => { const st = { ...prev }; delete st[listing.id]; return st; });
        if (remainingTokenIds.length === 0) {
          setOnchainStatus((prev) => { const st = { ...prev }; delete st[listing.id]; return st; });
        }
      } catch (error) {
        alert("Error buying credit. Check funds or console.");
      }
    } else { alert("Connect wallet."); }
  };

  const handleRelist = async (listing) => {
    const tokenIds = listing.tokenIds || [];
    const inputPrice = relistPrice[listing.id] ?? listing.price;
    const quantity = relistQuantity[listing.id] ?? parseInt(listing.quantity);
    
    if (!contract || tokenIds.length === 0 || parseFloat(inputPrice) <= 0) return alert("Invalid inputs or wallet.");
    try {
      for (const tokenId of tokenIds) {
        const tx = await contract.updateCredit(tokenId, ethers.utils.parseEther(inputPrice.toString()), true);
        await tx.wait();
      }
      await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listing.id, price: inputPrice.toString(), quantity: quantity.toString(), isForSale: true }),
      });
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, price: inputPrice.toString(), quantity: quantity.toString() } : l));
      alert("Relisted.");
    } catch (error) { alert("Error relisting."); }
  };

  const handleRelistWithNewTokens = async (listing) => {
    const inputPrice = parseFloat(relistPrice[listing.id] ?? listing.price);
    const qty = parseInt(relistQuantity[listing.id]) || 1;
    if (!contract || inputPrice <= 0 || qty <= 0) return alert("Invalid inputs.");
    try {
      const newTokenIds = [];
      for (let i = 0; i < qty; i++) {
        const tx = await contract.createCredit(ethers.utils.parseEther(inputPrice.toString()));
        const receipt = await tx.wait();
        newTokenIds.push(receipt.events[0].args.tokenId.toNumber());
      }
      await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listing.id, price: inputPrice.toString(), quantity: qty.toString(), tokenIds: newTokenIds, isForSale: true }),
      });
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, tokenIds: newTokenIds, quantity: qty.toString(), price: inputPrice.toString(), isForSale: true } : l));
      alert(`Minted ${qty} new tokens at ${inputPrice} ETH.`);
      fetchStatus();
    } catch (error) { alert("Error minting."); }
  };

  const availableListings = listings.filter((listing) => {
    if (!listing.tokenIds || listing.tokenIds.length === 0) return false;
    if (account && listing.isForSale) {
      const credit = onchainStatus[listing.tokenIds[0]];
      const owner = credit?.owner || credit?.[0];
      if (owner && owner.toLowerCase() === account.toLowerCase()) return false;
    }
    return true;
  });

  const mySoldListings = user?.role === "ngo" ? listings.filter(l => l.sellerId === user.id && (!l.tokenIds || l.tokenIds.length === 0)) : [];

  return (
    <div className="min-h-screen bg-background text-foreground font-outfit antialiased">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div className="mb-10" {...fadeUp} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Carbon Credit Marketplace</h1>
            <p className="text-muted-foreground">Browse verified carbon credits from trusted NGOs worldwide.</p>
          </motion.div>

          {/* Available Credits */}
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" /> Available Credits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {availableListings.map((listing, i) => {
              const tokenIds = listing.tokenIds || [];
              const credit = tokenIds.length > 0 ? onchainStatus[tokenIds[0]] : null;
              const price = credit?.price || credit?.[1];
              const isForSale = credit?.isForSale !== undefined ? credit.isForSale : credit?.[2];
              const priceLabel = credit ? `${ethers.utils.formatEther(price)} ETH` : `${listing.price} (off-chain)`;

              return (
                <motion.div key={listing.id} className="glass-card rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{listing.name}</h3>
                      <p className="text-sm text-muted-foreground">Seller: {listing.sellerId}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">Verified</Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-muted-foreground">{listing.quantity} available</span>
                    <span className="font-semibold">{priceLabel}</span>
                  </div>
                  
                  {credit && isForSale ? (
                    <div className="flex gap-2 mt-4">
                      <Input
                        type="number"
                        min="1"
                        max={tokenIds.length}
                        placeholder="Qty"
                        value={buyQuantity[listing.id] ?? ""}
                        onChange={(e) => setBuyQuantity((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                        className="w-20"
                      />
                      <Button onClick={() => handleBuy(listing)} className="flex-1 gap-2" disabled={!buyQuantity[listing.id] || parseInt(buyQuantity[listing.id]) <= 0}>
                        <ShoppingCart className="h-4 w-4" /> Buy
                      </Button>
                    </div>
                  ) : (
                    <Button disabled variant="secondary" className="w-full mt-4">Sold</Button>
                  )}
                </motion.div>
              );
            })}
            {availableListings.length === 0 && <p className="text-muted-foreground col-span-full">No credits available right now.</p>}
          </div>

          {/* Sold Out Listings (For NGOs to relist) */}
          {user?.role === "ngo" && (
            <>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 mt-16">
                <Tag className="h-5 w-5 text-muted-foreground" /> My Listings (Sold Out)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySoldListings.map((listing, i) => (
                  <motion.div key={listing.id} className="rounded-2xl border border-border bg-muted/50 p-6 opacity-80" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg">{listing.name}</h3>
                      <Badge variant="secondary">Sold Out</Badge>
                    </div>
                    <div className="flex justify-between text-sm mb-6">
                      <span className="text-muted-foreground">Original Qty: {listing.quantity}</span>
                      <span className="font-semibold text-muted-foreground">{listing.price} ETH</span>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <RotateCw className="h-3 w-3" /> Relist Item
                      </p>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="New price (ETH)"
                        value={relistPrice[listing.id] ?? listing.price}
                        onChange={(e) => setRelistPrice((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        value={relistQuantity[listing.id] ?? "1"}
                        onChange={(e) => setRelistQuantity((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                      />
                      <Button onClick={() => handleRelistWithNewTokens(listing)} className="w-full">
                        Mint & Relist
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {mySoldListings.length === 0 && <p className="text-muted-foreground text-sm col-span-full">All your minted items are still available!</p>}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
