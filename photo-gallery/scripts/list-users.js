const db = require('../server/db');

function main() {
  const users = db.prepare('SELECT id, username, createdAt FROM users ORDER BY createdAt').all();

  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log(`${users.length} user(s):\n`);
  users.forEach((user) => {
    console.log(`  ${user.username}  (id=${user.id}, created ${user.createdAt})`);
  });
}

main();
