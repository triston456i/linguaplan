const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../server/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const username = (await ask('Username: ')).trim();

  if (!username) {
    console.error('Username is required.');
    process.exitCode = 1;
    rl.close();
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) {
    console.error(`No user "${username}" found.`);
    process.exitCode = 1;
    rl.close();
    return;
  }

  const password = await ask('New password: ');
  if (!password) {
    console.error('Password is required.');
    process.exitCode = 1;
    rl.close();
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  db.prepare('UPDATE users SET passwordHash = ? WHERE username = ?').run(passwordHash, username);
  console.log(`Password updated for "${username}".`);

  rl.close();
}

main();
