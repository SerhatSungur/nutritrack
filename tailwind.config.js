/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                card: "var(--card)",
                primary: "var(--primary)",
                text: "var(--text)",
                textLight: "var(--textLight)",
                border: "var(--border)",
                ring: "var(--ring)"
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
