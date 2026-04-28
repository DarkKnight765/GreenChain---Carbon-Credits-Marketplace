import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import abi from "../contracts/abi.json";
import { useWeb3React } from "@web3-react/core";

export default function Market() {
  const [listings, setListings] = useState([]);
  const [user, setUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [onchainStatus, setOnchainStatus] = useState({});
  const [relistPrice, setRelistPrice] = useState({});
  const [relistQuantity, setRelistQuantity] = useState({});
  const [buyQuantity, setBuyQuantity] = useState({});
  const { provider, isActive, account } = useWeb3React(); // Use v8 hook

  useEffect(() => {
    // This effect runs only on the client-side
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
    // This effect runs when the wallet is connected
    if (isActive && provider) {
      const contractAddress = localStorage.getItem("contractAddress");
      if (contractAddress) {
        const signer = provider.getSigner();
        const loadedContract = new ethers.Contract(
          contractAddress,
          abi,
          signer,
        );
        setContract(loadedContract);
      }
    }
  }, [isActive, provider]);

  const fetchStatus = useCallback(async () => {
    if (!contract || listings.length === 0) return;
    const statusMap = {};
    console.log("Fetching status for", listings.length, "listings");
    console.log(
      "Using contract address:",
      localStorage.getItem("contractAddress"),
    );
    for (const listing of listings) {
      try {
        // Check all token IDs in this listing
        const tokenIds = listing.tokenIds || [];
        for (const tokenId of tokenIds) {
          const credit = await contract.carbonCredits(tokenId);
          const isForSale =
            credit?.isForSale !== undefined ? credit.isForSale : credit?.[2];
          console.log(`Token ${tokenId}:`, {
            credit,
            isForSale,
            owner: credit?.owner || credit?.[0],
          });
          statusMap[tokenId] = credit;
        }
      } catch (error) {
        console.warn(
          "Unable to fetch on-chain credit for listing",
          listing.id,
          error,
        );
      }
    }
    setOnchainStatus(statusMap);
  }, [contract, listings]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!contract) return undefined;
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [contract, fetchStatus]);

  const handleBuy = async (listing) => {
    if (!user || user.role !== "company") {
      alert("Only companies can buy credits.");
      return;
    }

    // Get quantity to buy
    const quantityToBuy = parseInt(buyQuantity[listing.id]) || 1;
    if (Number.isNaN(quantityToBuy) || quantityToBuy <= 0) {
      alert("Please enter a valid quantity (> 0).");
      return;
    }

    const availableTokenIds = listing.tokenIds || [];
    if (quantityToBuy > availableTokenIds.length) {
      alert(
        `Only ${availableTokenIds.length} available. Cannot buy ${quantityToBuy}.`,
      );
      return;
    }

    if (contract) {
      try {
        // Buy the specified quantity of tokens
        const tokensToBuy = availableTokenIds.slice(0, quantityToBuy);
        console.log("Starting purchase for tokens:", tokensToBuy);
        const txHashes = [];

        // Get price before buying (will change after transfer)
        const firstCredit = await contract.carbonCredits(tokensToBuy[0]);
        const firstPrice = firstCredit?.price || firstCredit?.[1];
        const pricePerUnit = ethers.utils.formatEther(firstPrice);
        console.log("Price per unit:", pricePerUnit, "ETH");

        for (const tokenId of tokensToBuy) {
          const credit = await contract.carbonCredits(tokenId);
          const owner = credit?.owner || credit?.[0];
          const isForSale =
            credit?.isForSale !== undefined ? credit.isForSale : credit?.[2];

          if (!credit || owner === ethers.constants.AddressZero) {
            alert(`Token #${tokenId} has no on-chain data.`);
            return;
          }

          if (!isForSale) {
            alert(`Token #${tokenId} is not for sale on-chain.`);
            return;
          }

          if (account && owner.toLowerCase() === account.toLowerCase()) {
            alert(
              "You cannot buy your own credit. Please switch to a different MetaMask account (Account 2 or another wallet) to test buying.",
            );
            return;
          }

          // Buy this token
          const tx = await contract.buyCredit(tokenId, {
            value: credit.price,
          });
          await tx.wait();
          txHashes.push(tx.hash);
        }

        alert(`Purchase successful! Bought ${quantityToBuy} unit(s).`);

        // Get seller info
        const sellersRes = await fetch("/api/users");
        const allUsers = await sellersRes.json();
        const seller = allUsers.find((u) => u.id === listing.sellerId);

        // Log transaction with bought token IDs
        const boughtTokenIds = availableTokenIds.slice(0, quantityToBuy);
        const txRes = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id,
            listingName: listing.name,
            quantity: quantityToBuy,
            pricePerUnit: pricePerUnit,
            buyerId: user.id,
            sellerId: listing.sellerId,
            buyerEmail: user.email,
            sellerEmail: seller ? seller.email : "Unknown",
            tokenIds: boughtTokenIds,
          }),
        });
        if (!txRes.ok)
          console.error("Transaction log failed:", await txRes.json());

        // Update DB: remove the bought tokens from tokenIds array
        const remainingTokenIds = availableTokenIds.slice(quantityToBuy);
        const newQuantity = remainingTokenIds.length;

        const dbRes = await fetch("/api/listings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: listing.id,
            tokenIds: remainingTokenIds,
            quantity: newQuantity.toString(),
            isForSale: newQuantity > 0,
          }),
        });
        if (!dbRes.ok) {
          console.error("DB update failed:", await dbRes.json());
          alert(
            "Warning: Purchase recorded but database update failed. Refresh page.",
          );
        }

        // Update local state
        setListings((prev) =>
          prev.map((l) =>
            l.id === listing.id
              ? {
                  ...l,
                  tokenIds: remainingTokenIds,
                  quantity: newQuantity.toString(),
                }
              : l,
          ),
        );

        // Clear buy quantity input
        setBuyQuantity((prev) => {
          const newState = { ...prev };
          delete newState[listing.id];
          return newState;
        });

        // Hide from sale if no tokens left
        if (newQuantity === 0) {
          setOnchainStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[listing.id];
            return newStatus;
          });
        }
      } catch (error) {
        console.error("Full error buying credit:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        if (error.data) console.error("Error data:", error.data);

        if (
          error.code === "INSUFFICIENT_FUNDS" ||
          error.message?.includes("insufficient funds")
        ) {
          alert(
            `Insufficient funds in your wallet.\n\n` +
              `Your account: ${account}\n` +
              `You need ETH to pay for gas + the credit price.\n\n` +
              `Get free Sepolia ETH from: https://sepoliafaucet.com/`,
          );
        } else {
          alert("Error buying credit. Check console for details.");
        }
      }
    } else {
      alert(
        "Please connect your wallet and make sure the contract is deployed.",
      );
    }
  };

  const handleRelist = async (listing) => {
    if (!contract) {
      alert("Please connect your wallet.");
      return;
    }

    const tokenIds = listing.tokenIds || [];
    if (tokenIds.length === 0) {
      alert("No tokens available to relist.");
      return;
    }

    const inputPrice = relistPrice[listing.id] ?? listing.price;
    const priceValue = parseFloat(inputPrice);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      alert("Enter a valid price in ETH (> 0).");
      return;
    }

    // Get quantity from state or use current
    const quantity = relistQuantity[listing.id] ?? parseInt(listing.quantity);

    try {
      // Update all remaining tokens with new price
      for (const tokenId of tokenIds) {
        const tx = await contract.updateCredit(
          tokenId,
          ethers.utils.parseEther(priceValue.toString()),
          true,
        );
        await tx.wait();
      }

      await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: listing.id,
          price: priceValue.toString(),
          quantity: quantity.toString(),
          isForSale: true,
        }),
      });

      // Clear temp quantity state
      setRelistQuantity((prev) => {
        const newState = { ...prev };
        delete newState[listing.id];
        return newState;
      });

      // Update local state
      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id
            ? {
                ...l,
                price: priceValue.toString(),
                quantity: quantity.toString(),
              }
            : l,
        ),
      );

      setOnchainStatus((prev) => ({
        ...prev,
        [listing.id]: {
          ...credit,
          price: ethers.utils.parseEther(priceValue.toString()),
          isForSale: true,
        },
      }));
      alert("Listing relisted on-chain.");
    } catch (error) {
      console.error("Error relisting credit:", error);
      alert("Error relisting credit. Check console for details.");
    }
  };

  const handleRelistWithNewTokens = async (listing) => {
    if (!contract) {
      alert("Please connect your wallet.");
      return;
    }

    const inputPrice = relistPrice[listing.id] ?? listing.price;
    const priceValue = parseFloat(inputPrice);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      alert("Enter a valid price in ETH (> 0).");
      return;
    }

    const qty = parseInt(relistQuantity[listing.id]) || 1;
    if (Number.isNaN(qty) || qty <= 0) {
      alert("Enter a valid quantity (> 0).");
      return;
    }

    try {
      const newTokenIds = [];

      // Mint new tokens for relisting
      for (let i = 0; i < qty; i++) {
        const tx = await contract.createCredit(
          ethers.utils.parseEther(priceValue.toString()),
        );
        const receipt = await tx.wait();
        const tokenId = receipt.events[0].args.tokenId.toNumber();
        newTokenIds.push(tokenId);
      }

      // Update listing with new tokens
      await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: listing.id,
          price: priceValue.toString(),
          quantity: qty.toString(),
          tokenIds: newTokenIds,
          isForSale: true,
        }),
      });

      // Clear input states
      setRelistPrice((prev) => {
        const newState = { ...prev };
        delete newState[listing.id];
        return newState;
      });
      setRelistQuantity((prev) => {
        const newState = { ...prev };
        delete newState[listing.id];
        return newState;
      });

      // Update local listings state
      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id
            ? {
                ...l,
                tokenIds: newTokenIds,
                quantity: qty.toString(),
                price: priceValue.toString(),
                isForSale: true,
              }
            : l,
        ),
      );

      alert(
        `Relisted successfully! Minted ${qty} new token(s) at ${priceValue} ETH each.`,
      );

      // Refresh on-chain status
      fetchStatus();
    } catch (error) {
      console.error("Error relisting with new tokens:", error);
      alert("Error minting new tokens. Check console for details.");
    }
  };

  return (
    <div className="container">
      <h1>🌱 Carbon Credit Marketplace</h1>

      {/* AVAILABLE FOR SALE */}
      <h2>Available Credits</h2>
      <div className="card-container">
        {(() => {
          const filtered = listings.filter((listing) => {
            if (!listing.tokenIds || listing.tokenIds.length === 0) {
              console.log("Filtered out listing (no tokenIds):", listing.id);
              return false;
            }

            // Check if user owns ANY unsold token in this listing
            if (account && listing.isForSale) {
              const firstTokenId = listing.tokenIds[0];
              const credit = onchainStatus[firstTokenId];
              // credit comes back as array: [owner, price, isForSale, ...]
              const owner = credit?.owner || credit?.[0];
              console.log(
                `Checking listing ${listing.id}, token ${firstTokenId}:`,
                {
                  account,
                  credit,
                  owner,
                  ownerMatches: owner?.toLowerCase() === account.toLowerCase(),
                },
              );
              if (owner && owner.toLowerCase() === account.toLowerCase()) {
                console.log(
                  "Filtered out listing (user is owner):",
                  listing.id,
                );
                return false; // Don't show if user is the seller
              }
            }
            console.log("Showing listing:", listing.id);
            return true;
          });
          console.log(
            "Total listings:",
            listings.length,
            "Filtered:",
            filtered.length,
          );
          return filtered;
        })().map((listing) => {
          // Get first available token ID from this listing
          const tokenIds = listing.tokenIds || [];
          const firstTokenId = tokenIds.length > 0 ? tokenIds[0] : null;
          const credit = firstTokenId ? onchainStatus[firstTokenId] : null;
          // Handle both array and object formats
          const owner = credit?.owner || credit?.[0];
          const price = credit?.price || credit?.[1];
          const isForSale =
            credit?.isForSale !== undefined ? credit.isForSale : credit?.[2];

          const priceLabel = credit
            ? `${ethers.utils.formatEther(price)} ETH`
            : `${listing.price} (off-chain)`;
          const isOwner =
            credit &&
            account &&
            owner &&
            owner.toLowerCase() === account.toLowerCase();

          let statusLabel = "Not minted";
          if (credit) {
            statusLabel = isForSale ? "For sale" : "Not for sale";
            if (isOwner && !isForSale) {
              statusLabel = "Owned by you (not for sale)";
            }
          }

          return (
            <div key={listing.id} className="card">
              <h2>{listing.name}</h2>
              <p>Price: {priceLabel}</p>
              <p>Status: {statusLabel}</p>
              <p>Quantity: {listing.quantity}</p>
              <p>Seller ID: {listing.sellerId}</p>

              {credit && isForSale ? (
                <div className="inline-buy">
                  <input
                    type="number"
                    min="1"
                    max={tokenIds.length}
                    placeholder="Qty"
                    value={buyQuantity[listing.id] ?? ""}
                    onChange={(e) =>
                      setBuyQuantity((prev) => ({
                        ...prev,
                        [listing.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="buy-button"
                    onClick={() => handleBuy(listing)}
                    disabled={
                      !credit ||
                      (account &&
                        credit.owner &&
                        credit.owner.toLowerCase() === account.toLowerCase()) ||
                      !buyQuantity[listing.id] ||
                      parseInt(buyQuantity[listing.id]) <= 0
                    }
                  >
                    Buy
                  </button>
                </div>
              ) : (
                <button
                  className="buy-button"
                  disabled
                  style={{ opacity: 0.5 }}
                >
                  Sold
                </button>
              )}

              {isOwner && credit && user && user.role === "ngo" && (
                <div className="relist-form">
                  <p className="relist-label">
                    {isForSale ? "✏️ Edit Listing" : "🔄 Relist Item"}
                  </p>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="New price (ETH)"
                    value={
                      relistPrice[listing.id] ??
                      (credit ? ethers.utils.formatEther(price) : "")
                    }
                    onChange={(e) =>
                      setRelistPrice((prev) => ({
                        ...prev,
                        [listing.id]: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={relistQuantity[listing.id] ?? listing.quantity}
                    onChange={(e) =>
                      setRelistQuantity((prev) => ({
                        ...prev,
                        [listing.id]: e.target.value,
                      }))
                    }
                  />
                  <button onClick={() => handleRelist(listing)}>
                    {isForSale ? "Update Listing" : "Relist"}
                  </button>
                </div>
              )}
              {isOwner &&
                credit &&
                !isForSale &&
                user &&
                user.role !== "ngo" && (
                  <p className="owner-note">
                    ⛔ Only NGO sellers can relist credits
                  </p>
                )}
            </div>
          );
        })}
      </div>

      {/* MY LISTINGS (for NGO owners to see sold items and relist) */}
      {user && user.role === "ngo" && (
        <div className="section-block">
          <h2>My Listings (Sold Out)</h2>
          <div className="card-container">
            {listings
              .filter(
                (listing) =>
                  listing.sellerId === user.id &&
                  (!listing.tokenIds || listing.tokenIds.length === 0),
              )
              .map((listing) => {
                return (
                  <div key={listing.id} className="card">
                    <h2>{listing.name}</h2>
                    <p>Price: {listing.price} ETH</p>
                    <p>Status: Sold Out</p>
                    <p>Seller ID: {listing.sellerId}</p>

                    <div className="relist-form">
                      <p className="relist-label">🔄 Relist Item</p>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="New price (ETH)"
                        value={relistPrice[listing.id] ?? listing.price}
                        onChange={(e) =>
                          setRelistPrice((prev) => ({
                            ...prev,
                            [listing.id]: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        value={relistQuantity[listing.id] ?? "1"}
                        onChange={(e) =>
                          setRelistQuantity((prev) => ({
                            ...prev,
                            [listing.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() => handleRelistWithNewTokens(listing)}
                        className="submit-button"
                      >
                        Relist with New Tokens
                      </button>
                    </div>
                  </div>
                );
              })}
            {listings.filter(
              (listing) =>
                listing.sellerId === user.id &&
                (!listing.tokenIds || listing.tokenIds.length === 0),
            ).length === 0 && (
              <p className="muted-text">
                No sold-out listings. All your items are still available!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
