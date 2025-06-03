import { ethers } from 'ethers';

// Contract ABI - only the functions we need
const FEEDBACK_PAYMENT_ABI = [
  "function pay() external payable",
  "function hasPaid(address) external view returns (bool)",
  "error IncorrectAmount()",
  "error NotOwner()"
];

// Load contract address from environment or hardcoded fallback
const contractAddress: string | null = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CONTRACT_ADDRESS) || 
  '0x8f70dab45234aefc388a2d2df2144e2ae6bbb8d8'; // Deployed contract address

export const FEEDBACK_COST_WEI = ethers.utils.parseEther('1.1'); // 1.1 MON in wei

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export async function makePayment(provider: unknown): Promise<PaymentResult> {
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
    
  } catch (error: unknown) {
    console.error('Payment error:', error);
    
    let errorMessage = 'Transaction failed';
    
    // Parse specific contract errors
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.reason) {
        if (err.reason.includes('IncorrectAmount')) {
          errorMessage = 'Insufficient payment amount. 1.1 MON required.';
        } else {
          errorMessage = err.reason;
        }
      } else if (err.message) {
        if (err.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient MON balance';
        } else {
          errorMessage = err.message;
        }
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function checkPaymentStatus(provider: unknown, userAddress: string): Promise<boolean> {
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