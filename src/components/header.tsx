'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { Wallet, LogOut, MessageSquare, History, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentView: 'form' | 'history';
  onViewChange: (view: 'form' | 'history') => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { theme, setTheme } = useTheme();

  const connectedWallet = wallets.find(wallet => wallet.address);

  const handleConnect = () => {
    login();
  };

  const handleDisconnect = () => {
    logout();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!ready) {
    return (
      <header className="border-b bg-white dark:bg-purple-900/30 dark:border-purple-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/monad_logo.svg" 
                alt="Monad Logo" 
                className="h-8 w-8"
              />
              <h1 className="text-xl font-bold">Monad Feedback</h1>
            </div>
            <div className="animate-pulse bg-gray-200 dark:bg-purple-700 h-10 w-32 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white dark:bg-purple-900/30 dark:border-purple-800 sticky top-0 z-50 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/monad_logo.svg" 
                alt="Monad Logo" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Monad Feedback
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Share your thoughts on Monad Testnet apps
                </p>
              </div>
            </div>
            
            {authenticated && (
              <nav className="flex space-x-1 absolute left-1/2 transform -translate-x-1/2">
                <Button
                  variant={currentView === 'form' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('form')}
                  className="flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Submit Feedback</span>
                </Button>
                <Button
                  variant={currentView === 'history' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('history')}
                  className="flex items-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </Button>
              </nav>
            )}
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            {authenticated && connectedWallet ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Monad Testnet
                  </p>
                </div>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnect</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 