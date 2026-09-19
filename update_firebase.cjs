const fs = require('fs');
let code = fs.readFileSync('src/utils/firebase.ts', 'utf8');

const newFunc = `
export async function updateUserActivityInFirestore(accountId: string, activityData: Partial<ManagedUserAccount>): Promise<boolean> {
  try {
    const userRef = doc(db, 'user_accounts', accountId);
    await setDoc(userRef, {
      ...activityData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    postServerSync('/api/repository/update-user-activity', { id: accountId, ...activityData });
  } catch {}
  return true;
}
`;

if (!code.includes('updateUserActivityInFirestore')) {
  code = code.replace('export async function saveUserAccountToFirestore', newFunc + '\nexport async function saveUserAccountToFirestore');
  fs.writeFileSync('src/utils/firebase.ts', code);
  console.log('Added updateUserActivityInFirestore');
}
