const fs = require('fs');
const files = [
    'src/components/audit/AuditLogViewerIsland.tsx',
    'src/components/employees/EmployeeTableIsland.tsx',
    'src/components/inventory/AssetTable.tsx'
];
for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    const regex = /getThemedClass\(\s*(['"`].*?['"`]|[\w]+)\s*,\s*(['"`].*?['"`])\s*,\s*(['"`])(.*?)(['"`])\s*\)/g;
    let modified = false;
    content = content.replace(regex, (match, arg1, arg2, q1, arg3, q2) => {
        const newArg3 = arg3.split(' ').map(c => {
            if (!c || c.startsWith('dark:')) return c;
            return 'dark:' + c;
        }).join(' ');
        modified = true;
        return `getThemedClass(${arg1}, ${arg2}, ${q1}${newArg3}${q2})`;
    });
    if (modified) {
        fs.writeFileSync(f, content);
        console.log('Updated', f);
    }
}
