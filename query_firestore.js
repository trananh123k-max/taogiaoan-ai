const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'user_accounts'));
    const accounts = [];
    snap.forEach(d => accounts.push(d.data()));
    console.log("Firestore accounts:", accounts.map(a => a.fullName));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
