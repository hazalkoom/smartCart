const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate a 6-digit random hex string
  const randomPart = Math.random().toString(16).substr(2, 6).toUpperCase();
  
  return `${year}-${month}-${day}-${randomPart}`;
};

module.exports = { generateOrderNumber };