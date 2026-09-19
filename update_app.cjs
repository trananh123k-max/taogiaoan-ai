const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('updateUserActivityInFirestore')) {
  code = code.replace("import { saveUserAccountToFirestore,", "import { saveUserAccountToFirestore, updateUserActivityInFirestore,");
}

const targetStr = `    const saveInterval = setInterval(() => {
      if (currentUserRef.current) {
        saveUserAccountToFirestore(currentUserRef.current);
      }
    }, 10000);`;

const newStr = `    const saveInterval = setInterval(() => {
      if (currentUserRef.current) {
        // ONLY update activity metrics to prevent overwriting Admin changes (race condition fix)
        updateUserActivityInFirestore(currentUserRef.current.id, {
          lastActiveTimestamp: currentUserRef.current.lastActiveTimestamp,
          activeSecondsToday: currentUserRef.current.activeSecondsToday,
          activeMinutesToday: currentUserRef.current.activeMinutesToday,
          lastActiveDate: currentUserRef.current.lastActiveDate
        });
      }
    }, 10000);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log('App.tsx updated');
} else {
  console.log('Target string not found in App.tsx');
}
