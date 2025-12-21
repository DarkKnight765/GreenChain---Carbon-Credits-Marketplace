import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import abi from "../../contracts/abi.json";
import WalletConnect from "../../components/WalletConnect";
import { useWeb3React } from "@web3-react/core";

export default function NewListing() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [user, setUser] = useState(null);
  const [contract, setContract] = useState(null);
  const router = useRouter();
  const { provider, isActive } = useWeb3React();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role === "ngo") {
        setUser(parsedUser);
      } else {
        router.push("/");
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !contract) return;

    const priceValue = parseFloat(price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      alert("Enter a valid price in ETH (> 0).");
      return;
    }

    const qty = parseInt(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      alert("Enter a valid quantity (> 0).");
      return;
    }

    try {
      const tokenIds = [];
      console.log("Contract address:", localStorage.getItem("contractAddress"));
      console.log(
        "Starting to mint",
        qty,
        "tokens at price",
        priceValue,
        "ETH"
      );

      // Mint one token per unit of quantity
      for (let i = 0; i < qty; i++) {
        console.log(`Minting token ${i + 1}/${qty}...`);
        const tx = await contract.createCredit(
          ethers.utils.parseEther(priceValue.toString())
        );
        console.log(`Token ${i + 1} tx hash:`, tx.hash);
        const receipt = await tx.wait();
        const tokenId = receipt.events[0].args.tokenId.toNumber();
        console.log(`Token ${i + 1} minted with ID:`, tokenId);
        tokenIds.push(tokenId);
      }

      console.log("All tokens minted:", tokenIds);

      // Create listing with all token IDs
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price,
          quantity: qty.toString(),
          tokenIds: tokenIds,
          sellerId: user.id,
        }),
      });

      if (res.ok) {
        router.push("/market");
      } else {
        const errorData = await res.json();
        alert(`Failed to create listing on backend: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Error creating listing. Check console for details.");
    }
  };

  return (
    <div className="container">
      <h1>Create New Listing</h1>
      <WalletConnect />
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Credit Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Price (in Ether)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button type="submit" className="submit-button">
            Create Listing
          </button>
        </form>
      </div>
    </div>
  );
}
