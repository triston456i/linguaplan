const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../server/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const username = (await ask('Username: ')).trim();
  const password = await ask('Password: ');

  if (!username || !password) {
    console.error('Username and password are required.');
    process.exitCode = 1;
    rl.close();
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  try {
    db.prepare('INSERT INTO users (username, passwordHash) VALUES (?, ?)').run(username, passwordHash);
    console.log(`User "${username}" created.`);
  } catch (err) {
    console.error('Failed to create user:', err.message);
    process.exitCode = 1;
  }

  rl.close();
}

main();
