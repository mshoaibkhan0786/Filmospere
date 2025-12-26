import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use('/api/save-movies', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString() });
            req.on('end', () => {
              try {
                const movies = JSON.parse(body);
                // fs and path are now imported at the top
                const filePath = path.resolve(__dirname, 'src/data/manualMovies.ts');

                const fileContent = `import type { Movie } from '../types';

export const manualMovies: Movie[] = ${JSON.stringify(movies, null, 4)}; // Updated by Admin Editor
`;

                let currentContent = '';
                try {
                  currentContent = fs.readFileSync(filePath, 'utf-8');
                  // Normalize line endings for comparison
                  currentContent = currentContent.replace(/\r\n/g, '\n');
                } catch (readErr) {
                  // File might not exist
                }

                if (currentContent !== fileContent.replace(/\r\n/g, '\n')) {
                  fs.writeFileSync(filePath, fileContent);
                  console.log('Movies saved to manualMovies.ts');

                  // Trigger data rebuild to update public/movies.json
                  exec('npm run build:data', (err, stdout, stderr) => {
                    if (err) console.error('Data rebuild failed:', stderr);
                    else console.log('Data rebuild success:', stdout.trim());
                  });
                } else {
                  console.log('No changes detected, skipping write.');
                }

                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                console.error('Error saving movies:', e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to save' }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
