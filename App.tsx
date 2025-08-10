import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { 
  Smartphone, 
  CreditCard, 
  BarChart3, 
  Award, 
  Calendar 
} from 'lucide-react-native';

// Import screens
import WisorHomeScreen from './screens/WisorHomeScreen';
import CardManagementScreen from './components/CardManagement';
import TransactionEntryScreen from './components/TransactionEntry';

const Tab = createBottomTabNavigator();

// Placeholder screens for missing components
const AnalyticsScreen = () => {
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Analytics Coming Soon! 📊</Text>
    </View>
  );
};

const RewardsScreen = () => {
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Rewards Tracking Coming Soon! 🎁</Text>
    </View>
  );
};

const styles = require('react-native').StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <ExpoStatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let IconComponent;

            if (route.name === 'Home') {
              IconComponent = Smartphone;
            } else if (route.name === 'Cards') {
              IconComponent = CreditCard;
            } else if (route.name === 'Transactions') {
              IconComponent = Calendar;
            } else if (route.name === 'Analytics') {
              IconComponent = BarChart3;
            } else if (route.name === 'Rewards') {
              IconComponent = Award;
            }

            return <IconComponent size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: '#E5E7EB',
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={WisorHomeScreen} />
        <Tab.Screen name="Cards" component={CardManagementScreen} />
        <Tab.Screen name="Transactions" component={TransactionEntryScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Rewards" component={RewardsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
