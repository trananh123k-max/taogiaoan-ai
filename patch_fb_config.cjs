const fs = require('fs');
let config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
config.firestoreDatabaseId = "(default)";
fs.writeFileSync('firebase-applet-config.json', JSON.stringify(config, null, 2));
