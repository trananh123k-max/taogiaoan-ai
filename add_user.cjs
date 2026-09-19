const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const usersCol = collection(db, 'user_accounts');
    const snap = await getDocs(usersCol);
    let existingId = null;
    snap.forEach(d => {
      const data = d.data();
      if (data.username === 'hoangnham119@gmail.com') {
        existingId = d.id;
      }
    });

    const id = existingId || 'user_' + Date.now();
    const userRef = doc(db, 'user_accounts', id);
    
    const userData = {
      id: id,
      username: 'hoangnham119@gmail.com',
      fullName: 'Hoàng Nhâm',
      email: 'hoangnham119@gmail.com',
      phone: '0375377106',
      schoolName: 'THCS Tân Loan',
      role: 'teacher',
      status: 'active',
      password: 'Nham@123',
      maxDevices: 2,
      validUntil: '30/9/2027',
      authorizedDevices: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userRef, userData, { merge: true });
    console.log("Successfully added/updated user:", userData.fullName);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
run();
