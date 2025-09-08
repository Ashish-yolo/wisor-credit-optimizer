import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  TextInput,
  Alert
} from 'react-native';
import AddUserCardScreen from './AddUserCardScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  Tag,
  Clock,
  Gift,
  Zap
} from 'lucide-react-native';

interface CreditCardData {
  id: string;
  bankName: string;
  cardName: string;
  cardType: 'Visa' | 'Mastercard' | 'RuPay' | 'American Express';
  lastFourDigits: string;
  primaryBenefit: string;
  rewardRate: string;
  annualFee: number;
  isActive: boolean;
  color: string[];
  monthlySpend: number;
  rewardsEarned: number;
  nextBillDate: string;
  outstandingAmount: number;
  source?: 'static' | 'user-added' | 'detected';
  activeOffers?: DynamicOfferData[];
  customRewards?: { [category: string]: string };
}

interface DynamicOfferData {
  id: string;
  title: string;
  description: string;
  rate: number;
  type: 'cashback' | 'points' | 'discount';
  category: string;
  expires: string;
  maxBenefit?: number;
  source: 'scraped' | 'manual';
}

const CardManagementScreen = () => {
  const [cards, setCards] = useState<CreditCardData[]>([
    {
      id: '1',
      bankName: 'HDFC Bank',
      cardName: 'Millennia Credit Card',
      cardType: 'Visa',
      lastFourDigits: '4532',
      primaryBenefit: 'Dining & Online Shopping',
      rewardRate: '5% cashback',
      annualFee: 1000,
      isActive: true,
      color: ['#1E40AF', '#3B82F6'],
      monthlySpend: 25400,
      rewardsEarned: 1270,
      nextBillDate: '15 Aug',
      outstandingAmount: 23450,
      source: 'static',
      activeOffers: [
        {
          id: 'hdfc-dining-offer',
          title: '20% off on Zomato',
          description: '20% discount up to ₹100 on food delivery',
          rate: 20,
          type: 'discount',
          category: 'dining',
          expires: '2025-09-15T23:59:59.000Z',
          maxBenefit: 100,
          source: 'scraped'
        },
        {
          id: 'hdfc-shopping-offer',
          title: 'Extra 5% on Amazon',
          description: 'Additional 5% cashback on Amazon purchases',
          rate: 5,
          type: 'cashback',
          category: 'shopping',
          expires: '2025-09-30T23:59:59.000Z',
          source: 'scraped'
        }
      ]
    },
    {
      id: '2',
      bankName: 'SBI',
      cardName: 'SimplyCLICK',
      cardType: 'Visa',
      lastFourDigits: '7890',
      primaryBenefit: 'Online Shopping',
      rewardRate: '10X rewards',
      annualFee: 499,
      isActive: true,
      color: ['#059669', '#10B981'],
      monthlySpend: 18200,
      rewardsEarned: 910,
      nextBillDate: '18 Aug',
      outstandingAmount: 8900,
      source: 'static',
      activeOffers: [
        {
          id: 'sbi-flipkart-offer',
          title: '10% instant discount',
          description: '10% instant discount on Flipkart up to ₹1500',
          rate: 10,
          type: 'discount',
          category: 'shopping',
          expires: '2025-10-31T23:59:59.000Z',
          maxBenefit: 1500,
          source: 'scraped'
        }
      ]
    },
    {
      id: '3',
      bankName: 'ICICI Bank',
      cardName: 'Amazon Pay',
      cardType: 'Visa',
      lastFourDigits: '1234',
      primaryBenefit: 'Amazon & Fuel',
      rewardRate: '5% on Amazon',
      annualFee: 0,
      isActive: true,
      color: ['#7C3AED', '#8B5CF6'],
      monthlySpend: 12800,
      rewardsEarned: 640,
      nextBillDate: '22 Aug',
      outstandingAmount: 12340,
      source: 'static',
      activeOffers: [
        {
          id: 'icici-amazon-prime',
          title: 'Prime Day Special',
          description: 'Extra 2% cashback during Prime Day events',
          rate: 2,
          type: 'cashback',
          category: 'shopping',
          expires: '2025-10-15T23:59:59.000Z',
          source: 'scraped'
        }
      ]
    }
  ]);

  const [showAddCard, setShowAddCard] = useState(false);
  const [showAdvancedAddCard, setShowAdvancedAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    bankName: '',
    cardName: '',
    lastFourDigits: '',
    primaryBenefit: ''
  });

  const handleAddCard = () => {
    if (!newCard.bankName || !newCard.cardName || !newCard.lastFourDigits) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const cardData: CreditCardData = {
      id: Date.now().toString(),
      bankName: newCard.bankName,
      cardName: newCard.cardName,
      cardType: 'Visa',
      lastFourDigits: newCard.lastFourDigits,
      primaryBenefit: newCard.primaryBenefit || 'General',
      rewardRate: '1% cashback',
      annualFee: 0,
      isActive: true,
      color: ['#6B7280', '#9CA3AF'],
      monthlySpend: 0,
      rewardsEarned: 0,
      nextBillDate: '28 Aug',
      outstandingAmount: 0
    };

    setCards([...cards, cardData]);
    setNewCard({ bankName: '', cardName: '', lastFourDigits: '', primaryBenefit: '' });
    setShowAddCard(false);
    Alert.alert('Success', 'Credit card added successfully!');
  };

  const toggleCardStatus = (cardId: string) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isActive: !card.isActive } : card
    ));
  };

  const deleteCard = (cardId: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to remove this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setCards(cards.filter(card => card.id !== cardId))
        }
      ]
    );
  };

  const handleAdvancedCardAdd = (newCardData: any) => {
    const enhancedCard: CreditCardData = {
      id: newCardData.id,
      bankName: newCardData.bank,
      cardName: newCardData.name,
      cardType: 'Visa' as any,
      lastFourDigits: newCardData.lastFourDigits,
      primaryBenefit: Object.keys(newCardData.customRewards)[0] || 'General',
      rewardRate: newCardData.verification?.method === 'auto-scraped' ? 'Auto-detected' : 'Custom',
      annualFee: 0,
      isActive: true,
      color: [newCardData.color, newCardData.color + '80'],
      monthlySpend: 0,
      rewardsEarned: 0,
      nextBillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      outstandingAmount: 0,
      source: 'user-added',
      customRewards: Object.keys(newCardData.customRewards).reduce((acc, key) => {
        const reward = newCardData.customRewards[key];
        acc[key] = `${reward.rate}% ${reward.type}`;
        return acc;
      }, {} as any)
    };

    setCards([enhancedCard, ...cards]);
    setShowAdvancedAddCard(false);

    console.log('Added enhanced card:', enhancedCard);
  };

  const totalMonthlySpend = cards.reduce((sum, card) => sum + card.monthlySpend, 0);
  const totalRewards = cards.reduce((sum, card) => sum + card.rewardsEarned, 0);
  const totalOutstanding = cards.reduce((sum, card) => sum + card.outstandingAmount, 0);

  // Helper function to get offer type icon
  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'discount': return Tag;
      case 'cashback': return DollarSign;
      case 'points': return Gift;
      default: return Star;
    }
  };

  // Helper function to check if offer is expiring soon
  const isOfferExpiringSoon = (expires: string) => {
    const expiryDate = new Date(expires);
    const now = new Date();
    const diffInDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7;
  };

  // Render active offers section
  const renderActiveOffers = (card: CreditCardData) => {
    if (!card.activeOffers || card.activeOffers.length === 0) return null;

    return (
      <View style={styles.offersSection}>
        <View style={styles.offersSectionHeader}>
          <Zap size={16} color="#F59E0B" />
          <Text style={styles.offersSectionTitle}>Active Offers</Text>
          <View style={styles.offerCountBadge}>
            <Text style={styles.offerCountText}>{card.activeOffers.length}</Text>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScrollView}>
          {card.activeOffers.map((offer) => {
            const OfferIcon = getOfferIcon(offer.type);
            const isExpiringSoon = isOfferExpiringSoon(offer.expires);
            
            return (
              <View key={offer.id} style={[styles.offerCard, isExpiringSoon && styles.offerCardExpiring]}>
                <View style={styles.offerHeader}>
                  <OfferIcon size={14} color={isExpiringSoon ? "#EF4444" : "#10B981"} />
                  <Text style={[styles.offerTitle, isExpiringSoon && styles.offerTitleExpiring]} numberOfLines={1}>
                    {offer.title}
                  </Text>
                </View>
                
                <Text style={styles.offerDescription} numberOfLines={2}>
                  {offer.description}
                </Text>
                
                <View style={styles.offerFooter}>
                  <View style={[styles.offerTypeBadge, { backgroundColor: offer.type === 'discount' ? '#FEE2E2' : '#D1FAE5' }]}>
                    <Text style={[styles.offerTypeText, { color: offer.type === 'discount' ? '#DC2626' : '#059669' }]}>
                      {offer.rate}% {offer.type}
                    </Text>
                  </View>
                  
                  <View style={styles.offerExpiry}>
                    <Clock size={10} color={isExpiringSoon ? "#EF4444" : "#6B7280"} />
                    <Text style={[styles.offerExpiryText, isExpiringSoon && styles.offerExpiryTextExpiring]}>
                      {new Date(offer.expires).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
                
                {offer.source === 'scraped' && (
                  <View style={styles.offerSourceBadge}>
                    <Text style={styles.offerSourceText}>Auto-detected</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (showAddCard) {
    return (
      <View style={styles.container}>
        <View style={styles.addCardHeader}>
          <Text style={styles.addCardTitle}>Add New Credit Card</Text>
          <TouchableOpacity 
            onPress={() => setShowAddCard(false)}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.addCardForm} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., HDFC Bank"
              value={newCard.bankName}
              onChangeText={(text) => setNewCard({...newCard, bankName: text})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Millennia Credit Card"
              value={newCard.cardName}
              onChangeText={(text) => setNewCard({...newCard, cardName: text})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last 4 Digits*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1234"
              maxLength={4}
              keyboardType="numeric"
              value={newCard.lastFourDigits}
              onChangeText={(text) => setNewCard({...newCard, lastFourDigits: text})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Primary Benefit</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dining & Shopping"
              value={newCard.primaryBenefit}
              onChangeText={(text) => setNewCard({...newCard, primaryBenefit: text})}
            />
          </View>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddCard}
          >
            <Text style={styles.addButtonText}>Add Card</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Show advanced add card screen
  if (showAdvancedAddCard) {
    return (
      <AddUserCardScreen
        onBack={() => setShowAdvancedAddCard(false)}
        onCardAdded={handleAdvancedCardAdd}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Portfolio Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Credit Cards</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{totalMonthlySpend.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Monthly Spend</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{totalRewards.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Rewards Earned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{totalOutstanding.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Enhanced Add New Card Buttons */}
        <View style={styles.addCardOptionsContainer}>
          <TouchableOpacity 
            style={styles.addCardButtonPrimary}
            onPress={() => setShowAdvancedAddCard(true)}
            activeOpacity={0.7}
          >
            <Zap size={24} color="white" />
            <View style={styles.addCardButtonContent}>
              <Text style={styles.addCardButtonTextPrimary}>Smart Add Card</Text>
              <Text style={styles.addCardButtonSubtext}>Auto-detect rewards & offers</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addCardButtonSecondary}
            onPress={() => setShowAddCard(true)}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#3B82F6" />
            <Text style={styles.addCardButtonTextSecondary}>Quick Add</Text>
          </TouchableOpacity>
        </View>

        {/* Cards List */}
        <View style={styles.cardsContainer}>
          {cards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              {/* Card Visual */}
              <LinearGradient
                colors={card.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.creditCard, !card.isActive && styles.inactiveCard]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.bankName}>{card.bankName}</Text>
                  <Text style={styles.cardType}>{card.cardType}</Text>
                </View>
                
                <View style={styles.cardMiddle}>
                  <Text style={styles.cardName}>{card.cardName}</Text>
                  <View style={styles.cardNumber}>
                    <Text style={styles.cardNumberText}>•••• •••• •••• {card.lastFourDigits}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.benefitLabel}>Primary Benefit</Text>
                    <Text style={styles.benefitValue}>{card.primaryBenefit}</Text>
                  </View>
                  <View style={styles.rewardRate}>
                    <Star size={16} color="#FDE047" />
                    <Text style={styles.rewardRateText}>{card.rewardRate}</Text>
                  </View>
                </View>

                {!card.isActive && (
                  <View style={styles.inactiveOverlay}>
                    <Text style={styles.inactiveText}>Inactive</Text>
                  </View>
                )}
              </LinearGradient>

              {/* Card Stats */}
              <View style={styles.cardStats}>
                <View style={styles.statRow}>
                  <View style={styles.statColumn}>
                    <View style={styles.statWithIcon}>
                      <TrendingUp size={16} color="#10B981" />
                      <Text style={styles.statNumber}>₹{card.monthlySpend.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.statDescription}>This Month</Text>
                  </View>
                  
                  <View style={styles.statColumn}>
                    <View style={styles.statWithIcon}>
                      <DollarSign size={16} color="#3B82F6" />
                      <Text style={styles.statNumber}>₹{card.rewardsEarned.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.statDescription}>Rewards</Text>
                  </View>
                  
                  <View style={styles.statColumn}>
                    <View style={styles.statWithIcon}>
                      <Calendar size={16} color="#F59E0B" />
                      <Text style={styles.statNumber}>{card.nextBillDate}</Text>
                    </View>
                    <Text style={styles.statDescription}>Next Bill</Text>
                  </View>
                </View>

                {card.outstandingAmount > 0 && (
                  <View style={styles.outstandingAlert}>
                    <Text style={styles.outstandingText}>
                      Outstanding: ₹{card.outstandingAmount.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Active Offers Section */}
              {renderActiveOffers(card)}

              {/* Card Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => toggleCardStatus(card.id)}
                >
                  <Text style={[styles.actionButtonText, !card.isActive && styles.activateText]}>
                    {card.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => Alert.alert('Edit Card', 'Edit functionality coming soon!')}
                >
                  <Edit3 size={16} color="#6B7280" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteCard(card.id)}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Optimization Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Use HDFC Millennia for dining & online shopping (5% cashback)</Text>
            <Text style={styles.tipItem}>• SBI SimplyCLICK is best for e-commerce purchases (10X rewards)</Text>
            <Text style={styles.tipItem}>• ICICI Amazon Pay ideal for Amazon purchases & fuel (5% cashback)</Text>
            <Text style={styles.tipItem}>• Pay bills before due date to avoid interest charges</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  addCardButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Enhanced Add Card Styles
  addCardOptionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  addCardButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  addCardButtonContent: {
    flex: 1,
  },
  addCardButtonTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addCardButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  addCardButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  addCardButtonTextSecondary: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  cardsContainer: {
    marginTop: 16,
  },
  cardWrapper: {
    marginBottom: 24,
  },
  creditCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    justifyContent: 'space-between',
    position: 'relative',
  },
  inactiveCard: {
    opacity: 0.6,
  },
  inactiveOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardType: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardNumber: {
    marginBottom: 8,
  },
  cardNumberText: {
    color: 'white',
    fontSize: 16,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  benefitLabel: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  benefitValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rewardRate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardRateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cardStats: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    alignItems: 'center',
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  outstandingAlert: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignItems: 'center',
  },
  outstandingText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  actionButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  activateText: {
    color: '#059669',
  },
  deleteButton: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  deleteText: {
    color: '#EF4444',
  },
  tipsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  
  // Add Card Form Styles
  addCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  addCardForm: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Offers Section Styles
  offersSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  offersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  offersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  offerCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  offersScrollView: {
    marginHorizontal: -4,
  },
  offerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    width: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  offerCardExpiring: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  offerTitleExpiring: {
    color: '#DC2626',
  },
  offerDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offerTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  offerExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  offerExpiryText: {
    fontSize: 10,
    color: '#6B7280',
  },
  offerExpiryTextExpiring: {
    color: '#DC2626',
    fontWeight: '600',
  },
  offerSourceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offerSourceText: {
    fontSize: 9,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default CardManagementScreen;