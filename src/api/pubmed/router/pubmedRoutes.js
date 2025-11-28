const express = require('express');
const PubMedController = require('../controller/pubmedController.js');

const router = express.Router();

router.get('/', PubMedController.search);

module.exports = router;
