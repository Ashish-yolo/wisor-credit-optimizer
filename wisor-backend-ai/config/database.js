const mongoose = require('mongoose');
const redis = require('redis');

class DatabaseService {
  constructor() {
    this.mongoConnection = null;
    this.redisClient = null;
    this.isMongoConnected = false;
    this.isRedisConnected = false;
  }

  // Initialize MongoDB connection
  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wisor-ai';
      
      this.mongoConnection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isMongoConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isMongoConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.isMongoConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isMongoConnected = true;
      });

      return this.mongoConnection;

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isMongoConnected = false;
      throw error;
    }
  }

  // Initialize Redis connection
  async connectRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redisClient = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('❌ Redis server refused the connection');
            return new Error('Redis server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('❌ Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('❌ Redis max retry attempts reached');
            return undefined;
          }
          // Reconnect after
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redisClient.on('error', (error) => {
        console.error('❌ Redis connection error:', error.message);
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isRedisConnected = true;
      });

      this.redisClient.on('disconnect', () => {
        console.warn('⚠️ Redis disconnected');
        this.isRedisConnected = false;
      });

      await this.redisClient.connect();
      return this.redisClient;

    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.isRedisConnected = false;
      // Don't throw error for Redis as it's optional for basic functionality
      console.warn('⚠️ Continuing without Redis cache');
      return null;
    }
  }

  // Initialize all database connections
  async connectAll() {
    const results = {
      mongodb: false,
      redis: false,
      errors: []
    };

    // Connect to MongoDB
    try {
      await this.connectMongoDB();
      results.mongodb = true;
    } catch (error) {
      results.errors.push({ service: 'mongodb', error: error.message });
    }

    // Connect to Redis
    try {
      await this.connectRedis();
      results.redis = this.isRedisConnected;
    } catch (error) {
      results.errors.push({ service: 'redis', error: error.message });
    }

    return results;
  }

  // Close all connections
  async closeAll() {
    const results = {
      mongodb: false,
      redis: false,
      errors: []
    };

    // Close MongoDB
    if (this.mongoConnection) {
      try {
        await mongoose.connection.close();
        this.isMongoConnected = false;
        results.mongodb = true;
        console.log('✅ MongoDB connection closed');
      } catch (error) {
        results.errors.push({ service: 'mongodb', error: error.message });
      }
    }

    // Close Redis
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.isRedisConnected = false;
        results.redis = true;
        console.log('✅ Redis connection closed');
      } catch (error) {
        results.errors.push({ service: 'redis', error: error.message });
      }
    }

    return results;
  }

  // Get connection status
  getStatus() {
    return {
      mongodb: {
        connected: this.isMongoConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      redis: {
        connected: this.isRedisConnected,
        status: this.redisClient ? this.redisClient.isReady : false
      }
    };
  }

  // Health check for all databases
  async healthCheck() {
    const health = {
      mongodb: { status: 'unhealthy', details: null },
      redis: { status: 'unhealthy', details: null },
      overall: 'unhealthy'
    };

    // MongoDB health check
    if (this.isMongoConnected) {
      try {
        await mongoose.connection.db.admin().ping();
        health.mongodb = {
          status: 'healthy',
          details: {
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
          }
        };
      } catch (error) {
        health.mongodb = {
          status: 'unhealthy',
          details: { error: error.message }
        };
      }
    }

    // Redis health check
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.ping();
        health.redis = {
          status: 'healthy',
          details: {
            connected: this.redisClient.isReady,
            serverInfo: await this.redisClient.info('server')
          }
        };
      } catch (error) {
        health.redis = {
          status: 'unhealthy',
          details: { error: error.message }
        };
      }
    }

    // Overall health
    health.overall = (health.mongodb.status === 'healthy') ? 'healthy' : 'partial';
    
    return health;
  }

  // Cache operations (Redis)
  async setCache(key, value, expireInSeconds = 3600) {
    if (!this.isRedisConnected || !this.redisClient) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redisClient.setEx(key, expireInSeconds, serializedValue);
      return true;
    } catch (error) {
      console.error('❌ Cache set error:', error.message);
      return false;
    }
  }

  async getCache(key) {
    if (!this.isRedisConnected || !this.redisClient) {
      return null;
    }

    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Cache get error:', error.message);
      return null;
    }
  }

  async deleteCache(key) {
    if (!this.isRedisConnected || !this.redisClient) {
      return false;
    }

    try {
      const result = await this.redisClient.del(key);
      return result > 0;
    } catch (error) {
      console.error('❌ Cache delete error:', error.message);
      return false;
    }
  }

  async clearCache(pattern = '*') {
    if (!this.isRedisConnected || !this.redisClient) {
      return false;
    }

    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('❌ Cache clear error:', error.message);
      return false;
    }
  }

  // Session operations (Redis)
  async setSession(sessionId, sessionData, expireInSeconds = 86400) {
    return this.setCache(`session:${sessionId}`, sessionData, expireInSeconds);
  }

  async getSession(sessionId) {
    return this.getCache(`session:${sessionId}`);
  }

  async deleteSession(sessionId) {
    return this.deleteCache(`session:${sessionId}`);
  }

  // Rate limiting operations (Redis)
  async checkRateLimit(identifier, maxRequests, windowInSeconds) {
    if (!this.isRedisConnected || !this.redisClient) {
      return { allowed: true, remaining: maxRequests };
    }

    try {
      const key = `ratelimit:${identifier}`;
      const current = await this.redisClient.incr(key);
      
      if (current === 1) {
        await this.redisClient.expire(key, windowInSeconds);
      }

      const remaining = Math.max(0, maxRequests - current);
      const allowed = current <= maxRequests;

      return { allowed, remaining, current };
    } catch (error) {
      console.error('❌ Rate limit check error:', error.message);
      return { allowed: true, remaining: maxRequests };
    }
  }

  // Get MongoDB client
  getMongoClient() {
    return this.mongoConnection;
  }

  // Get Redis client
  getRedisClient() {
    return this.redisClient;
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;