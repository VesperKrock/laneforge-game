import { defineConfig } from 'vite';

export default defineConfig({
  base: '/laneforge-game/',
  publicDir: false,
  envDir: false,
  server: {
    fs: { deny: [
      '**/.git/**', '**/prompts/**', '**/.codex/**', '**/.env', '**/.env.*',
      '**/*credentials*.json', '**/id_rsa', '**/id_ed25519',
      '**/*.{pem,key,p12,pfx,p8,crt,cer,jks,keystore}',
      '**/secrets/**', '**/credentials/**', '**/private/**', '**/local-data/**',
    ] },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
