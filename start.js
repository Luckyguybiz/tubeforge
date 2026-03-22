require('dotenv').config();
const { spawn } = require('child_process');
const child = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], {
  stdio: 'inherit',
  env: process.env
});
child.on('exit', (code) => process.exit(code));
