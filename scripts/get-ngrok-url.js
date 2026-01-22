/* eslint-env node */
// Script to get current Ngrok URL from web interface
// Usage: node scripts/get-ngrok-url.js

import http from 'http';

const NGROK_WEB_INTERFACE = 'http://127.0.0.1:4040';

const getNgrokUrl = () => {
  return new Promise((resolve, reject) => {
    http.get(`${NGROK_WEB_INTERFACE}/api/tunnels`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.tunnels && response.tunnels.length > 0) {
            const httpsTunnel = response.tunnels.find(t => t.proto === 'https');
            if (httpsTunnel) {
              resolve(httpsTunnel.public_url);
            } else {
              resolve(response.tunnels[0].public_url);
            }
          } else {
            reject(new Error('No tunnels found. Is Ngrok running?'));
          }
        } catch {
          reject(new Error('Failed to parse Ngrok API response'));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to connect to Ngrok web interface: ${error.message}`));
    });
  });
};

// Main execution
(async () => {
  try {
    const url = await getNgrokUrl();
    console.log(url);
    process.exit(0);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    console.log('\n💡 Make sure Ngrok is running: ngrok http 3000');
    process.exit(1);
  }
})();
