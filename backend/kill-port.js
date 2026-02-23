// kill-port.js - Kill processes on port 5000
const { execSync } = require('child_process');
const os = require('os');

const PORT = 5000;

try {
  if (os.platform() === 'win32') {
    // Windows
    const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
    const lines = result.split('\n').filter(line => line.includes('LISTENING'));
    if (lines.length > 0) {
      const pid = lines[0].trim().split(/\s+/).pop();
      if (pid && pid !== 'PID') {
        console.log(`🔪 Killing process on port ${PORT} (PID: ${pid})`);
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
        console.log(`✅ Port ${PORT} freed`);
      }
    }
  } else {
    // macOS/Linux
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'inherit' });
    console.log(`✅ Port ${PORT} freed`);
  }
} catch (err) {
  // Silently fail if port is already free
  console.log(`ℹ️ Port ${PORT} is already available`);
}
