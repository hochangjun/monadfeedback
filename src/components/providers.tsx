'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { createConfig } from 'wagmi';
import { monadTestnet } from '@/lib/config';
import { ThemeProvider } from '@/components/theme-provider';

const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!privyAppId) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
    return (
      <ThemeProvider defaultTheme="system" storageKey="monad-feedback-theme">
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Configuration Error</h1>
            <p className="text-gray-600 dark:text-gray-300">Missing Privy App ID. Please check environment variables.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Check /api/debug for more details</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="monad-feedback-theme">
      <PrivyProvider
        appId={privyAppId}
        config={{
          // Display only wallet as login method
          loginMethods: ['wallet'],
          // Customize Privy's appearance in your app
          appearance: {
            theme: 'light',
            accentColor: '#836EF9',
            logo: '/monad_logo.svg',
          },
          // Disable embedded wallets to reduce complexity
          embeddedWallets: {
            createOnLogin: 'off',
          },
          defaultChain: monadTestnet,
          supportedChains: [monadTestnet],
          // Disable unnecessary features that might cause conflicts
          walletConnectCloudProjectId: undefined,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
} 