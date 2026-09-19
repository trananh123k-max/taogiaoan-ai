const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
// Update user activity (partial update)
app.post('/api/repository/update-user-activity', (req, res) => {
  try {
    const { id, ...activityData } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID tài khoản' });

    const repo = getStoredRepository();
    const existing = repo.userAccounts.find((u) => u.id === id);
    if (existing) {
      const updated = { ...existing, ...activityData };
      const updatedUsers = [updated, ...repo.userAccounts.filter((u) => u.id !== id)];
      saveStoredRepository({ userAccounts: updatedUsers });
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
`;

if (!code.includes('/api/repository/update-user-activity')) {
  code = code.replace("app.post('/api/repository/save-user'", newRoute + "\napp.post('/api/repository/save-user'");
  fs.writeFileSync('server.ts', code);
  console.log('Added route to server.ts');
}
