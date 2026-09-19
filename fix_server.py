import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the broken toUnban blocks
content = re.sub(r'const toUnban = \[account\.id.*?saveStoredRepository\(\{ userAccounts: updatedUsers, deletedUserIds: updatedDeletedIds \}\);', r'saveStoredRepository({ userAccounts: updatedUsers });', content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)
