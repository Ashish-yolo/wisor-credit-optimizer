const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user-specific subdirectory
    const userDir = path.join(uploadDir, req.user?.id || 'anonymous');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    const filename = `statement_${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const allowedExtensions = ['.pdf', '.csv', '.xls', '.xlsx'];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, CSV, and Excel files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Max 5 files per upload
  },
  fileFilter: fileFilter
});

// Middleware for handling upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: `File size must be less than ${(parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 5 files allowed per upload'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Please upload files using the correct field name'
      });
    }
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message
    });
  }

  next(err);
};

// Clean up old files (call periodically)
const cleanupOldFiles = (maxAgeHours = 24) => {
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  const now = Date.now();

  const cleanDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        cleanDirectory(filePath);
        // Remove empty directories
        try {
          const remaining = fs.readdirSync(filePath);
          if (remaining.length === 0) {
            fs.rmdirSync(filePath);
          }
        } catch (error) {
          // Directory not empty or other error, ignore
        }
      } else {
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        } catch (error) {
          console.error(`Error cleaning up file ${filePath}:`, error.message);
        }
      }
    });
  };

  cleanDirectory(uploadDir);
};

// Validate uploaded file
const validateFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Check file extension
  const allowedExtensions = ['.pdf', '.csv', '.xls', '.xlsx'];
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} not allowed`);
  }

  // Check if file exists and is readable
  if (file.path && fs.existsSync(file.path)) {
    try {
      fs.accessSync(file.path, fs.constants.R_OK);
    } catch (error) {
      errors.push('File is not readable');
    }
  } else {
    errors.push('File does not exist');
  }

  return errors;
};

// Get file info
const getFileInfo = (file) => {
  if (!file || !fs.existsSync(file.path)) {
    return null;
  }

  const stats = fs.statSync(file.path);
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    uploadDate: stats.birthtime,
    extension: path.extname(file.originalname).toLowerCase()
  };
};

// Delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  upload,
  handleUploadError,
  cleanupOldFiles,
  validateFile,
  getFileInfo,
  deleteFile
};