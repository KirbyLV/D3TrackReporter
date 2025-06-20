// src/plugins/vuetify.js
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export const vuetify = createVuetify({
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#1976D2',
                    secondary: '#424242',
                    background: '#F5F5F5',
                },
            },
        },
        dark: {
            colors: {
                primary: '#2196F3',
                secondary: '#424242',
                background: '#121212',
            },
        },
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
});
