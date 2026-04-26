const fs = require('fs');
const files = [
  'src/app/dashboard/user/page.tsx',
  'src/app/dashboard/moderator/page.tsx',
  'src/app/dashboard/layout.tsx',
  'src/app/globals.css',
  'src/app/providers.tsx'
];
const payload = {
  owner: 'nimaema',
  repo: 'Mafia_web',
  branch: 'main',
  message: 'UI enhancements and lobby cancellation',
  files: files.map(f => ({
    path: f,
    content: fs.readFileSync(f, 'utf8')
  }))
};
fs.writeFileSync('push_payload.json', JSON.stringify(payload));
