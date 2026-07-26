const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');

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

app.listen(config.port, () => {
  console.log(`Photo gallery listening on port ${config.port}`);
});
