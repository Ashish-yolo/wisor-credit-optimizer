# Wisor Browser Extension - Installation Guide

## Prerequisites
- Google Chrome browser (version 88+)
- Basic understanding of Chrome extension development

## Installation Steps

### 1. Download and Setup
1. Download all the files and create the directory structure as shown above
2. Place all files in a folder called `wisor-extension`
3. Create an `icons` folder and add icon files (16x16, 32x32, 48x48, 128x128 pixels)

### 2. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `wisor-extension` folder
5. The extension should now appear in your extensions list

### 3. Pin the Extension
1. Click the puzzle piece icon in Chrome toolbar
2. Find "Wisor - Smart Credit Card Assistant"
3. Click the pin icon to keep it visible

### 4. Test the Extension
1. Visit supported sites like:
   - amazon.in
   - flipkart.com
   - zomato.com
   - swiggy.com
2. Navigate to product pages or checkout
3. Look for the Wisor widget to appear
4. Click the extension icon to open the popup

## Supported Websites
- Amazon India
- Flipkart
- Myntra
- Zomato
- Swiggy
- MakeMyTrip
- Goibibo
- BookMyShow
- BigBasket
- Reliance Digital
- Croma
- Nykaa
- AJIO

## Features
- ✅ Automatic merchant detection
- ✅ Smart credit card recommendations
- ✅ Real-time benefit calculations
- ✅ Multiple card comparison
- ✅ Checkout page integration
- ✅ Card portfolio management

## Data Sources
The extension includes comprehensive data for 15+ popular Indian credit cards including:
- HDFC Bank (Millennia, Regalia)
- SBI (SimplyCLICK, Prime)
- ICICI Bank (Amazon Pay, Platinum)
- Axis Bank (Flipkart, ACE)
- Kotak Mahindra Bank
- American Express

## Privacy
- No personal financial data is stored
- Only card names and benefits are tracked
- All data stays local to your browser
- No external API calls for sensitive information

## How It Works
1. **Merchant Detection**: Automatically detects when you're on supported shopping sites
2. **Smart Analysis**: Analyzes your current cart value and merchant category
3. **Card Optimization**: Recommends the best credit card from your portfolio
4. **Real-time Updates**: Updates recommendations as you add/remove items from cart

## File Structure
```
wisor-extension/
├── manifest.json              # Extension configuration
├── background.js             # Service worker for background tasks
├── content.js               # Main content script
├── credit-cards-data.js     # Indian credit cards database
├── merchant-detector.js     # Merchant detection logic
├── recommendation-engine.js # Card recommendation algorithms
├── popup.html              # Extension popup interface
├── popup.js                # Popup functionality
├── popup.css               # Popup styling
├── wisor-overlay.css       # Widget overlay styles
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Demo Usage
1. Install the extension as described above
2. Visit amazon.in and search for any product
3. Add items to your cart and go to checkout
4. The Wisor widget should appear with card recommendations
5. Click the extension icon to manage your card portfolio

## Troubleshooting
- **Widget not appearing**: Check if you're on a supported site and have items in cart
- **No recommendations**: Make sure you've added cards to your portfolio via the popup
- **Extension not loading**: Ensure all files are in the correct directory structure

## Next Steps
- Add more Indian e-commerce sites
- Implement bank statement integration
- Add spending analytics dashboard
- Include seasonal offer notifications