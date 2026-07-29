# Photo Gallery

A small self-hosted web app that turns a folder tree on your Windows file
share into a login-protected photo gallery you can browse from a phone or
browser, at home or remotely.

For the people you share access with, there's a Chinese-language user guide:
[USER_GUIDE.zh-CN.md](USER_GUIDE.zh-CN.md) (covers signing in, browsing
albums, viewing photos/videos, and signing out — this README is for whoever
sets the app up).

- Runs directly on the Windows machine that hosts the share (no SMB/network
  auth to deal with — it reads the local disk path).
- Login required (per-user accounts, sessions, rate-limited login).
- Folders become browsable albums; click a photo for a full-size lightbox
  view with next/prev navigation, or click a video to play it inline.
- Supports common video formats too: mp4, mov, m4v, webm, mkv, avi, wmv,
  flv, mpg/mpeg, 3gp. Videos get a poster-frame thumbnail in the grid and
  stream with seek support (no need to fully download before scrubbing).
- Thumbnails are generated once and cached on disk, so browsing large photo
  and video folders stays fast.

## 1. Install Node.js

Install [Node.js LTS](https://nodejs.org/) on the Windows server (the same
machine that hosts the shared photo folder).

## 2. Install dependencies

Open a terminal in this folder and run:

```
npm install
```

This also pulls in a bundled ffmpeg binary (used to generate video poster
thumbnails) — no separate ffmpeg install needed.

## 3. Configure

```
copy config.example.json config.json
```

Edit `config.json`:

```json
{
  "photoRoot": "D:\\Shared\\Photos",
  "port": 8080,
  "sessionSecret": "replace-with-a-long-random-string"
}
```

- `photoRoot`: the local path to the folder you want to share (subfolders
  become albums).
- `port`: the port the app listens on.
- `sessionSecret`: a long random string, used to sign login sessions. Change
  it from the placeholder before starting the server.

## 4. Manage accounts for family/friends

```
npm run add-user
```

Run this once per person who needs access. It prompts for a username and
password and stores a bcrypt-hashed password in a local SQLite database
(`data/app.db`).

Other account management commands:

```
npm run list-users      # show all accounts
npm run set-password    # reset an existing account's password
npm run remove-user     # delete an account (asks for confirmation)
```

## 5. Test it

```
npm start
```

Visit `http://localhost:8080`, sign in, and confirm you can browse folders
and view photos. Stop it with Ctrl+C once you're happy.

## 6. Run it as a Windows service (so it starts on boot)

Open an **Administrator** command prompt in this folder:

```
npm run install-service
```

This registers the app as a Windows service named `PhotoGallery` and starts
it. It will now come up automatically on every reboot. To remove it later:

```
npm run uninstall-service
```

## 7. Access it remotely

The app itself only handles login/sessions — it does not terminate HTTPS or
expose itself to the internet. Since family/friends need remote access,
pick one of these to get a secure connection to it from outside your LAN:

**Option A — Cloudflare Tunnel (recommended, easiest and most secure)**
Install `cloudflared` on the server and run a tunnel pointing at
`http://localhost:8080`. You get a real HTTPS URL with no router port
forwarding and no exposed open port on your network.

**Option B — Port forward + reverse proxy + dynamic DNS**
If you'd rather use your own domain: forward a port on your router to this
machine, run a reverse proxy (e.g. Caddy, which gets you free automatic
HTTPS certificates) in front of port 8080, and use a dynamic DNS service if
your home IP isn't static. This exposes a port directly to the internet, so
keep the server and Node.js dependencies patched.

Either way, only the app's login page should ever be reachable — don't
forward/tunnel any other ports on this machine.

## Notes on security

- Passwords are hashed with bcrypt; nothing is stored in plaintext.
- All file access is restricted to `photoRoot` — folder paths from the
  browser are resolved and checked against it before touching the disk.
- Login attempts are rate-limited (10 per 15 minutes per IP).
- Use a strong, unique password for each account, especially once this is
  reachable from the internet.
