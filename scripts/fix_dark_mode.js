const fs = require('fs');
const files = [
    'src/app/(tabs)/index.tsx',
    'src/app/(tabs)/profile.tsx',
    'src/app/(tabs)/recipes.tsx',
    'src/app/recipes/create.tsx',
    'src/app/recipes/[id].tsx'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content
        .replace(/bg-background(?! dark)/g, 'bg-background dark:bg-gray-950')
        .replace(/bg-card(?! dark)/g, 'bg-card dark:bg-gray-900')
        .replace(/text-text(?![a-zA-Z]| dark)/g, 'text-text dark:text-gray-100')
        .replace(/text-textLight(?! dark)/g, 'text-textLight dark:text-gray-400')
        .replace(/border-gray-100(?! dark)/g, 'border-gray-100 dark:border-gray-800')
        .replace(/border-gray-200(?! dark)/g, 'border-gray-200 dark:border-gray-700')
        .replace(/bg-gray-50(?! dark|\/)/g, 'bg-gray-50 dark:bg-gray-800')
        .replace(/bg-gray-100(?! dark|\/)/g, 'bg-gray-100 dark:bg-gray-800')
        // Fix some specific opacity colors
        .replace(/bg-gray-50\/50/g, 'bg-gray-50/50 dark:bg-gray-800/50')
        .replace(/bg-gray-50\/80/g, 'bg-gray-50/80 dark:bg-gray-800/80')
        .replace(/border-gray-100\/50/g, 'border-gray-100/50 dark:border-gray-800/50');
    fs.writeFileSync(f, content);
    console.log(`Patched ${f}`);
});
