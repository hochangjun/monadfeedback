const hre = require("hardhat");

async function main() {
  console.log("Deploying FeedbackPayment contract to Monad Testnet...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MON");
  
  const FeedbackPayment = await hre.ethers.getContractFactory("FeedbackPayment");
  const feedbackPayment = await FeedbackPayment.deploy();
  
  await feedbackPayment.waitForDeployment();
  
  const contractAddress = await feedbackPayment.getAddress();
  console.log("FeedbackPayment deployed to:", contractAddress);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "monadTestnet",
    chainId: 10143,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
  };
  
  const fs = require('fs');
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 