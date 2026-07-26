const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const { mediaType } = require('./photos');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const cacheDir = path.join(__dirname, '..', 'data', 'thumb-cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

function cachePathFor(sourcePath, ext) {
  const hash = crypto.createHash('sha1').update(sourcePath).digest('hex');
  return path.join(cacheDir, `${hash}.${ext}`);
}

async function generateImageThumbnail(sourcePath, cachePath) {
  await sharp(sourcePath)
    .rotate()
    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(cachePath);
}

function generateVideoThumbnail(sourcePath, cachePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(sourcePath)
      .on('end', resolve)
      .on('error', reject)
      .screenshots({
        timestamps: ['10%'],
        filename: path.basename(cachePath),
        folder: path.dirname(cachePath),
        size: '400x?',
      });
  });
}

async function getThumbnail(sourcePath) {
  const type = mediaType(sourcePath);
  const isVideo = type === 'video';
  const cachePath = cachePathFor(sourcePath, isVideo ? 'jpg' : 'webp');

  const sourceStat = fs.statSync(sourcePath);
  if (fs.existsSync(cachePath)) {
    const cacheStat = fs.statSync(cachePath);
    if (cacheStat.mtimeMs >= sourceStat.mtimeMs) {
      return cachePath;
    }
  }

  if (isVideo) {
    await generateVideoThumbnail(sourcePath, cachePath);
  } else {
    await generateImageThumbnail(sourcePath, cachePath);
  }

  return cachePath;
}

module.exports = { getThumbnail };
