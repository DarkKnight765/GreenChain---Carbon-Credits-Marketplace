const path = require("path");
const fs = require("fs");
const solc = require("solc");

const contractPath = path.resolve(__dirname, "contracts", "GreenChain.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "GreenChain.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};

let compiledContract;
try {
  const findImports = (importPath) => {
    try {
      // Resolve relative to contracts folder first
      const baseContracts = path.resolve(__dirname, "contracts");
      const relPath = path.resolve(baseContracts, importPath);
      if (fs.existsSync(relPath)) {
        return { contents: fs.readFileSync(relPath, "utf8") };
      }

      // Fallback: resolve relative to project root
      const rootPath = path.resolve(__dirname, importPath);
      if (fs.existsSync(rootPath)) {
        return { contents: fs.readFileSync(rootPath, "utf8") };
      }

      return { error: "File not found: " + importPath };
    } catch (err) {
      return { error: err.message };
    }
  };

  compiledContract = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports })
  );
} catch (error) {
  console.error("Error compiling contract:", error);
  process.exit(1);
}

if (compiledContract.errors) {
  let isError = false;
  for (const error of compiledContract.errors) {
    if (error.severity === "error") {
      console.error(error.formattedMessage);
      isError = true;
    } else {
      console.warn(error.formattedMessage);
    }
  }
  if (isError) {
    process.exit(1);
  }
}

const contract = compiledContract.contracts["GreenChain.sol"]["GreenChain"];
const bytecode = contract.evm.bytecode.object;
const abi = contract.abi;

const bytecodePath = path.resolve(__dirname, "contracts", "bytecode.txt");
const abiPath = path.resolve(__dirname, "contracts", "abi.json");

fs.writeFileSync(bytecodePath, bytecode);
fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

console.log("Contract compiled successfully!");
console.log("Bytecode saved to", bytecodePath);
console.log("ABI saved to", abiPath);
