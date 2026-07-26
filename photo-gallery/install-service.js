const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'PhotoGallery',
  description: 'Self-hosted web photo gallery for a Windows file share.',
  script: path.join(__dirname, 'server', 'index.js'),
});

svc.on('install', () => {
  console.log('Service installed. Starting it now...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('Service is already installed.');
});

svc.on('start', () => {
  console.log('Service started. It will now launch automatically on every boot.');
});

console.log('Installing "PhotoGallery" as a Windows service (run this as Administrator)...');
svc.install();
