const axios = require('axios');

const paymobClient = axios.create({
  baseURL: 'https://accept.paymob.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add a response interceptor to handle errors globally (Optional but recommended)
paymobClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error(
      'Paymob API Error:',
      error.response ? error.response.data : error.message
    );
    return Promise.reject(error);
  }
);

module.exports = paymobClient;