const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const moment = require('moment');

class StatementParser {
  constructor() {
    this.processingStatus = new Map(); // Track processing status
    this.parseResults = new Map(); // Store parse results
  }

  // Parse statement file based on type
  async parseStatement(userId, fileId, options = {}) {
    const startTime = Date.now();
    
    try {
      // Update processing status
      this.updateProcessingStatus(userId, fileId, 'processing', 0);

      // Find the file
      const filePath = this.getFilePath(userId, fileId);
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const fileExtension = path.extname(filePath).toLowerCase();
      let parseResult;

      // Parse based on file type
      switch (fileExtension) {
        case '.pdf':
          parseResult = await this.parsePDF(filePath, options);
          break;
        case '.csv':
          parseResult = await this.parseCSV(filePath, options);
          break;
        case '.xls':
        case '.xlsx':
          parseResult = await this.parseExcel(filePath, options);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Process and categorize transactions
      const processedTransactions = this.processTransactions(parseResult.transactions, options);
      
      // Generate summary
      const summary = this.generateSummary(processedTransactions);

      const result = {
        success: true,
        transactions: processedTransactions,
        summary,
        metadata: {
          fileId,
          fileName: path.basename(filePath),
          fileType: fileExtension,
          totalTransactions: processedTransactions.length,
          dateRange: {
            from: processedTransactions.length > 0 ? processedTransactions[0].date : null,
            to: processedTransactions.length > 0 ? processedTransactions[processedTransactions.length - 1].date : null
          },
          processingTime: Date.now() - startTime
        },
        processingTime: Date.now() - startTime
      };

      // Store result and update status
      this.parseResults.set(`${userId}:${fileId}`, result);
      this.updateProcessingStatus(userId, fileId, 'completed', 100);

      return result;

    } catch (error) {
      console.error(`Parsing error for ${fileId}:`, error);
      this.updateProcessingStatus(userId, fileId, 'error', 0, error.message);
      
      return {
        success: false,
        error: error.message,
        details: error.stack,
        processingTime: Date.now() - startTime
      };
    }
  }

  // Parse PDF statement
  async parsePDF(filePath, options) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      return this.extractTransactionsFromText(data.text, options);
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  // Parse CSV statement
  async parseCSV(filePath, options) {
    return new Promise((resolve, reject) => {
      const transactions = [];
      const headers = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (row) => {
          try {
            const transaction = this.mapCSVRowToTransaction(row, headers);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            console.warn('Error parsing CSV row:', error.message);
          }
        })
        .on('end', () => {
          resolve({
            transactions: transactions.sort((a, b) => new Date(a.date) - new Date(b.date)),
            headers
          });
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  // Parse Excel statement
  async parseExcel(filePath, options) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        throw new Error('Excel file must have at least header and one data row');
      }

      const headers = data[0];
      const transactions = [];

      // Process each row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
          try {
            const rowObject = {};
            headers.forEach((header, index) => {
              rowObject[header] = row[index];
            });
            
            const transaction = this.mapCSVRowToTransaction(rowObject, headers);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            console.warn('Error parsing Excel row:', error.message);
          }
        }
      }

      return {
        transactions: transactions.sort((a, b) => new Date(a.date) - new Date(b.date)),
        headers
      };

    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  // Extract transactions from PDF text
  extractTransactionsFromText(text, options) {
    const transactions = [];
    const lines = text.split('\n');
    
    // Common patterns for Indian credit card statements
    const transactionPatterns = [
      // DD/MM/YYYY DESCRIPTION AMOUNT
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*$/,
      // DD-MM-YYYY DESCRIPTION AMOUNT
      /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s*$/,
      // YYYY-MM-DD DESCRIPTION AMOUNT
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d,]+\.?\d*)\s*$/,
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 10) continue; // Skip short lines

      for (const pattern of transactionPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          try {
            const [, dateStr, description, amountStr] = match;
            
            // Parse date
            const date = moment(dateStr, ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD');
            if (!moment(date).isValid()) continue;

            // Parse amount
            const amount = parseFloat(amountStr.replace(/,/g, ''));
            if (isNaN(amount)) continue;

            // Clean description
            const cleanDescription = description.trim().replace(/\s+/g, ' ');
            if (cleanDescription.length < 3) continue;

            transactions.push({
              date,
              description: cleanDescription,
              amount,
              rawLine: trimmedLine
            });
          } catch (error) {
            console.warn('Error parsing transaction line:', error.message);
          }
          break;
        }
      }
    }

