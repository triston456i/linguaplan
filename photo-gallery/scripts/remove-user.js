const readline = require('readline');
const db = require('../server/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const username = (await ask('Username to remove: ')).trim();

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

  const confirm = (await ask(`Type "yes" to permanently remove "${username}": `)).trim().toLowerCase();
  if (confirm !== 'yes') {
    console.log('Cancelled.');
    rl.close();
    return;
  }

  db.prepare('DELETE FROM users WHERE username = ?').run(username);
  console.log(`User "${username}" removed.`);

  rl.close();
}

main();
