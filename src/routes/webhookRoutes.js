const express = require('express');
const webhookController = require('../controllers/webhookController.js');

const router = express.Router();

router.post('/bolota', webhookController.handleWebhook);

module.exports = router;
