import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS === 'true' && repositoryName ? `/${repositoryName}/` : '/';
const audioDir = path.resolve(__dirname, 'audio');

function localAudioPlugin(): Plugin {
  return {
    name: 'local-audio',
    configureServer(server) {
      server.middlewares.use('/audio', (req, res, next) => {
        const requestPath = decodeURIComponent((req.url || '/').replace(/^\/+/, ''));
        const filePath = path.join(audioDir, requestPath);

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next();
          return;
        }

        const extension = path.extname(filePath).toLowerCase();
        if (extension === '.mp3') {
          res.setHeader('Content-Type', 'audio/mpeg');
        } else if (extension === '.json') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }

        fs.createReadStream(filePath).pipe(res);
      });
    },
    writeBundle(options) {
      if (!fs.existsSync(audioDir)) {
        return;
      }

      const outDir = options.dir ? path.resolve(options.dir) : path.resolve('dist');
      const targetDir = path.join(outDir, 'audio');
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.cpSync(audioDir, targetDir, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), localAudioPlugin()],
  base,
});
