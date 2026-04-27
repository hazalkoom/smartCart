const express = require('express');
const { getCountries } = require('../controllers/countryController');

const router = express.Router();

router.get('/', getCountries);

module.exports = router;