const mongoose = require('mongoose');
const loggerInfo = require('../infra/logger.js');

const connect = async (uri) => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    loggerInfo.info('Connected to MongoDB');
  } catch (error) {
    loggerInfo.error('MongoDB connection error: %s', error.message);
    throw error;
  }
};

module.exports = connect;
