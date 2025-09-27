'use client';

import { useState } from 'react';
import { Download, CreditCard, LogOut, Plus, Trash2, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User, Card } from '@/types';
import { INDIAN_BANK_CARDS, CARD_NETWORKS } from '@/lib/data';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: User;
  cards: Card[];
  onCardsUpdated: (cards: Card[]) => void;
}

export default function Dashboard({ user, cards, onCardsUpdated }: DashboardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
    }
  };

  const handleDownloadExtension = async () => {
    setIsDownloading(true);
    
    try {
      // Simulate download preparation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create download link for the extension
      const link = document.createElement('a');
      link.href = '/wisor-extension-v2.0-enhanced.zip';
      link.download = 'wisor-extension.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Extension download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download extension');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (error) throw error;

      const updatedCards = cards.filter(card => card.id !== cardId);
      onCardsUpdated(updatedCards);
      toast.success('Card deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete card');
    }
  };

  const getCardDetails = (cardName: string) => {
    return INDIAN_BANK_CARDS.find(card => card.id === cardName) || 
           { name: cardName, bank: 'Unknown', type: 'Credit Card' };
  };

  const getNetworkDetails = (networkValue: string) => {
    return CARD_NETWORKS.find(network => network.value === networkValue) || 
           { name: networkValue, value: networkValue };
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">W</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome to Wisor</h1>
              <p className="text-slate-600">{user.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8 mb-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Download className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Download Wisor Extension</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Your cards are ready! Download the Wisor Chrome extension to get AI-powered recommendations while shopping online.
          </p>
          
          <button
            onClick={handleDownloadExtension}
            disabled={isDownloading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center text-lg"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Preparing Download...
              </>
            ) : (
              <>
                <Download className="mr-3 h-6 w-6" />
                Download Wisor!
              </>
            )}
          </button>
          
          <p className="text-slate-500 text-sm mt-4">
            Start Savings today
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <CreditCard className="mr-3 h-6 w-6" />
            Your Cards ({cards.length})
          </h2>
          <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            <span>Add Card</span>
          </button>
        </div>

        {cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const cardDetails = getCardDetails(card.card_name);
              const networkDetails = getNetworkDetails(card.network || '');
              
              return (
                <div key={card.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  
                  <div className="relative z-10">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">{cardDetails.name}</h3>
                        <p className="text-slate-300 text-sm">{cardDetails.bank}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Card Number */}
                    <div className="mb-4">
                      <p className="text-slate-300 text-sm mb-1">Card Number</p>
                      <p className="font-mono text-lg">•••• •••• •••• {card.card_last4}</p>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-300 text-xs">Network</p>
                        <p className="font-semibold">{networkDetails.name}</p>
                      </div>
                      <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {networkDetails.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Cards Added</h3>
            <p className="text-slate-600 mb-6">Add your first credit card to get started</p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200">
              Add Your First Card
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Next Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Download the Wisor Chrome extension using the button above</li>
          <li>Extract the ZIP file to a folder on your computer</li>
          <li>Open Chrome and go to chrome://extensions</li>
          <li>Enable "Developer mode" and click "Load unpacked"</li>
          <li>Select the extracted folder and start shopping!</li>
        </ol>
      </div>
    </div>
  );
}