    return { transactions, rawText: text };
  }

  // Map CSV row to transaction object
  mapCSVRowToTransaction(row, headers) {
    // Common column name variations
    const dateColumns = ['date', 'transaction date', 'txn date', 'posting date', 'trans date'];
    const descColumns = ['description', 'transaction description', 'txn description', 'merchant', 'details'];
    const amountColumns = ['amount', 'transaction amount', 'txn amount', 'debit', 'credit'];

    // Find matching columns (case insensitive)
    const findColumn = (possibleNames) => {
      return headers.find(header => 
        possibleNames.some(name => 
          header.toLowerCase().includes(name.toLowerCase())
        )
      );
    };

    const dateCol = findColumn(dateColumns);
    const descCol = findColumn(descColumns);
    const amountCol = findColumn(amountColumns);

    if (!dateCol || !descCol || !amountCol) {
      return null; // Skip if essential columns not found
    }

    try {
      // Parse date
      let date = moment(row[dateCol], [
        'DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 
        'MM/DD/YYYY', 'DD/MM/YY', 'DD-MM-YY'
      ]);
      
      if (!date.isValid()) {
        return null;
      }

      // Parse amount
      let amount = row[amountCol];
      if (typeof amount === 'string') {
        amount = parseFloat(amount.replace(/[,₹$]/g, ''));
      }
      if (isNaN(amount)) {
        return null;
      }

      // Clean description
      const description = String(row[descCol] || '').trim();
      if (description.length < 2) {
        return null;
      }

      return {
        date: date.format('YYYY-MM-DD'),
        description,
        amount: Math.abs(amount), // Ensure positive amount
        category: 'uncategorized', // Will be categorized later
        rawData: row
      };

    } catch (error) {
      return null;
    }
  }

  // Process and categorize transactions
  processTransactions(transactions, options) {
    return transactions.map(transaction => {
      // Add category
      const category = this.categorizeTransaction(transaction.description);
      
      // Add additional fields
      return {
        ...transaction,
        category,
        merchant: this.extractMerchant(transaction.description),
        transactionId: this.generateTransactionId(transaction),
        isRecurring: this.isRecurringTransaction(transaction, transactions)
      };
    });
  }

  // Categorize transaction based on description
  categorizeTransaction(description) {
    const desc = description.toLowerCase();
    
    const categories = {
      'food': ['restaurant', 'food', 'zomato', 'swiggy', 'dominos', 'mcdonald', 'cafe', 'dine'],
      'fuel': ['petrol', 'fuel', 'gas', 'hp', 'ioc', 'bharat petroleum', 'shell'],
      'grocery': ['grocery', 'supermarket', 'store', 'mart', 'big bazaar', 'dmart', 'reliance'],
      'shopping': ['amazon', 'flipkart', 'myntra', 'shopping', 'mall', 'store'],
      'entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game', 'entertainment'],
      'travel': ['uber', 'ola', 'flight', 'hotel', 'booking', 'makemytrip', 'railway'],
      'utilities': ['electricity', 'water', 'gas', 'internet', 'mobile', 'phone', 'broadband'],
      'medical': ['hospital', 'medical', 'pharmacy', 'doctor', 'clinic', 'health'],
      'atm': ['atm', 'cash withdrawal'],
      'transfer': ['transfer', 'imps', 'neft', 'rtgs', 'upi'],
      'insurance': ['insurance', 'premium', 'policy'],
      'investment': ['mutual fund', 'sip', 'investment', 'trading']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }

    return 'others';
  }

  // Extract merchant name from description
  extractMerchant(description) {
    // Remove common prefixes and suffixes
    let merchant = description
      .replace(/^(POS|ATM|UPI|IMPS|NEFT|RTGS)\s*/i, '')
      .replace(/\s*(INDIA|PVT LTD|LIMITED|LTD)$/i, '')
      .replace(/\s*-.*$/, '') // Remove everything after dash
      .trim();

    // Take first 3 words maximum
    const words = merchant.split(' ').slice(0, 3);
    return words.join(' ');
  }

  // Generate unique transaction ID
  generateTransactionId(transaction) {
    const hash = require('crypto')
      .createHash('md5')
      .update(transaction.date + transaction.description + transaction.amount)
      .digest('hex');
    return hash.substring(0, 8);
  }

  // Check if transaction is recurring
  isRecurringTransaction(transaction, allTransactions) {
    const similarTransactions = allTransactions.filter(t => 
      t.description === transaction.description && 
      Math.abs(t.amount - transaction.amount) < 1 &&
      t.date !== transaction.date
    );
    
    return similarTransactions.length > 0;
  }

  // Generate summary statistics
  generateSummary(transactions) {
    if (transactions.length === 0) {
      return { totalTransactions: 0, totalAmount: 0, categories: {} };
    }

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const categories = {};
    
    // Group by category
    transactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = {
          count: 0,
          amount: 0,
          percentage: 0
        };
      }
      categories[transaction.category].count++;
      categories[transaction.category].amount += transaction.amount;
    });

    // Calculate percentages
    Object.keys(categories).forEach(category => {
      categories[category].percentage = Math.round(
        (categories[category].amount / totalAmount) * 100
      );
    });

    return {
      totalTransactions: transactions.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      avgTransactionAmount: Math.round((totalAmount / transactions.length) * 100) / 100,
      categories,
      dateRange: {
        from: transactions[0]?.date,
        to: transactions[transactions.length - 1]?.date
      },
      topMerchants: this.getTopMerchants(transactions, 5)
    };
  }

  // Get top merchants by spending
  getTopMerchants(transactions, limit = 5) {
    const merchantSpending = {};
    
    transactions.forEach(t => {
      if (!merchantSpending[t.merchant]) {
        merchantSpending[t.merchant] = { amount: 0, count: 0 };
      }
      merchantSpending[t.merchant].amount += t.amount;
      merchantSpending[t.merchant].count++;
    });

    return Object.entries(merchantSpending)
      .sort(([,a], [,b]) => b.amount - a.amount)
      .slice(0, limit)
      .map(([merchant, data]) => ({
        merchant,
        amount: Math.round(data.amount * 100) / 100,
        transactions: data.count
      }));
  }

  // Get file path for user and fileId
  getFilePath(userId, fileId) {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const userDir = path.join(uploadDir, userId);
    
    if (!fs.existsSync(userDir)) {
      return null;
    }

    const files = fs.readdirSync(userDir);
    const targetFile = files.find(file => file.startsWith(fileId) || file === fileId);
    
    return targetFile ? path.join(userDir, targetFile) : null;
  }

  // Update processing status
  updateProcessingStatus(userId, fileId, status, progress, error = null) {
    const key = `${userId}:${fileId}`;
    this.processingStatus.set(key, {
      status, // 'processing', 'completed', 'error'
      progress, // 0-100
      error,
      lastUpdated: new Date().toISOString()
    });
  }

  // Get processing status
  getProcessingStatus(userId, fileId) {
    const key = `${userId}:${fileId}`;
    return this.processingStatus.get(key) || null;
  }

  // Get parse result
  getParseResult(userId, fileId) {
    const key = `${userId}:${fileId}`;
    return this.parseResults.get(key) || null;
  }

  // Delete statement and cleanup
  async deleteStatement(userId, fileId) {
    try {
      const filePath = this.getFilePath(userId, fileId);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Clean up memory
      const key = `${userId}:${fileId}`;
      this.processingStatus.delete(key);
      this.parseResults.delete(key);

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  // List user's statements
  async listUserStatements(userId) {
    try {
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      const userDir = path.join(uploadDir, userId);
      
      if (!fs.existsSync(userDir)) {
        return [];
      }

      const files = fs.readdirSync(userDir);
      return files.map(filename => {
        const filePath = path.join(userDir, filename);
        const stats = fs.statSync(filePath);
        const key = `${userId}:${filename}`;
        const status = this.processingStatus.get(key);
        
        return {
          fileId: filename,
          originalName: filename,
          size: stats.size,
          uploadDate: stats.birthtime,
          lastModified: stats.mtime,
          status: status ? status.status : 'uploaded',
          hasParseResult: this.parseResults.has(key)
        };
      });
    } catch (error) {
      console.error('List statements error:', error);
      return [];
    }
  }
}

module.exports = new StatementParser();