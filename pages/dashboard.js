import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import abi from "../contracts/abi.json";
import WalletConnect from "../components/WalletConnect";

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

      // Filter transactions for current user
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

      // Get transactions to find tokens user bought
      const txRes = await fetch("/api/transactions");
      const allTransactions = await txRes.json();
      const userPurchases = allTransactions.filter(
        (tx) => tx.buyerId === user.id
      );

      // Create map of tokenId -> transaction for getting listing names
      const tokenToTx = {};
      for (const tx of userPurchases) {
        if (tx.tokenIds && tx.tokenIds.length > 0) {
          tx.tokenIds.forEach((id) => {
            tokenToTx[id] = tx;
          });
        }
      }

      // Check each token on blockchain
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

  if (!user) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>📊 Dashboard</h1>
      <WalletConnect />
      <p>
        <strong>Role:</strong> {user.role.toUpperCase()} |{" "}
        <strong>Email:</strong> {user.email}
      </p>

      {/* Owned Credits Section */}
      {user.role === "company" && (
        <div style={{ marginBottom: "3rem" }}>
          <h2>🏆 My Owned Credits</h2>
          {ownedCredits.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              You don't own any carbon credits yet.
            </p>
          ) : (
            <div className="card-container">
              {ownedCredits.map((credit, index) => (
                <div key={index} className="card">
                  <h3>{credit.listingName}</h3>
                  <p>
                    <strong>Token ID:</strong> #{credit.tokenId}
                  </p>
                  <p>
                    <strong>Price:</strong> {credit.price} ETH
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {credit.isForSale ? "Listed for Sale" : "In Portfolio"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Listings Section - For NGOs */}
      {user.role === "ngo" && (
        <div style={{ marginBottom: "3rem" }}>
          <h2>📦 My Active Listings</h2>
          {listings.filter(
            (l) => l.sellerId === user.id && l.tokenIds && l.tokenIds.length > 0
          ).length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              You have no active listings. Create one to start selling!
            </p>
          ) : (
            <div className="card-container">
              {listings
                .filter(
                  (l) =>
                    l.sellerId === user.id &&
                    l.tokenIds &&
                    l.tokenIds.length > 0
                )
                .map((listing) => {
                  const tokenIds = listing.tokenIds || [];
                  const firstTokenId = tokenIds.length > 0 ? tokenIds[0] : null;
                  const credit =
                    firstTokenId &&
                    ownedCredits.find((c) => c.tokenId === firstTokenId);

                  return (
                    <div key={listing.id} className="card">
                      <h3>{listing.name}</h3>
                      <p>
                        <strong>Price:</strong> {listing.price} ETH
                      </p>
                      <p>
                        <strong>Available Quantity:</strong> {tokenIds.length}
                      </p>
                      <p>
                        <strong>Token IDs:</strong> {tokenIds.join(", ")}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span style={{ color: "#10b981" }}>✓ Active</span>
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2>
          {user.role === "ngo" ? "📈 Sales History" : "🛒 Purchase History"}
        </h2>
        {transactions.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No transactions yet.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
              background: "white",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                }}
              >
                <th style={{ padding: "1rem", textAlign: "left" }}>Date</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Listing</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Quantity</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Price (ETH)
                </th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  {user.role === "ngo" ? "Buyer" : "Seller"}
                </th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Total (ETH)
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #eee",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                >
                  <td style={{ padding: "1rem" }}>
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "1rem" }}>{tx.listingName}</td>
                  <td style={{ padding: "1rem" }}>{tx.quantity}</td>
                  <td style={{ padding: "1rem" }}>{tx.pricePerUnit}</td>
                  <td style={{ padding: "1rem" }}>
                    {user.role === "ngo" ? tx.buyerEmail : tx.sellerEmail}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>
                    {(
                      parseFloat(tx.pricePerUnit) * parseInt(tx.quantity)
                    ).toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
