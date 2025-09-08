import React, { useState, useEffect } from 'react';
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
  CreditCard,
  Search,
  CheckCircle,
  AlertCircle,
  Zap,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react-native';

interface BankOption {
  id: string;
  name: string;
  fullName: string;
  color: string;
  logo: string;
  supportsScraping: boolean;
  popularCards: string[];
}

interface CardDetectionResult {
  confidence: number;
  suggestedCards: string[];
  detectedRewards: any[];
  bankVerified: boolean;
}

const AddUserCardScreen = ({ onBack, onCardAdded }: { 
  onBack: () => void;
  onCardAdded: (card: any) => void;
}) => {
  const [currentStep, setCurrentStep] = useState<'bank' | 'card-details' | 'verification'>('bank');
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<CardDetectionResult | null>(null);
  
  // Form state
  const [cardForm, setCardForm] = useState({
    cardName: '',
    lastFourDigits: '',
    expiryMonth: '',
    expiryYear: '',
    cardholderName: '',
    customRewards: {} as { [key: string]: string }
  });

  // Available banks with scraping support
  const supportedBanks: BankOption[] = [
    {
      id: 'hdfc',
      name: 'HDFC Bank',
      fullName: 'Housing Development Finance Corporation Bank',
      color: '#1E40AF',
      logo: '🏦',
      supportsScraping: true,
      popularCards: ['Millennia', 'Regalia', 'Diners Club Black', 'Infinia']
    },
    {
      id: 'sbi',
      name: 'SBI Cards',
      fullName: 'State Bank of India Cards',
      color: '#059669',
      logo: '🏛️',
      supportsScraping: true,
      popularCards: ['SimplyCLICK', 'Prime', 'Elite', 'Vistara']
    },
    {
      id: 'icici',
      name: 'ICICI Bank',
      fullName: 'Industrial Credit and Investment Corporation of India Bank',
      color: '#7C3AED',
      logo: '🏪',
      supportsScraping: true,
      popularCards: ['Amazon Pay', 'Platinum', 'Sapphiro', 'Emeralde']
    },
    {
      id: 'axis',
      name: 'Axis Bank',
      fullName: 'Axis Bank Limited',
      color: '#DC2626',
      logo: '🏢',
      supportsScraping: true,
      popularCards: ['Flipkart', 'Magnus', 'ACE', 'Select']
    },
    {
      id: 'kotak',
      name: 'Kotak Mahindra',
      fullName: 'Kotak Mahindra Bank',
      color: '#8B5CF6',
      logo: '🏨',
      supportsScraping: false,
      popularCards: ['League Platinum', 'Royale Signature', 'White Reserve']
    },
    {
      id: 'amex',
      name: 'American Express',
      fullName: 'American Express Banking Corp',
      color: '#D4AF37',
      logo: '💳',
      supportsScraping: false,
      popularCards: ['Gold Charge', 'Platinum Travel', 'Gold Reserve']
    }
  ];

  // Auto-detect rewards when bank is selected
  useEffect(() => {
    if (selectedBank?.supportsScraping) {
      detectCardRewards();
    }
  }, [selectedBank]);

  const detectCardRewards = async () => {
    if (!selectedBank) return;

    setIsDetecting(true);
    try {
      // Simulate reward detection API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockDetection: CardDetectionResult = {
        confidence: 0.85,
        suggestedCards: selectedBank.popularCards,
        detectedRewards: [
          {
            category: 'dining',
            rate: selectedBank.id === 'hdfc' ? 5 : 3,
            type: 'cashback',
            description: `${selectedBank.id === 'hdfc' ? 5 : 3}% cashback on dining`,
            source: 'scraped'
          },
          {
            category: 'online-shopping',
            rate: selectedBank.id === 'sbi' ? 5 : 2,
            type: selectedBank.id === 'sbi' ? 'points' : 'cashback',
            description: `${selectedBank.id === 'sbi' ? '5X points' : '2% cashback'} on online shopping`,
            source: 'scraped'
          }
        ],
        bankVerified: true
      };

      setDetectionResult(mockDetection);
      console.log(`Wisor: Detected rewards for ${selectedBank.name}`, mockDetection);
      
    } catch (error) {
      console.error('Error detecting rewards:', error);
      Alert.alert('Detection Failed', 'Could not auto-detect rewards. You can enter them manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBankSelection = (bank: BankOption) => {
    setSelectedBank(bank);
    setCurrentStep('card-details');
  };

  const handleCardSubmit = async () => {
    // Validate form
    if (!cardForm.cardName || !cardForm.lastFourDigits) {
      Alert.alert('Missing Information', 'Please fill in the card name and last 4 digits.');
      return;
    }

    if (cardForm.lastFourDigits.length !== 4 || !/^\d{4}$/.test(cardForm.lastFourDigits)) {
      Alert.alert('Invalid Format', 'Last 4 digits must be exactly 4 numbers.');
      return;
    }

    try {
      setCurrentStep('verification');
      
      // Create enhanced card object
      const newCard = {
        id: `user-${Date.now()}`,
        name: cardForm.cardName,
        bank: selectedBank?.name || '',
        bankId: selectedBank?.id || '',
        lastFourDigits: cardForm.lastFourDigits,
        cardholderName: cardForm.cardholderName,
        source: 'user-added',
        isActive: true,
        color: selectedBank?.color || '#6B7280',
        
        // Auto-detected or manual rewards
        customRewards: detectionResult ? 
          detectionResult.detectedRewards.reduce((acc, reward) => {
            acc[reward.category] = {
              rate: reward.rate,
              type: reward.type,
              description: reward.description,
              source: reward.source
            };
            return acc;
          }, {} as any) : cardForm.customRewards,
        
        verification: {
          status: 'verified',
          date: new Date().toISOString(),
          confidence: detectionResult?.confidence || 0.5,
          method: detectionResult ? 'auto-scraped' : 'manual'
        },
        
        // Metadata
        addedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onCardAdded(newCard);
      Alert.alert(
        'Card Added Successfully! 🎉', 
        `${newCard.name} has been added to your portfolio${detectionResult ? ' with auto-detected rewards' : ''}.`
      );

    } catch (error) {
      console.error('Error adding card:', error);
      Alert.alert('Error', 'Failed to add card. Please try again.');
      setCurrentStep('card-details');
    }
  };

  const renderBankSelection = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Credit Card</Text>
      </View>

      <Text style={styles.sectionTitle}>Select Your Bank</Text>
      <Text style={styles.sectionSubtitle}>
        Choose your bank to auto-detect rewards and offers
      </Text>

      <View style={styles.banksContainer}>
        {supportedBanks.map((bank) => (
          <TouchableOpacity
            key={bank.id}
            style={styles.bankOption}
            onPress={() => handleBankSelection(bank)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[bank.color + '15', bank.color + '25']}
              style={styles.bankGradient}
            >
              <View style={styles.bankHeader}>
                <Text style={styles.bankLogo}>{bank.logo}</Text>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  <Text style={styles.bankFullName}>{bank.fullName}</Text>
                </View>
                {bank.supportsScraping && (
                  <View style={styles.scrapingBadge}>
                    <Zap size={12} color="#10B981" />
                    <Text style={styles.scrapingText}>Auto-detect</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.popularCards}>
                <Text style={styles.popularCardsTitle}>Popular Cards:</Text>
                <Text style={styles.popularCardsList}>
                  {bank.popularCards.slice(0, 3).join(', ')}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.manualOption}>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => {
            setSelectedBank(null);
            setCurrentStep('card-details');
          }}
        >
          <Plus size={20} color="#6B7280" />
          <Text style={styles.manualButtonText}>Add manually without auto-detection</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderCardDetails = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('bank')} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Details</Text>
      </View>

      {selectedBank && (
        <View style={styles.selectedBankInfo}>
          <Text style={styles.selectedBankLogo}>{selectedBank.logo}</Text>
          <View>
            <Text style={styles.selectedBankName}>{selectedBank.name}</Text>
            {isDetecting && (
              <View style={styles.detectingStatus}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.detectingText}>Auto-detecting rewards...</Text>
              </View>
            )}
            {detectionResult && (
              <View style={styles.detectionSuccess}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.detectionSuccessText}>
                  {detectionResult.detectedRewards.length} rewards detected
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Card Form */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Card Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Millennia Credit Card"
            value={cardForm.cardName}
            onChangeText={(text) => setCardForm({...cardForm, cardName: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last 4 Digits *</Text>
          <TextInput
            style={styles.input}
            placeholder="1234"
            maxLength={4}
            keyboardType="numeric"
            value={cardForm.lastFourDigits}
            onChangeText={(text) => setCardForm({...cardForm, lastFourDigits: text})}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Expiry Month</Text>
            <TextInput
              style={styles.input}
              placeholder="MM"
              maxLength={2}
              keyboardType="numeric"
              value={cardForm.expiryMonth}
              onChangeText={(text) => setCardForm({...cardForm, expiryMonth: text})}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Expiry Year</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY"
              maxLength={4}
              keyboardType="numeric"
              value={cardForm.expiryYear}
              onChangeText={(text) => setCardForm({...cardForm, expiryYear: text})}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cardholder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Name as on card"
            value={cardForm.cardholderName}
            onChangeText={(text) => setCardForm({...cardForm, cardholderName: text})}
          />
        </View>
      </View>

      {/* Detected Rewards Display */}
      {detectionResult && detectionResult.detectedRewards.length > 0 && (
        <View style={styles.detectedRewards}>
          <Text style={styles.detectedRewardsTitle}>🎯 Auto-Detected Rewards</Text>
          {detectionResult.detectedRewards.map((reward, index) => (
            <View key={index} style={styles.rewardItem}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardCategory}>{reward.category.charAt(0).toUpperCase() + reward.category.slice(1)}</Text>
                <Text style={styles.rewardDescription}>{reward.description}</Text>
              </View>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardRate}>{reward.rate}%</Text>
              </View>
            </View>
          ))}
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(detectionResult.confidence * 100)}%
            </Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleCardSubmit}>
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.submitGradient}
        >
          <CreditCard size={20} color="white" />
          <Text style={styles.submitButtonText}>Add Card</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderVerification = () => (
    <View style={styles.verificationContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.verificationTitle}>Adding Your Card...</Text>
      <Text style={styles.verificationSubtitle}>
        Setting up rewards tracking and offer detection
      </Text>
      
      <View style={styles.verificationSteps}>
        <View style={styles.verificationStep}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.verificationStepText}>Card validated</Text>
        </View>
        <View style={styles.verificationStep}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.verificationStepText}>Rewards configured</Text>
        </View>
        <View style={styles.verificationStep}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.verificationStepText}>Setting up offer monitoring...</Text>
        </View>
      </View>
    </View>
  );

  // Render current step
  switch (currentStep) {
    case 'bank':
      return renderBankSelection();
    case 'card-details':
      return renderCardDetails();
    case 'verification':
      return renderVerification();
    default:
      return renderBankSelection();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  banksContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bankOption: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bankGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankLogo: {
    fontSize: 32,
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  bankFullName: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrapingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scrapingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  popularCards: {
    marginTop: 8,
  },
  popularCardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  popularCardsList: {
    fontSize: 14,
    color: '#6B7280',
  },
  manualOption: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  manualButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Card Details Styles
  selectedBankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  selectedBankLogo: {
    fontSize: 24,
  },
  selectedBankName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detectingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  detectingText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  detectionSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  detectionSuccessText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
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
  detectedRewards: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  detectedRewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  rewardDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  rewardBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardRate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  confidenceBadge: {
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
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
  
  // Verification Styles
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  verificationSteps: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  verificationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verificationStepText: {
    fontSize: 16,
    color: '#1F2937',
  },
});

export default AddUserCardScreen;