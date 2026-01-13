/* eslint-env node */
// Script to start Vite dev server with Ngrok tunnel
// Usage: npm run dev:ngrok

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VITE_PORT = process.env.VITE_PORT || 3000;
const NGROK_PORT = process.env.NGROK_PORT || VITE_PORT;

console.log('🚀 Starting development server with Ngrok...\n');

// Check if ngrok is installed
const checkNgrok = () => {
  return new Promise((resolve) => {
    const ngrokCheck = spawn('ngrok', ['version'], { shell: true });
    ngrokCheck.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error('❌ Ngrok not found. Please install Ngrok first.');
        console.log('   Visit: https://ngrok.com/download');
        resolve(false);
      }
    });
    ngrokCheck.on('error', () => {
      console.error('❌ Ngrok not found. Please install Ngrok first.');
      console.log('   Visit: https://ngrok.com/download');
      resolve(false);
    });
  });
};

// Start Vite dev server
const startVite = () => {
  console.log(`📦 Starting Vite dev server on port ${VITE_PORT}...`);
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  vite.on('error', (error) => {
    console.error('❌ Failed to start Vite:', error);
    process.exit(1);
  });

  return vite;
};

// Start Ngrok tunnel
const startNgrok = () => {
  return new Promise((resolve) => {
    console.log(`🌐 Starting Ngrok tunnel on port ${NGROK_PORT}...\n`);
    
    const ngrok = spawn('ngrok', ['http', NGROK_PORT.toString()], {
      stdio: 'pipe',
      shell: true,
    });

    let ngrokOutput = '';
    
    ngrok.stdout.on('data', (data) => {
      const output = data.toString();
      ngrokOutput += output;
      process.stdout.write(output);
      
      // Try to extract URL from output
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/);
      if (urlMatch) {
        const url = urlMatch[0];
        console.log('\n✅ Ngrok tunnel established!');
        console.log(`\n🌍 Public URL: ${url}`);
        console.log(`📊 Web Interface: http://127.0.0.1:4040\n`);
        
        // Save URL to file for other scripts
        const urlFile = path.join(process.cwd(), '.ngrok-url');
        fs.writeFileSync(urlFile, url);
      }
    });

    ngrok.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    ngrok.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ Ngrok exited with code ${code}`);
      }
    });

    // Wait a bit for ngrok to start
    setTimeout(() => {
      resolve(ngrok);
    }, 2000);
  });
};

// Main execution
(async () => {
  const hasNgrok = await checkNgrok();
  if (!hasNgrok) {
    process.exit(1);
  }

  // Start Vite
  const viteProcess = startVite();

  // Wait a bit for Vite to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start Ngrok
  const ngrokProcess = await startNgrok();

  // Handle cleanup
  const cleanup = () => {
    console.log('\n\n🛑 Shutting down...');
    viteProcess.kill();
    ngrokProcess.kill();
    
    // Clean up URL file
    const urlFile = path.join(process.cwd(), '.ngrok-url');
    if (fs.existsSync(urlFile)) {
      fs.unlinkSync(urlFile);
    }
    
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
})();
