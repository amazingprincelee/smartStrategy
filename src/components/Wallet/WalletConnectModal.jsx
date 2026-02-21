import React from 'react';
import { X, Wallet, ExternalLink } from 'lucide-react';
import { useConnect } from 'wagmi';

const WalletConnectModal = ({ isOpen, onClose }) => {
  const { connectors, connect, isPending } = useConnect();

  if (!isOpen) return null;

  const handleConnectorClick = async (connector) => {
    connect({ connector });
    onClose();
  };

  const getConnectorIcon = (connectorId) => {
    switch (connectorId) {
      case 'metaMask':
        return '🦊';
      case 'walletConnect':
        return '🔗';
      case 'injected':
        return '💼';
      default:
        return '🔗';
    }
  };

  const getConnectorName = (connector) => {
    switch (connector.id) {
      case 'metaMask':
        return 'MetaMask';
      case 'walletConnect':
        return 'WalletConnect';
      case 'injected':
        return connector.name || 'Injected Wallet';
      default:
        return connector.name || 'Unknown Wallet';
    }
  };

  const getConnectorDescription = (connectorId) => {
    switch (connectorId) {
      case 'metaMask':
        return 'Connect using MetaMask browser extension';
      case 'walletConnect':
        return 'Connect using WalletConnect protocol';
      case 'injected':
        return 'Connect using injected wallet';
      default:
        return 'Connect using this wallet';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-brandDark-800 rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connect Wallet
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-brandDark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose a wallet to connect to SmartStrategy. By connecting, you agree to our terms of service.
          </p>

          {/* Wallet Options */}
          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnectorClick(connector)}
                disabled={isPending}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-brandDark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {getConnectorIcon(connector.id)}
                  </span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {getConnectorName(connector)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getConnectorDescription(connector.id)}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isPending && (
            <div className="mt-4 flex items-center justify-center">
              <div className="spinner w-6 h-6" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Connecting...
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-brandDark-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              New to Ethereum wallets?{' '}
              <a
                href="https://ethereum.org/en/wallets/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;