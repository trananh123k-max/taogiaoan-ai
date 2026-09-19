import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function test() {
  try {
    const snap = await getDocs(collection(db, 'user_accounts'));
    const accounts = [];
    snap.forEach(d => accounts.push(d.data()));
    console.log(JSON.stringify(accounts, null, 2));
    process.exit(0);
  } catch (e) {
    console.error("Firestore error:", e);
    process.exit(1);
  }
}
test();
