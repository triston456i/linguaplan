const path = require('path');
const fs = require('fs');
const { photoRoot } = require('./config');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic']);

function resolveSafePath(relativePath = '') {
  const target = path.resolve(photoRoot, relativePath);

  if (target !== photoRoot && !target.startsWith(photoRoot + path.sep)) {
    throw new Error('Invalid path');
  }

  return target;
}

function listFolder(relativePath = '') {
  const dir = resolveSafePath(relativePath);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const folders = [];
  const photos = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      folders.push(entry.name);
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      photos.push(entry.name);
    }
  }

  folders.sort((a, b) => a.localeCompare(b));
  photos.sort((a, b) => a.localeCompare(b));

  return { folders, photos };
}

module.exports = { resolveSafePath, listFolder, IMAGE_EXTENSIONS };
