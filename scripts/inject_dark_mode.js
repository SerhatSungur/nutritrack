const fs = require('fs');
const files = [
    'src/app/(tabs)/index.tsx',
    'src/app/(tabs)/profile.tsx',
    'src/app/(tabs)/recipes.tsx',
    'src/app/recipes/create.tsx',
    'src/app/recipes/[id].tsx'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');

    // Clean up any existing dark classes to avoid duplication
    content = content
        .replace(/ dark:bg-zinc-[0-9]+/g, '')
        .replace(/ dark:text-zinc-[0-9]+/g, '')
        .replace(/ dark:border-zinc-[0-9]+/g, '')
        .replace(/ dark:bg-gray-[0-9]+/g, '')
        .replace(/ dark:text-gray-[0-9]+/g, '')
        .replace(/ dark:border-gray-[0-9]+/g, '');

    // Inject explicit NativeWind v4 safe dark classes
    content = content
        .replace(/bg-background/g, 'bg-background dark:bg-zinc-950')
        .replace(/bg-card/g, 'bg-card dark:bg-zinc-900')
        // Only target text-text that is not followed by Light
        .replace(/text-text(?!Light)/g, 'text-text dark:text-zinc-50')
        .replace(/text-textLight/g, 'text-textLight dark:text-zinc-400')
        .replace(/border-gray-100/g, 'border-gray-100 dark:border-zinc-800')
        .replace(/bg-gray-50/g, 'bg-gray-50 dark:bg-zinc-800')
        .replace(/border-gray-200/g, 'border-gray-200 dark:border-zinc-700')
        .replace(/bg-gray-100/g, 'bg-gray-100 dark:bg-zinc-800');

    // Specifically fix border lines in profile
    content = content.replace(/border-zinc-700 dark:border-zinc-700/g, 'dark:border-zinc-700');

    fs.writeFileSync(f, content);
    console.log('Injected dark classes for', f);
});
