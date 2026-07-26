const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');

const cacheDir = path.join(__dirname, '..', 'data', 'thumb-cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

async function getThumbnail(sourcePath) {
  const hash = crypto.createHash('sha1').update(sourcePath).digest('hex');
  const cachePath = path.join(cacheDir, `${hash}.webp`);

  const sourceStat = fs.statSync(sourcePath);

  if (fs.existsSync(cachePath)) {
    const cacheStat = fs.statSync(cachePath);
    if (cacheStat.mtimeMs >= sourceStat.mtimeMs) {
      return cachePath;
    }
  }

  await sharp(sourcePath)
    .rotate()
    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(cachePath);

  return cachePath;
}

module.exports = { getThumbnail };
