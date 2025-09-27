'use client';

import { useState } from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';
import { INDIAN_BANK_CARDS, CARD_NETWORKS } from '@/lib/data';
import { Card } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface AddCardFormProps {
  onCardsAdded: (cards: Omit<Card, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => void;
  isLoading?: boolean;
}

interface CardFormData {
  id: string;
  card_name: string;
  network: string;
  card_last4: string;
}

export default function AddCardForm({ onCardsAdded, isLoading = false }: AddCardFormProps) {
  const [cards, setCards] = useState<CardFormData[]>([
    { id: '1', card_name: '', network: '', card_last4: '' }
  ]);

  const addCard = () => {
    const newCard: CardFormData = {
      id: Date.now().toString(),
      card_name: '',
      network: '',
      card_last4: ''
    };
    setCards([...cards, newCard]);
  };

  const removeCard = (id: string) => {
    if (cards.length > 1) {
      setCards(cards.filter(card => card.id !== id));
    }
  };

  const updateCard = (id: string, field: keyof CardFormData, value: string) => {
    setCards(cards.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  const handleLastFourDigitsChange = (id: string, value: string) => {
    // Only allow digits and limit to 4 characters
    const digits = value.replace(/\D/g, '').slice(0, 4);
    updateCard(id, 'card_last4', digits);
  };

  const validateCards = (): boolean => {
    let isValid = true;
    const validCards = cards.filter(card => 
      card.card_name || card.network || card.card_last4
    );

    if (validCards.length === 0) {
      toast.error('Please add at least one card');
      return false;
    }

    for (const card of validCards) {
      if (!card.card_name) {
        toast.error('Please select a card name for all cards');
        isValid = false;
        break;
      }
      if (!card.network) {
        toast.error('Please select a network for all cards');
        isValid = false;
        break;
      }
      if (card.card_last4.length !== 4) {
        toast.error('Please enter 4 digits for all card numbers');
        isValid = false;
        break;
      }
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (!validateCards()) return;

    const validCards = cards
      .filter(card => card.card_name && card.network && card.card_last4.length === 4)
      .map(({ id, ...card }) => card);

    onCardsAdded(validCards);
  };

  const renderCardOption = (option: any) => (
    <div>
      <div className="font-medium">{option.name}</div>
      <div className="text-sm text-slate-500">{option.bank} • {option.type}</div>
    </div>
  );

  const renderNetworkOption = (option: any) => (
    <div className="flex items-center">
      <div className="w-8 h-5 bg-slate-100 rounded mr-3 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-600">
          {option.name.charAt(0)}
        </span>
      </div>
      <span>{option.name}</span>
    </div>
  );

  const hasValidCards = cards.some(card => 
    card.card_name && card.network && card.card_last4.length === 4
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Add Your Credit Cards</h1>
          <p className="text-slate-600">Add one or more cards to get personalized recommendations</p>
        </div>

        {/* Cards Form */}
        <div className="space-y-6">
          {cards.map((card, index) => (
            <div key={card.id} className="border border-slate-200 rounded-2xl p-6 bg-white/50">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Card {index + 1}
                </h3>
                {cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Card Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Card Name Dropdown */}
                <SearchableDropdown
                  options={INDIAN_BANK_CARDS.map(card => ({ ...card, value: card.id }))}
                  value={card.card_name}
                  onChange={(value) => updateCard(card.id, 'card_name', value)}
                  placeholder="Select your card"
                  label="Card Name"
                  searchPlaceholder="Search cards..."
                  renderOption={renderCardOption}
                />

                {/* Network Dropdown */}
                <SearchableDropdown
                  options={CARD_NETWORKS}
                  value={card.network}
                  onChange={(value) => updateCard(card.id, 'network', value)}
                  placeholder="Select network"
                  label="Card Network"
                  searchPlaceholder="Search networks..."
                  renderOption={renderNetworkOption}
                />
              </div>

              {/* Last 4 Digits */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last 4 Digits
                </label>
                <input
                  type="text"
                  value={card.card_last4}
                  onChange={(e) => handleLastFourDigitsChange(card.id, e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Only the last 4 digits for identification
                </p>
              </div>
            </div>
          ))}

          {/* Add Another Card */}
          <button
            type="button"
            onClick={addCard}
            className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors group"
          >
            <Plus className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Add Another Card</span>
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!hasValidCards || isLoading}
            className={cn(
              "w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200",
              hasValidCards && !isLoading
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Adding Cards...
              </div>
            ) : (
              `Continue with ${cards.filter(card => card.card_name && card.network && card.card_last4.length === 4).length} Card${cards.filter(card => card.card_name && card.network && card.card_last4.length === 4).length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Your card information is stored securely and only used for recommendations
        </div>
      </div>
    </div>
  );
}