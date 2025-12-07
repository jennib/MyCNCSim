/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cnc-dark': '#0a0a0a',
                'cnc-panel': '#1a1a1a',
                'cnc-accent': '#00ff88',
                'cnc-text': '#e0e0e0',
            },
            fontFamily: {
                mono: ['"Fira Code"', 'monospace'], // Industrial look
            }
        },
    },
    plugins: [],
}
