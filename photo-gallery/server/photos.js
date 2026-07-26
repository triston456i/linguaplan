const path = require('path');
const fs = require('fs');
const { photoRoot } = require('./config');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic']);
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.m4v', '.mov', '.webm', '.mkv', '.avi', '.wmv', '.flv', '.mpg', '.mpeg', '.3gp',
]);

function resolveSafePath(relativePath = '') {
  const target = path.resolve(photoRoot, relativePath);

  if (target !== photoRoot && !target.startsWith(photoRoot + path.sep)) {
    throw new Error('Invalid path');
  }

  return target;
}

function mediaType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'photo';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

function listFolder(relativePath = '') {
  const dir = resolveSafePath(relativePath);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const folders = [];
  const items = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      folders.push(entry.name);
      continue;
    }

    const type = mediaType(entry.name);
    if (type) {
      items.push({ name: entry.name, type });
    }
  }

  folders.sort((a, b) => a.localeCompare(b));
  items.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, items };
}

module.exports = { resolveSafePath, listFolder, mediaType, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS };
