const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { upload, handleUploadError, validateFile, getFileInfo, deleteFile } = require('../middleware/upload');
const statementParser = require('../services/statementParser');
const claudeService = require('../services/claudeService');

const router = express.Router();

// Upload statement files
router.post('/upload',
  auth,
  upload.array('statements', 5), // Allow up to 5 files
  handleUploadError,
  async (req, res) => {
    try {
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded',
          message: 'Please select at least one statement file'
        });
      }

      const results = [];
      const errors = [];

      // Process each uploaded file
      for (const file of files) {
        try {
          // Validate file
          const validationErrors = validateFile(file);
          if (validationErrors.length > 0) {
            errors.push({
              filename: file.originalname,
              errors: validationErrors
            });
            deleteFile(file.path); // Clean up invalid file
            continue;
          }

          // Get file info
          const fileInfo = getFileInfo(file);
          if (!fileInfo) {
            errors.push({
              filename: file.originalname,
              errors: ['Could not read file information']
            });
            continue;
          }

          results.push({
            fileId: file.filename,
            originalName: file.originalname,
            size: fileInfo.size,
            type: fileInfo.extension,
            uploadDate: fileInfo.uploadDate,
            status: 'uploaded'
          });

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            errors: ['Processing failed: ' + error.message]
          });
          deleteFile(file.path);
        }
      }

      res.json({
        success: true,
        uploadedFiles: results,
        errors: errors.length > 0 ? errors : null,
        totalUploaded: results.length,
        totalErrors: errors.length
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error.message
      });
    }
  }
);

// Parse uploaded statement
router.post('/parse/:fileId',
  auth,
  [
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
    body('options.dateRange')
      .optional()
      .isObject()
      .withMessage('Date range must be an object'),
    body('options.categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { fileId } = req.params;
      const { options = {} } = req.body;
      const userId = req.user.id;

      // Parse the statement file
      const parseResult = await statementParser.parseStatement(userId, fileId, options);

      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Parsing failed',
          message: parseResult.error,
          details: parseResult.details
        });
      }

      res.json({
        success: true,
        fileId,
        transactions: parseResult.transactions,
        summary: parseResult.summary,
        metadata: parseResult.metadata,
        parsingTime: parseResult.processingTime
      });

    } catch (error) {
      console.error('Parse error:', error);
      res.status(500).json({
        error: 'Failed to parse statement',
        message: error.message
      });
    }
  }
);

// Analyze parsed statement with AI
router.post('/analyze/:fileId',
  auth,
  [
    body('includeRecommendations')
      .optional()
      .isBoolean()
      .withMessage('includeRecommendations must be boolean'),
    body('userCards')
      .optional()
      .isArray()
      .withMessage('userCards must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation error',
          details: errors.array()
        });
      }

      const { fileId } = req.params;
      const { includeRecommendations = true, userCards = [] } = req.body;
      const userId = req.user.id;

      // Get parsed transactions first
      const parseResult = await statementParser.getParseResult(userId, fileId);
      if (!parseResult || !parseResult.transactions) {
        return res.status(404).json({
          error: 'Statement not found',
          message: 'Please parse the statement first'
        });
      }

      // Analyze with AI
      const analysis = await claudeService.analyzeStatement(
        userId,
        parseResult.transactions,
        userCards
      );

      // Get additional insights if requested
      let recommendations = null;
      if (includeRecommendations) {
        const recommendationPrompt = `Based on this analysis, provide specific credit card recommendations for optimization:
        
        ${analysis}
        
        User's current cards: ${JSON.stringify(userCards)}
        
        Please suggest:
        1. Better cards for specific categories
        2. Optimal spending strategies
        3. Reward maximization tips`;

        const recResult = await claudeService.getFinancialAdvice(
          userId,
          recommendationPrompt,
          { userCards, transactions: parseResult.transactions }
        );
        
        recommendations = recResult.response;
      }

      res.json({
        success: true,
        fileId,
        analysis,
        recommendations,
        transactionCount: parseResult.transactions.length,
        summary: parseResult.summary,
        analyzedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze statement',
        message: error.message
      });
    }
  }
);

// Get statement processing status
router.get('/status/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const status = await statementParser.getProcessingStatus(userId, fileId);
    
    if (!status) {
      return res.status(404).json({
        error: 'File not found',
        message: 'Statement file not found or expired'
      });
    }

    res.json({
      success: true,
      fileId,
      status: status.status,
      progress: status.progress,
      error: status.error,
      lastUpdated: status.lastUpdated
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to check status',
      message: error.message
    });
  }
});

// Delete statement file
router.delete('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const deleted = await statementParser.deleteStatement(userId, fileId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'File not found',
        message: 'Statement file not found'
      });
    }

    res.json({
      success: true,
      message: 'Statement deleted successfully',
      fileId
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete statement',
      message: error.message
    });
  }
});

// List user's uploaded statements
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const statements = await statementParser.listUserStatements(userId);

    res.json({
      success: true,
      statements,
      count: statements.length
    });

  } catch (error) {
    console.error('List statements error:', error);
    res.status(500).json({
      error: 'Failed to list statements',
      message: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Statement Processing Service',
    status: 'healthy',
    supportedFormats: ['PDF', 'CSV', 'Excel'],
    maxFileSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024}MB`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;