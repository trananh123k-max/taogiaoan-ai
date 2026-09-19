import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFile } from 'fs/promises';

async function run() {
  try {
    const configStr = await readFile('./firebase-applet-config.json', 'utf8');
    const config = JSON.parse(configStr);
    const app = initializeApp(config);
    const db = getFirestore(app);
    const snap = await getDocs(collection(db, 'user_accounts'));
    const accounts = [];
    snap.forEach(d => accounts.push(d.data()));
    console.log("Firestore accounts:", accounts.map(a => a.fullName));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
