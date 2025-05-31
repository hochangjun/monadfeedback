import { ethers } from 'ethers';

// Contract ABI - only the functions we need
const FEEDBACK_PAYMENT_ABI = [
  "function pay() external payable",
  "function hasPaid(address) external view returns (bool)",
  "error IncorrectAmount()",
  "error NotOwner()"
];

// Load contract address from deployment.json or environment
let contractAddress: string | null = null;

// Option 1: Try environment variable first
if (typeof window === 'undefined') {
  // Server-side: check environment variable
  contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null;
}

// Option 2: Try deployment.json if no env var
if (!contractAddress) {
  try {
    const deploymentData = require('../../deployment.json');
    contractAddress = deploymentData.contractAddress;
  } catch (error) {
    console.warn('deployment.json not found, using environment variable or simulated payment');
  }
}

// Option 3: Client-side env var fallback
if (!contractAddress && typeof window !== 'undefined') {
  contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null;
}

export const FEEDBACK_COST_WEI = ethers.utils.parseEther('5'); // 5 MON in wei

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
    // Create ethers provider from the raw provider
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    
    const contract = new ethers.Contract(contractAddress, FEEDBACK_PAYMENT_ABI, signer);
    
    // Call the pay function with 5 MON
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
        errorMessage = 'Insufficient payment amount. 5 MON required.';
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
    // Create ethers provider from the raw provider
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const contract = new ethers.Contract(contractAddress, FEEDBACK_PAYMENT_ABI, ethersProvider);
    return await contract.hasPaid(userAddress);
  } catch (error) {
    console.error('Error checking payment status:', error);
    return false;
  }
}

export function getContractAddress(): string | null {
  return contractAddress;
} 