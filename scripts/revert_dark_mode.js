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
    content = content
        .replace(/ dark:bg-gray-950/g, '')
        .replace(/ dark:bg-zinc-950/g, '')
        .replace(/ dark:bg-gray-900/g, '')
        .replace(/ dark:bg-zinc-900/g, '')
        .replace(/ dark:text-gray-100/g, '')
        .replace(/ dark:text-gray-400/g, '')
        .replace(/ dark:text-zinc-400/g, '')
        .replace(/ dark:border-gray-800/g, '')
        .replace(/ dark:border-zinc-800/g, '')
        .replace(/ dark:border-gray-700/g, '')
        .replace(/ dark:border-zinc-700/g, '')
        .replace(/ dark:bg-gray-800\/50/g, '')
        .replace(/ dark:bg-gray-800\/80/g, '')
        .replace(/ dark:bg-gray-800/g, '')
        .replace(/ dark:border-gray-800\/50/g, '')
        .replace(/ dark:bg-zinc-800/g, '')
        // Clean up any stray spaces
        .replace(/  +/g, ' ');
    fs.writeFileSync(f, content);
    console.log(`Reversed styles in ${f}`);
});
