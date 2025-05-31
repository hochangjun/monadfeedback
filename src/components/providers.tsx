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
  return (
    <ThemeProvider defaultTheme="system" storageKey="monad-feedback-theme">
              <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          config={{
            // Display only wallet as login method
            loginMethods: ['wallet'],
            // Customize Privy's appearance in your app
            appearance: {
              theme: 'light',
              accentColor: '#836EF9',
              logo: '/monad_logo.svg',
            },
            // Create embedded wallets for users who don't have a wallet
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
            defaultChain: monadTestnet,
            supportedChains: [monadTestnet],
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