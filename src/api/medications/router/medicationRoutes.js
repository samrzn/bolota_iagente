const express = require('express');
const MedicationController = require('../controller/medicationController.js');

const router = express.Router();

router.get('/', MedicationController.search);

module.exports = router;
