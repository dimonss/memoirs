import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
    const isDev = command === 'serve';
    return {
        plugins: [react()],

        // In dev (npm run dev): served at /memoirs/ via SSH tunnel → chalysh.pro/memoirs/
        // In prod (npm run build): same path /memoirs/
        base: isDev ? '/dev/' : '/memoirs/',


        server: isDev ? {
            port: 5173, // separate port from SpaceShooterPhaser (5173)
            // Allows SSH tunnel / ngrok domains (chalysh.pro, etc.)
            allowedHosts: true,
        } : undefined,

        build: {
            outDir: 'dist',
            assetsDir: 'assets',
        },
    };
});
