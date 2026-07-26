const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'PhotoGallery',
  script: path.join(__dirname, 'server', 'index.js'),
});

svc.on('uninstall', () => {
  console.log('Service uninstalled.');
});

console.log('Uninstalling "PhotoGallery" service (run this as Administrator)...');
svc.uninstall();
