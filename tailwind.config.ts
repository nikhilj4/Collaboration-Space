import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#d125f4",
                "bg-dark": "#1f1022",
                "neutral-dark": "#2d1b31",
                "neutral-border": "#4a2d52",
                "neutral-text": "#b59cba",
            },
            fontFamily: {
                display: ["Spline Sans", "sans-serif"],
            },
        },
    },
    plugins: [],
};

export default config;
