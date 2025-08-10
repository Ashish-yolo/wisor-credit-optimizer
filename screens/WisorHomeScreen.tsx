import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Camera, 
  Send, 
  Zap, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  Smartphone, 
  BarChart3 
} from 'lucide-react-native';

const WisorHomeScreen = () => {
  const [chatInput, setChatInput] = useState('');

  // Dummy data
  const userData = {
    name: "Rohit",
    monthlySavings: 2847,
    totalRewards: 12340,
    optimizedTransactions: 18,
    totalTransactions: 23,
    missedSavings: 1200
  };

  const recentTransactions = [
    {
      id: 1,
      merchant: "Zomato",
      amount: 540,
      date: "Today",
      cardUsed: "SBI SimplyCLICK",
      optimized: false,
      couldSave: 27,
      recommendedCard: "HDFC Millennia"
    },
    {
      id: 2,
      merchant: "Amazon",
      amount: 2340,
      date: "Yesterday",
      cardUsed: "Amazon ICICI",
      optimized: true,
      saved: 117
    },
    {
      id: 3,
      merchant: "Big Bazaar",
      amount: 1850,
      date: "2 days ago",
      cardUsed: "HDFC Regalia",
      optimized: true,
      saved: 92
    }
  ];

  const quickQuestions = [
    "Best card for dining?",
    "My spending this month",
    "Upcoming bill dates"
  ];

  const handleScan = () => {
    // Simulate QR scan detection
    setTimeout(() => {
      Alert.alert(
        "McDonald's detected! 🍟",
        "Recommendation: Use HDFC Millennia\n• 5% cashback on dining\n• Save ₹50 on ₹1000 spend\n• Better than your default SBI card (1%)"
      );
    }, 1000);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    
    // Simple AI responses based on input
    let response = "";
    const input = chatInput.toLowerCase();
    
    if (input.includes("dining") || input.includes("restaurant")) {
      response = "For dining, use your HDFC Millennia card - you'll get 5% cashback vs 1% on your default SBI card. You could save ₹100 on every ₹2,000 restaurant bill! 🍽️";
    } else if (input.includes("spending") || input.includes("month")) {
      response = `This month you've spent ₹45,600 across ${userData.totalTransactions} transactions. Top categories: Dining (₹12,400), Online Shopping (₹8,900), Fuel (₹6,700). You've optimized ${userData.optimizedTransactions} transactions and saved ₹${userData.monthlySavings}! 📊`;
    } else if (input.includes("bill") || input.includes("due")) {
      response = "Your HDFC Millennia bill of ₹23,450 is due on 15th Aug (5 days). Your SBI SimplyCLICK bill of ₹8,900 is due on 18th Aug. Want me to set payment reminders? 💳";
    } else {
      response = "I can help you optimize your credit card usage! Try asking about:\n• Best cards for specific categories\n• Your spending patterns\n• Upcoming bill due dates\n• Reward maximization tips 🤖";
    }
    
    Alert.alert("Wisor AI", response);
    setChatInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Wisor</Text>
          <Text style={styles.greeting}>Good morning, {userData.name}</Text>
        </View>
        <View style={styles.profileIcon}>
          <Text style={styles.profileInitial}>R</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* UPI Scanner Section */}
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scannerSection}
        >
          <TouchableOpacity 
            onPress={handleScan}
            style={styles.scanButton}
            activeOpacity={0.8}
          >
            <Camera size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.scanText}>Tap to scan</Text>
          <View style={styles.cashbackRow}>
            <Zap size={18} color="#FDE047" />
            <Text style={styles.cashbackText}>Get 5%* cashback on scan & pay</Text>
          </View>
        </LinearGradient>

        {/* Insights Cards */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Your Smart Insights</Text>
          
          <View style={styles.insightsGrid}>
            {/* Monthly Savings */}
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightCard}
            >
              <TrendingUp size={24} color="white" />
              <Text style={styles.cardAmount}>₹{userData.monthlySavings.toLocaleString()}</Text>
              <Text style={styles.cardLabel}>Saved this month</Text>
              <Text style={styles.cardTrend}>↗ 23% vs last month</Text>
            </LinearGradient>

            {/* Total Rewards */}
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightCard}
            >
              <Award size={24} color="white" />
              <Text style={styles.cardAmount}>₹{userData.totalRewards.toLocaleString()}</Text>
              <Text style={styles.cardLabel}>Total rewards</Text>
              <Text style={styles.cardTrend}>Since joining Wisor</Text>
            </LinearGradient>

            {/* Smart Decisions */}
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightCard}
            >
              <BarChart3 size={24} color="white" />
              <Text style={styles.cardAmount}>{userData.optimizedTransactions}/{userData.totalTransactions}</Text>
              <Text style={styles.cardLabel}>Optimized</Text>
              <Text style={styles.cardTrend}>This month</Text>
            </LinearGradient>

            {/* Missed Opportunities */}
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightCard}
            >
              <AlertCircle size={24} color="white" />
              <Text style={styles.cardAmount}>₹{userData.missedSavings.toLocaleString()}</Text>
              <Text style={styles.cardLabel}>Could save</Text>
              <Text style={styles.cardTrend}>Better card choices</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.merchantIconContainer}>
                    <Smartphone size={16} color="#3B82F6" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.merchantName}>{transaction.merchant}</Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>
                </View>
                <View style={styles.transactionMeta}>
                  <Text style={styles.transactionAmount}>₹{transaction.amount.toLocaleString()} • {transaction.cardUsed}</Text>
                  {transaction.optimized ? (
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                      <Text style={[styles.statusText, { color: '#059669' }]}>
                        Optimized - Saved ₹{transaction.saved}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[styles.statusText, { color: '#D97706' }]}>
                        Could save ₹{transaction.couldSave} with {transaction.recommendedCard}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* AI Chat Interface */}
        <View style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Ask Wisor AI</Text>
          
          {/* Quick Questions */}
          <View style={styles.quickQuestions}>
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setChatInput(question)}
                style={styles.quickQuestionButton}
                activeOpacity={0.7}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chat Input */}
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask me anything about your cards or spending..."
              placeholderTextColor="#9CA3AF"
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={handleChatSubmit}
            />
            <TouchableOpacity
              onPress={handleChatSubmit}
              style={styles.sendButton}
              activeOpacity={0.8}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scannerSection: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  scanButton: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  cashbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashbackText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  insightsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  insightCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 2,
  },
  cardTrend: {
    fontSize: 12,
    color: 'white',
    opacity: 0.75,
    marginTop: 4,
  },
  activitySection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchantIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionMeta: {
    marginLeft: 44,
  },
  transactionAmount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatSection: {
    marginTop: 24,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickQuestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickQuestionText: {
    color: '#1D4ED8',
    fontSize: 14,
  },
  chatInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WisorHomeScreen;