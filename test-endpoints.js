// Test script for API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoint(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: () => true, // Don't throw on error status codes
  };

  if (body) {
    options.data = body;
  }

  try {
    console.log(`Testing ${method} ${url}...`);
    const response = await axios(`${BASE_URL}${url}`, options);
    const status = response.status;
    const data = response.data;
    
    console.log(`Status: ${status}`);
    console.log('Response:', data);
    console.log('-----------------------------------');
    
    return { status, data };
  } catch (error) {
    console.error(`Error testing ${method} ${url}:`, error.message);
    console.log('-----------------------------------');
    return { status: 'ERROR', error: error.message };
  }
}

async function runTests() {
  console.log('Starting API endpoint tests...\n');

  // Test products endpoints
  await testEndpoint('/products');
  await testEndpoint('/products?category=Electronics');
  await testEndpoint('/products?minPrice=10&maxPrice=100');
  
  // Test individual product endpoint
  const productsResponse = await testEndpoint('/products');
  if (productsResponse.data && productsResponse.data.products && productsResponse.data.products.length > 0) {
    const firstProductId = productsResponse.data.products[0].id;
    await testEndpoint(`/products/${firstProductId}`);
  }
  
  // Test categories endpoint
  await testEndpoint('/products/categories');
  
  // Test price ranges endpoint
  await testEndpoint('/products/price-ranges');
  
  // Test blog endpoints
  await testEndpoint('/blog');
  
  // Test newsletter endpoint (POST)
  await testEndpoint('/newsletter', 'POST', { email: 'test@example.com' });
  
  // Test analytics endpoint
  await testEndpoint('/analytics');
  
  // Note: Cart and checkout endpoints require authentication
  console.log('Note: Cart and checkout endpoints require authentication and were not tested.');
  
  console.log('\nAPI endpoint tests completed.');
}

runTests();
