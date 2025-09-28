// LoginFlow.tsx - World-class login and download flow component
import React, { useState, useEffect, useRef } from 'react';

interface LoginFlowProps {
  onComplete: (userData: UserData) => void;
  onCancel: () => void;
}

interface UserData {
  phone: string;
  cards: CreditCard[];
  isVerified: boolean;
}

interface CreditCard {
  id: string;
  name: string;
  bank: string;
  network: string;
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  isActive: boolean;
}

type FlowStep = 'welcome' | 'phone' | 'otp' | 'addCard' | 'success';

const LoginFlow: React.FC<LoginFlowProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [animationClass, setAnimationClass] = useState('slide-in');
  
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (currentStep === 'phone' && phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, [currentStep]);

  // Handle step transitions with animation
  const transitionToStep = (nextStep: FlowStep) => {
    setAnimationClass('slide-out');
    setTimeout(() => {
      setCurrentStep(nextStep);
      setAnimationClass('slide-in');
      setError('');
    }, 200);
  };

  // Handle phone number submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check for demo numbers
      if (phoneNumber === '9999999999' || phoneNumber === '1234567890') {
        // Auto-fill OTP for demo
        setTimeout(() => {
          setOtpCode('123456');
          // Auto-advance after showing OTP
          setTimeout(() => {
            transitionToStep('addCard');
          }, 2000);
        }, 1000);
      }
      
      transitionToStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (otpCode === '123456' || otpCode === '000000') {
        transitionToStep('addCard');
      } else {
        setError('Invalid OTP. For demo, use 123456');
        setOtpCode('');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = otpCode.split('');
    newOtp[index] = value;
    setOtpCode(newOtp.join(''));
    
    // Auto-advance to next input
    if (value && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace in OTP
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Add a card
  const handleAddCard = (cardData: Partial<CreditCard>) => {
    const newCard: CreditCard = {
      id: Date.now().toString(),
      name: cardData.name || '',
      bank: cardData.bank || '',
      network: cardData.network || 'Visa',
      lastFour: cardData.lastFour || '',
      expiryMonth: cardData.expiryMonth || '',
      expiryYear: cardData.expiryYear || '',
      isActive: true
    };
    
    setCards(prev => [...prev, newCard]);
  };

  // Complete flow
  const handleComplete = () => {
    const userData: UserData = {
      phone: phoneNumber,
      cards: cards,
      isVerified: true
    };
    
    // Store data securely
    chrome.storage.local.set({ wisorUserData: userData });
    
    transitionToStep('success');
    
    setTimeout(() => {
      onComplete(userData);
    }, 2000);
  };

  // Render welcome screen
  const renderWelcome = () => (
    <div className={`flow-step ${animationClass}`}>
      <div className="welcome-header">
        <div className="wisor-logo-large">
          <span className="logo-icon">💳</span>
          <h1>Welcome to Wisor</h1>
        </div>
        <p className="welcome-subtitle">
          Your AI-powered credit card optimization assistant
        </p>
      </div>
      
      <div className="feature-highlights">
        <div className="feature">
          <span className="feature-icon">🤖</span>
          <div>
            <h3>AI Recommendations</h3>
            <p>Smart card suggestions for every purchase</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">🔥</span>
          <div>
            <h3>Live Offer Detection</h3>
            <p>Automatically finds the best deals</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">💰</span>
          <div>
            <h3>Maximize Savings</h3>
            <p>Save thousands every year</p>
          </div>
        </div>
      </div>
      
      <div className="welcome-actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={() => transitionToStep('phone')}
        >
          Get Started
          <span className="btn-arrow">→</span>
        </button>
        <button 
          className="btn btn-text"
          onClick={onCancel}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );

  // Render phone input screen
  const renderPhoneInput = () => (
    <div className={`flow-step ${animationClass}`}>
      <div className="step-header">
        <h2>Enter Your Phone Number</h2>
        <p>We'll send you a verification code</p>
      </div>
      
      <div className="demo-notice">
        <div className="demo-badge">Demo Mode</div>
        <p>Use <strong>9999999999</strong> or <strong>1234567890</strong> for instant demo</p>
      </div>
      
      <form onSubmit={handlePhoneSubmit} className="input-form">
        <div className="phone-input-container">
          <div className="country-code">🇮🇳 +91</div>
          <input
            ref={phoneInputRef}
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9999999999"
            className="phone-input"
            maxLength={10}
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={isLoading || phoneNumber.length !== 10}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Sending OTP...
            </>
          ) : (
            'Send OTP'
          )}
        </button>
      </form>
      
      <button 
        className="btn btn-text"
        onClick={() => transitionToStep('welcome')}
        disabled={isLoading}
      >
        ← Back
      </button>
    </div>
  );

  // Render OTP verification screen
  const renderOtpInput = () => (
    <div className={`flow-step ${animationClass}`}>
      <div className="step-header">
        <h2>Enter Verification Code</h2>
        <p>We sent a 6-digit code to +91 {phoneNumber}</p>
      </div>
      
      <form onSubmit={handleOtpSubmit} className="input-form">
        <div className="otp-container">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              ref={el => otpInputsRef.current[index] = el}
              type="text"
              value={otpCode[index] || ''}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="otp-input"
              maxLength={1}
              inputMode="numeric"
            />
          ))}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={isLoading || otpCode.length !== 6}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>
      </form>
      
      <div className="otp-actions">
        <button className="btn btn-text">Resend Code</button>
        <button 
          className="btn btn-text"
          onClick={() => transitionToStep('phone')}
          disabled={isLoading}
        >
          Change Number
        </button>
      </div>
    </div>
  );

  // Render add card screen
  const renderAddCard = () => (
    <div className={`flow-step ${animationClass}`}>
      <div className="step-header">
        <h2>Add Your Credit Card</h2>
        <p>Add at least one card to get personalized recommendations</p>
      </div>
      
      <div className="cards-preview">
        {cards.map(card => (
          <div key={card.id} className="card-preview">
            <span className="card-icon">💳</span>
            <div className="card-info">
              <div className="card-name">{card.name}</div>
              <div className="card-details">{card.bank} •••• {card.lastFour}</div>
            </div>
          </div>
        ))}
      </div>
      
      <AddCardForm onAddCard={handleAddCard} />
      
      <div className="card-actions">
        {cards.length > 0 && (
          <button 
            className="btn btn-primary btn-full"
            onClick={handleComplete}
          >
            Continue with {cards.length} card{cards.length > 1 ? 's' : ''}
            <span className="btn-arrow">→</span>
          </button>
        )}
        
        <button 
          className="btn btn-text"
          onClick={() => transitionToStep('otp')}
        >
          ← Back
        </button>
      </div>
    </div>
  );

  // Render success screen
  const renderSuccess = () => (
    <div className={`flow-step ${animationClass}`}>
      <div className="success-animation">
        <div className="success-icon">✅</div>
        <h2>You're All Set!</h2>
        <p>Welcome to Wisor - your credit card optimization journey begins now</p>
      </div>
      
      <div className="success-stats">
        <div className="stat">
          <span className="stat-number">{cards.length}</span>
          <span className="stat-label">Cards Added</span>
        </div>
        <div className="stat">
          <span className="stat-number">∞</span>
          <span className="stat-label">Savings Potential</span>
        </div>
      </div>
      
      <div className="download-section">
        <h3>🔗 Your Wisor Link is Ready!</h3>
        <div className="download-actions">
          <button className="btn btn-primary btn-full download-btn">
            <span className="download-icon">📱</span>
            Download Wisor Link
          </button>
          <p className="download-note">
            Install this link to access Wisor from anywhere
          </p>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="login-flow-overlay">
      <div className="login-flow-container">
        <div className="flow-progress">
          <div className={`progress-step ${currentStep === 'welcome' ? 'active' : currentStep !== 'welcome' ? 'completed' : ''}`}></div>
          <div className={`progress-step ${currentStep === 'phone' ? 'active' : ['otp', 'addCard', 'success'].includes(currentStep) ? 'completed' : ''}`}></div>
          <div className={`progress-step ${currentStep === 'otp' ? 'active' : ['addCard', 'success'].includes(currentStep) ? 'completed' : ''}`}></div>
          <div className={`progress-step ${currentStep === 'addCard' ? 'active' : currentStep === 'success' ? 'completed' : ''}`}></div>
        </div>
        
        <div className="flow-content">
          {currentStep === 'welcome' && renderWelcome()}
          {currentStep === 'phone' && renderPhoneInput()}
          {currentStep === 'otp' && renderOtpInput()}
          {currentStep === 'addCard' && renderAddCard()}
          {currentStep === 'success' && renderSuccess()}
        </div>
        
        <button 
          className="flow-close"
          onClick={onCancel}
          disabled={isLoading}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Add Card Form Component
const AddCardForm: React.FC<{ onAddCard: (card: Partial<CreditCard>) => void }> = ({ onAddCard }) => {
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    lastFour: '',
    expiryMonth: '',
    expiryYear: ''
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  // Predefined cards for quick selection
  const popularCards = [
    { name: 'HDFC Millennia', bank: 'HDFC Bank' },
    { name: 'SBI SimplyCLICK', bank: 'State Bank of India' },
    { name: 'ICICI Amazon Pay', bank: 'ICICI Bank' },
    { name: 'Axis Flipkart', bank: 'Axis Bank' },
    { name: 'Kotak League Platinum', bank: 'Kotak Mahindra Bank' }
  ];

  const handleQuickAdd = (card: { name: string; bank: string }) => {
    const dummyCard = {
      ...card,
      lastFour: Math.random().toString().slice(2, 6),
      expiryMonth: '12',
      expiryYear: '25'
    };
    onAddCard(dummyCard);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.bank && formData.lastFour) {
      onAddCard(formData);
      setFormData({
        name: '',
        bank: '',
        lastFour: '',
        expiryMonth: '',
        expiryYear: ''
      });
      setIsExpanded(false);
    }
  };

  return (
    <div className="add-card-form">
      <div className="quick-add-section">
        <h4>Quick Add Popular Cards</h4>
        <div className="popular-cards-grid">
          {popularCards.map((card, index) => (
            <button
              key={index}
              className="popular-card-btn"
              onClick={() => handleQuickAdd(card)}
            >
              <span className="card-icon">💳</span>
              <div className="card-info">
                <div className="card-name">{card.name}</div>
                <div className="card-bank">{card.bank}</div>
              </div>
              <span className="add-icon">+</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="manual-add-section">
        <button 
          className="expand-manual-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          Add Custom Card {isExpanded ? '−' : '+'}
        </button>
        
        {isExpanded && (
          <form onSubmit={handleManualAdd} className="manual-card-form">
            <input
              type="text"
              placeholder="Card Name (e.g., HDFC Regalia)"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Bank Name"
              value={formData.bank}
              onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Last 4 digits"
              value={formData.lastFour}
              onChange={(e) => setFormData(prev => ({ ...prev, lastFour: e.target.value.slice(0, 4) }))}
              maxLength={4}
              required
            />
            <div className="expiry-inputs">
              <select
                value={formData.expiryMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                required
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                    {String(i + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={formData.expiryYear}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryYear: e.target.value }))}
                required
              >
                <option value="">Year</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={String(year).slice(2)}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <button type="submit" className="btn btn-secondary btn-full">
              Add Card
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginFlow;