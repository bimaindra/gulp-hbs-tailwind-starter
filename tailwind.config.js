// tailwind.config.js
const plugin = require('tailwindcss/plugin');

module.exports = {
    prefix: 'wd-',
    purge: {
        enabled: true,
        preserveHtmlElements: true,
        content: [
            './src/public/**/*.html', 
            './src/public/**/*.hbs', 
            './src/assets/js/**/*.js'
        ],
    },
    darkMode: 'class', // or 'media' or 'class'
    theme: {
        colors: {
            black: '#000000',
            white: '#ffffff',
            dark1: '#353b48',
            dark2: '#2f3640',
            grey1: '#f5f6fa',
            grey2: '#dcdde1',
            red1: '#e84118',
            red2: '#c23616',
            green1: '#4cd137',
            green2: '#44bd32',
            blue1: '#00a8ff',
            blue2: '#0097e6',
            navy1: '#273c75',
            navy2: '#192a56',
            yellow1: '#fbc531',
            yellow2: '#e1b12c',
            purple1: '#9c88ff',
            purple2: '#8c7ae6',
        },
        fontFamily: {
            'base': 'Nunito Sans, sans-serif',
            'secondary': 'Roboto, sans-serif',
        },
        fontWeight: {
            light: 300,
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            black: 900,
        },
        extend: {},
    },
    variants: {},
    plugins: [],
};
