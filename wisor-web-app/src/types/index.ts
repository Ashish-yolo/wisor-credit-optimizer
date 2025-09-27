export interface User {
  id: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  card_name: string;
  network?: string;  // Optional since you might not have this for existing cards
  card_last4: string;  // Matches your column name
  created_at: string;
  updated_at?: string;  // Optional since you might not have this for existing cards
}

export interface CardNetwork {
  id: string;
  name: string;
  value: string;
}

export interface IndianBankCard {
  id: string;
  name: string;
  bank: string;
  type: string;
}

export interface AuthSession {
  user: User | null;
  isLoading: boolean;
}

export interface OTPVerificationResponse {
  success: boolean;
  message: string;
  user?: User;
}