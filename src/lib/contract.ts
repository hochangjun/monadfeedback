import { ethers } from 'ethers';

// Contract ABI - only the functions we need
const FEEDBACK_PAYMENT_ABI = [
  "function pay() external payable",
  "function hasPaid(address) external view returns (bool)",
  "error IncorrectAmount()",
  "error NotOwner()"
];

// Load contract address from deployment.json
let contractAddress: string | null = null;

try {
  // In production, you'd fetch this from your backend or environment
  // For now, we'll try to load from deployment.json if it exists
  const deploymentData = require('../../deployment.json');
  contractAddress = deploymentData.contractAddress;
} catch (error) {
  console.warn('deployment.json not found, using simulated payment');
}

export const FEEDBACK_COST_WEI = ethers.utils.parseEther('0.1'); // 0.1 MON in wei

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export async function makePayment(provider: any): Promise<PaymentResult> {
  if (!contractAddress) {
    throw new Error('Contract not deployed yet. Please deploy the contract first.');
  }

  try {
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, FEEDBACK_PAYMENT_ABI, signer);
    
    // Call the pay function with 0.1 MON
    const tx = await contract.pay({ 
      value: FEEDBACK_COST_WEI,
      gasLimit: 100000 // Set reasonable gas limit
    });
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt.hash);
    
    return {
      success: true,
      transactionHash: receipt.hash,
    };
    
  } catch (error: any) {
    console.error('Payment error:', error);
    
    let errorMessage = 'Transaction failed';
    
    // Parse specific contract errors
    if (error.reason) {
      if (error.reason.includes('IncorrectAmount')) {
        errorMessage = 'Insufficient payment amount. 0.1 MON required.';
      } else {
        errorMessage = error.reason;
      }
    } else if (error.message) {
      if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient MON balance';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function checkPaymentStatus(provider: any, userAddress: string): Promise<boolean> {
  if (!contractAddress) {
    return false; // No contract deployed, so no real payment possible
  }
  
  try {
    const contract = new ethers.Contract(contractAddress, FEEDBACK_PAYMENT_ABI, provider);
    return await contract.hasPaid(userAddress);
  } catch (error) {
    console.error('Error checking payment status:', error);
    return false;
  }
}

export function getContractAddress(): string | null {
  return contractAddress;
} 