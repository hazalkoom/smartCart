const asyncHandler = require('../utils/asyncHandler');
const { COUNTRIES } = require('../constants/countries');

const getCountries = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    count: COUNTRIES.length,
    data: COUNTRIES,
  });
});

module.exports = {
  getCountries,
};