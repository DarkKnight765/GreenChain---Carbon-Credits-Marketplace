import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../contracts/abi.json";
import { useWeb3React } from "@web3-react/core";

export default function Deploy() {
  const [contractAddress, setContractAddress] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const { provider, isActive } = useWeb3React();

  const handleDeploy = async () => {
    if (isActive && provider) {
      setIsDeploying(true);
      try {
        const res = await fetch("/api/bytecode");
        if (!res.ok) {
          throw new Error("Failed to fetch bytecode");
        }
        const { bytecode } = await res.json();

        if (!bytecode) {
          throw new Error("Bytecode is empty or undefined");
        }

        console.log("Bytecode from API:", bytecode);

        const signer = provider.getSigner();
        const factory = new ethers.ContractFactory(abi, bytecode, signer);

        const contract = await factory.deploy();
        await contract.deployed();
        const address = contract.address;
        setContractAddress(address);
        localStorage.setItem("contractAddress", address);
        alert("Contract deployed successfully to:" + address);
      } catch (error) {
        console.error("Error deploying contract:", error);
        alert("Error deploying contract. Check console for details.");
      } finally {
        setIsDeploying(false);
      }
    } else {
      alert("Please connect your wallet to deploy the contract.");
    }
  };

  useEffect(() => {
    const savedAddress = localStorage.getItem("contractAddress");
    if (savedAddress) {
      setContractAddress(savedAddress);
    }
  }, []);

  return (
    <div className="container">
      <h1>Deploy Contract</h1>
      <div className="form-container">
        <p>
          This page will deploy the main GreenChain smart contract to the
          blockchain. Ensure your wallet is connected to the correct network.
        </p>
        <button
          onClick={handleDeploy}
          className="submit-button"
          disabled={isDeploying}
        >
          {isDeploying ? "Deploying..." : "Deploy Contract"}
        </button>
        {contractAddress && (
          <div>
            <h3>Contract Deployed!</h3>
            <p>Address: {contractAddress}</p>
            <p>
              This address has been saved in your browser's local storage for
              other pages to use.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
