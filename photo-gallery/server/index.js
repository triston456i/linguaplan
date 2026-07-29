const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const archiver = require('archiver');

const config = require('./config');
const { router: authRouter, requireLogin } = require('./auth');
const { listFolder, resolveSafePath, mediaType } = require('./photos');
const { getThumbnail } = require('./thumbnails');

const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/', authRouter);

app.use(requireLogin);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/browse', (req, res) => {
  const relPath = typeof req.query.path === 'string' ? req.query.path : '';
  try {
    const { folders, items } = listFolder(relPath);
    res.json({ path: relPath, folders, items });
  } catch (err) {
    res.status(400).json({ error: 'Invalid folder' });
  }
});

app.get('/api/thumbnail', async (req, res) => {
  try {
    const filePath = resolveSafePath(req.query.path || '');
    if (!mediaType(filePath)) return res.status(404).end();
    const thumbPath = await getThumbnail(filePath);
    res.sendFile(thumbPath);
  } catch (err) {
    res.status(404).end();
  }
});

app.get('/api/media', (req, res) => {
  try {
    const filePath = resolveSafePath(req.query.path || '');
    if (!mediaType(filePath)) return res.status(404).end();
    res.sendFile(filePath);
  } catch (err) {
    res.status(404).end();
  }
});

app.get('/api/download', (req, res) => {
  try {
    const filePath = resolveSafePath(req.query.path || '');
    if (!mediaType(filePath)) return res.status(404).end();
    res.download(filePath);
  } catch (err) {
    res.status(404).end();
  }
});

app.post('/api/download-zip', (req, res) => {
  const paths = Array.isArray(req.body && req.body.paths) ? req.body.paths : [];
  if (paths.length === 0) return res.status(400).json({ error: 'No files selected' });

  let resolved;
  try {
    resolved = paths.map((p) => {
      const filePath = resolveSafePath(p);
      if (!mediaType(filePath)) throw new Error('Invalid file');
      return filePath;
    });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid selection' });
  }

  res.attachment('photos.zip');
  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', () => res.end());
  archive.pipe(res);

  const usedNames = new Set();
  resolved.forEach((filePath) => {
    let name = path.basename(filePath);
    while (usedNames.has(name)) {
      name = '_' + name;
    }
    usedNames.add(name);
    archive.file(filePath, { name });
  });

  archive.finalize();
});

app.listen(config.port, () => {
  console.log(`Photo gallery listening on port ${config.port}`);
});
