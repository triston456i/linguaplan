const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');

if (!fs.existsSync(configPath)) {
  throw new Error('config.json not found. Copy config.example.json to config.json and edit it.');
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!config.photoRoot || !fs.existsSync(config.photoRoot)) {
  throw new Error(`photoRoot "${config.photoRoot}" does not exist or is not configured. Edit config.json.`);
}

if (!config.sessionSecret || config.sessionSecret === 'replace-with-a-long-random-string') {
  throw new Error('Set a real sessionSecret in config.json before starting the server.');
}

module.exports = {
  photoRoot: path.resolve(config.photoRoot),
  port: config.port || 8080,
  sessionSecret: config.sessionSecret,
};
