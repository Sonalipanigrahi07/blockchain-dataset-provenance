
const fs = require("fs");
const path = require("path");
const { ethers, artifacts } = require("hardhat");

async function main() {
  console.log("Deploying DatasetRegistry...");

  const Registry = await ethers.getContractFactory("DatasetRegistry");
  const registry = await Registry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const network = await ethers.provider.getNetwork();

  const artifact = await artifacts.readArtifact("DatasetRegistry");

  const deployment = {
    contractName: "DatasetRegistry",
    address,
    network: network.name,
    chainId: network.chainId.toString(),
    abi: artifact.abi
  };

  const outputPath = path.join(
    __dirname,
    "..",
    "contracts",
    "DatasetRegistry.deployment.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(deployment, null, 2) + "\n",
    "utf8"
  );

  console.log("Deployment successful.");
  console.log("Contract address:", address);
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployment details saved to:", outputPath);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
