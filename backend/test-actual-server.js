import './src/server.js';

// Test after server starts
setTimeout(async () => {
  try {
    const response = await fetch('http://127.0.0.1:4101/api/v1/health');
    const data = await response.json();
    console.log('Health check response:', data);
    process.exit(0);
  } catch (e) {
    console.error('Health check failed:', e.message);
    process.exit(1);
  }
}, 2000);