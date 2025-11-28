import mongoose from 'mongoose';
import loggerHelper from '../infra/logger.js';

const dbConnection = async (uri) => {
  try {
    await mongoose.connect(uri, {});
    loggerHelper.info('Connected to MongoDB');
  } catch (error) {
    loggerHelper.error('MongoDB connection error: %s', error.message);
    throw error;
  }
};

export default dbConnection;
