import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  CreditCard,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Smartphone,
  Coffee,
  Car,
  ShoppingBag,
  Zap,
  Home,
} from 'lucide-react-native';

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  cardUsed: string;
  optimized: boolean;
  couldSave?: number;
  recommendedCard?: string;
  saved?: number;
  location?: string;
}

interface Card {
  id: string;
  name: string;
  bank: string;
  lastFour: string;
  color: string;
}

const TransactionEntryScreen = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<any>(null);

  // Form state
  const [transactionForm, setTransactionForm] = useState({
    merchant: '',
    amount: '',
    category: 'dining',
    selectedCard: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Reactive recommendation state
  const [realtimeRecommendation, setRealtimeRecommendation] = useState<any>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const recommendationEngineRef = useRef<any>(null);

  // Available cards
  const cards: Card[] = [
    { id: '1', name: 'HDFC Millennia', bank: 'HDFC Bank', lastFour: '4532', color: '#3B82F6' },
    { id: '2', name: 'SBI SimplyCLICK', bank: 'SBI', lastFour: '7890', color: '#059669' },
    { id: '3', name: 'ICICI Amazon Pay', bank: 'ICICI Bank', lastFour: '1234', color: '#7C3AED' },
  ];

  // Sample transactions
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      merchant: 'Zomato',
      category: 'dining',
      amount: 540,
      date: '2025-08-10',
      cardUsed: 'SBI SimplyCLICK',
      optimized: false,
      couldSave: 27,
      recommendedCard: 'HDFC Millennia',
      location: 'Online'
    },
    {
      id: '2',
      merchant: 'Amazon',
      category: 'shopping',
      amount: 2340,
      date: '2025-08-09',
      cardUsed: 'ICICI Amazon Pay',
      optimized: true,
      saved: 117,
      location: 'Online'
    },
    {
      id: '3',
      merchant: 'Shell Petrol Pump',
      category: 'fuel',
      amount: 1850,
      date: '2025-08-08',
      cardUsed: 'HDFC Millennia',
      optimized: false,
      couldSave: 92,
      recommendedCard: 'BPCL SBI Card',
      location: 'Indiranagar, Bangalore'
    }
  ]);

  // Category icons and colors
  const categories = [
    { id: 'dining', name: 'Dining', icon: Coffee, color: '#F59E0B', bgColor: '#FEF3C7' },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: '#8B5CF6', bgColor: '#EDE9FE' },
    { id: 'fuel', name: 'Fuel', icon: Car, color: '#EF4444', bgColor: '#FEE2E2' },
    { id: 'utilities', name: 'Utilities', icon: Zap, color: '#10B981', bgColor: '#D1FAE5' },
    { id: 'groceries', name: 'Groceries', icon: Home, color: '#06B6D4', bgColor: '#CFFAFE' },
    { id: 'entertainment', name: 'Entertainment', icon: Smartphone, color: '#F97316', bgColor: '#FED7AA' },
  ];

  // Initialize recommendation engine
  useEffect(() => {
    // In a real app, this would import the RecommendationEngine class
    // For now, we'll simulate it with a basic implementation
    recommendationEngineRef.current = {
      getReactiveRecommendation: async (merchant, cartValue) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const recommendation = getOptimizationRecommendation(merchant, cartValue, transactionForm.category);
            resolve({
              userCardRecommendations: [{
                card: { name: recommendation.card, id: recommendation.card.toLowerCase().replace(/ /g, '-') },
                value: recommendation.savings,
                description: recommendation.reason,
                rate: Math.floor(recommendation.savings / cartValue * 100) || 1,
                type: 'cashback'
              }],
              cartValue: cartValue,
              aiPowered: false
            });
          }, 200 + Math.random() * 300); // Simulate network delay
        });
      }
    };
  }, []);

  // Reactive recommendation calculation
  const calculateRealtimeRecommendation = useCallback(async (merchant: string, amount: string) => {
    if (!merchant || !amount || !recommendationEngineRef.current) {
      setRealtimeRecommendation(null);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setRealtimeRecommendation(null);
      return;
    }

    setIsLoadingRecommendation(true);
    setRecommendationError(null);

    try {
      const recommendation = await recommendationEngineRef.current.getReactiveRecommendation(
        merchant,
        numericAmount
      );
      setRealtimeRecommendation(recommendation);
    } catch (error) {
      setRecommendationError('Failed to calculate recommendation');
      console.error('Recommendation calculation error:', error);
    } finally {
      setIsLoadingRecommendation(false);
    }
  }, [transactionForm.category]);

  // Debounced effect for amount/merchant changes
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateRealtimeRecommendation(transactionForm.merchant, transactionForm.amount);
    }, 300);

    return () => clearTimeout(timer);
  }, [transactionForm.merchant, transactionForm.amount, calculateRealtimeRecommendation]);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const getOptimizationRecommendation = (merchant: string, amount: number, category: string) => {
    // Smart recommendation logic based on merchant and category
    const recommendations: any = {
      'zomato': { card: 'HDFC Millennia', reason: '5% cashback on dining', savings: Math.floor(amount * 0.05) },
      'swiggy': { card: 'HDFC Millennia', reason: '5% cashback on dining', savings: Math.floor(amount * 0.05) },
      'amazon': { card: 'ICICI Amazon Pay', reason: '5% cashback on Amazon', savings: Math.floor(amount * 0.05) },
      'flipkart': { card: 'SBI SimplyCLICK', reason: '10X rewards on online shopping', savings: Math.floor(amount * 0.05) },
      'shell': { card: 'BPCL SBI Card', reason: '7% cashback on fuel', savings: Math.floor(amount * 0.07) },
      'hp petrol': { card: 'BPCL SBI Card', reason: '7% cashback on fuel', savings: Math.floor(amount * 0.07) },
    };

    const merchantKey = merchant.toLowerCase();
    const recommendation = recommendations[merchantKey];

    if (recommendation) {
      return recommendation;
    }

    // Category-based recommendations
    switch (category) {
      case 'dining':
        return { card: 'HDFC Millennia', reason: '5% cashback on dining', savings: Math.floor(amount * 0.05) };
      case 'shopping':
        return { card: 'SBI SimplyCLICK', reason: '10X rewards on online shopping', savings: Math.floor(amount * 0.05) };
      case 'fuel':
        return { card: 'BPCL SBI Card', reason: '7% cashback on fuel', savings: Math.floor(amount * 0.07) };
      default:
        return { card: 'HDFC Millennia', reason: '2% cashback on all purchases', savings: Math.floor(amount * 0.02) };
    }
  };

  const handleSubmit = () => {
    if (!transactionForm.merchant || !transactionForm.amount || !transactionForm.selectedCard) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    const recommendation = getOptimizationRecommendation(
      transactionForm.merchant,
      amount,
      transactionForm.category
    );

    const selectedCardName = cards.find(card => card.id === transactionForm.selectedCard)?.name || '';
    const isOptimal = selectedCardName === recommendation.card;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      merchant: transactionForm.merchant,
      category: transactionForm.category,
      amount: amount,
      date: transactionForm.date,
      cardUsed: selectedCardName,
      optimized: isOptimal,
      couldSave: isOptimal ? 0 : recommendation.savings,
      recommendedCard: isOptimal ? undefined : recommendation.card,
      saved: isOptimal ? recommendation.savings : 0,
      location: 'Manual Entry'
    };

    setTransactions([newTransaction, ...transactions]);

    // Show recommendation
    setCurrentRecommendation({
      ...recommendation,
      isOptimal,
      actualCard: selectedCardName,
      amount
    });
    setShowRecommendation(true);

    // Reset form
    setTransactionForm({
      merchant: '',
      amount: '',
      category: 'dining',
      selectedCard: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const renderRecommendationModal = () => (
    <Modal
      visible={showRecommendation}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRecommendation(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.recommendationModal}>
          {currentRecommendation?.isOptimal ? (
            <>
              <CheckCircle size={48} color="#10B981" />
              <Text style={styles.modalTitle}>Perfect Choice! 🎉</Text>
              <Text style={styles.modalMessage}>
                You used the optimal card and saved ₹{currentRecommendation.savings}!
              </Text>
              <Text style={styles.modalSubtext}>
                {currentRecommendation.reason}
              </Text>
            </>
          ) : (
            <>
              <AlertTriangle size={48} color="#F59E0B" />
              <Text style={styles.modalTitle}>Optimization Opportunity</Text>
              <Text style={styles.modalMessage}>
                You could have saved ₹{currentRecommendation.savings} by using {currentRecommendation.card}
              </Text>
              <Text style={styles.modalSubtext}>
                {currentRecommendation.reason}
              </Text>
              <TouchableOpacity
                style={styles.rememberButton}
                onPress={() => {
                  Alert.alert('Saved!', 'I\'ll remind you to use this card for similar purchases');
                  setShowRecommendation(false);
                }}
              >
                <Text style={styles.rememberButtonText}>Remember for next time</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowRecommendation(false)}
          >
            <Text style={styles.modalCloseText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderAddTransaction = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      {/* Merchant Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Merchant Name *</Text>
        <View style={styles.inputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Zomato, Amazon, Shell"
            value={transactionForm.merchant}
            onChangeText={(text) => setTransactionForm({...transactionForm, merchant: text})}
          />
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount *</Text>
        <View style={styles.inputContainer}>
          <DollarSign size={20} color="#9CA3AF" />
          <TextInput
            style={styles.textInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={transactionForm.amount}
            onChangeText={(text) => setTransactionForm({...transactionForm, amount: text})}
          />
        </View>
      </View>

      {/* Real-time Recommendation Display */}
      {(realtimeRecommendation || isLoadingRecommendation || recommendationError) && (
        <View style={styles.recommendationPreview}>
          <Text style={styles.recommendationTitle}>💡 Smart Recommendation</Text>
          
          {isLoadingRecommendation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>Calculating best rewards...</Text>
            </View>
          ) : recommendationError ? (
            <View style={styles.errorContainer}>
              <AlertTriangle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{recommendationError}</Text>
            </View>
          ) : realtimeRecommendation?.userCardRecommendations?.[0] ? (
            <View style={styles.recommendationContent}>
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <CreditCard size={20} color="#3B82F6" />
                  <Text style={styles.recommendedCardName}>
                    {realtimeRecommendation.userCardRecommendations[0].card.name}
                  </Text>
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardAmount}>
                      ₹{realtimeRecommendation.userCardRecommendations[0].value}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recommendationReason}>
                  {realtimeRecommendation.userCardRecommendations[0].description}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = transactionForm.category === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  { backgroundColor: isSelected ? category.bgColor : '#F9FAFB' },
                  { borderColor: isSelected ? category.color : '#E5E7EB' }
                ]}
                onPress={() => setTransactionForm({...transactionForm, category: category.id})}
              >
                <IconComponent size={24} color={isSelected ? category.color : '#6B7280'} />
                <Text style={[
                  styles.categoryText,
                  { color: isSelected ? category.color : '#6B7280' }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Card Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Card Used *</Text>
        <View style={styles.cardSelection}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardOption,
                transactionForm.selectedCard === card.id && styles.selectedCardOption
              ]}
              onPress={() => setTransactionForm({...transactionForm, selectedCard: card.id})}
            >
              <View style={[styles.cardColorIndicator, { backgroundColor: card.color }]} />
              <View style={styles.cardDetails}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardBank}>{card.bank} •••• {card.lastFour}</Text>
              </View>
              {transactionForm.selectedCard === card.id && (
                <CheckCircle size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date</Text>
        <View style={styles.inputContainer}>
          <Calendar size={20} color="#9CA3AF" />
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            value={transactionForm.date}
            onChangeText={(text) => setTransactionForm({...transactionForm, date: text})}
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.submitGradient}
        >
          <Plus size={20} color="white" />
          <Text style={styles.submitButtonText}>Add Transaction</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderTransactionHistory = () => (
    <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.historyStats}>
        <Text style={styles.historyTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {transactions.filter(t => t.optimized).length}
            </Text>
            <Text style={styles.statLabel}>Optimized</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
              ₹{transactions.reduce((sum, t) => sum + (t.couldSave || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Missed Savings</Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionsList}>
        {transactions.map((transaction) => {
          const categoryInfo = getCategoryInfo(transaction.category);
          const IconComponent = categoryInfo.icon;

          return (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.bgColor }]}>
                  <IconComponent size={20} color={categoryInfo.color} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.merchantName}>{transaction.merchant}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={styles.amountText}>₹{transaction.amount.toLocaleString()}</Text>
                  <Text style={styles.cardUsedText}>{transaction.cardUsed}</Text>
                </View>
              </View>
              
              <View style={styles.transactionFooter}>
                {transaction.location && (
                  <View style={styles.locationInfo}>
                    <MapPin size={12} color="#9CA3AF" />
                    <Text style={styles.locationText}>{transaction.location}</Text>
                  </View>
                )}
                
                <View style={styles.optimizationStatus}>
                  {transaction.optimized ? (
                    <View style={styles.optimizedBadge}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.optimizedText}>Saved ₹{transaction.saved}</Text>
                    </View>
                  ) : (
                    <View style={styles.missedBadge}>
                      <AlertTriangle size={14} color="#F59E0B" />
                      <Text style={styles.missedText}>
                        Could save ₹{transaction.couldSave} with {transaction.recommendedCard}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header with Tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'add' && styles.activeTab]}
            onPress={() => setActiveTab('add')}
          >
            <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
              Add New
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'add' ? renderAddTransaction() : renderTransactionHistory()}

      {/* Recommendation Modal */}
      {renderRecommendationModal()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  formContainer: {
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    minWidth: 80,
    gap: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardSelection: {
    gap: 12,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  selectedCardOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  cardColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardBank: {
    fontSize: 14,
    color: '#6B7280',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // History Styles
  historyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historyStats: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardUsedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  optimizationStatus: {
    flex: 1,
    alignItems: 'flex-end',
  },
  optimizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  optimizedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  missedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    maxWidth: 200,
  },
  missedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    flexShrink: 1,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  recommendationModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  rememberButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  rememberButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalCloseText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },

  // Real-time Recommendation Styles
  recommendationPreview: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    flex: 1,
  },
  recommendationContent: {
    gap: 8,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recommendedCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  rewardBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default TransactionEntryScreen;