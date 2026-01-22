import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to serve data files from analytics-engineering output
    {
      name: 'serve-data-files',
      configureServer(server) {
        const dataDir = resolve(__dirname, '../submodules/analytics-engineering/output')

        // Serve data files at /financial-analysis/data/
        server.middlewares.use('/financial-analysis/data', (req, res, next) => {
          const filePath = resolve(dataDir, req.url?.slice(1) || '')

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
      // Copy data files to dist/data during build
      closeBundle() {
        const dataDir = resolve(__dirname, '../submodules/analytics-engineering/output')
        const distDataDir = resolve(__dirname, 'dist/data')

        // Create dist/data directory if it doesn't exist
        if (!fs.existsSync(distDataDir)) {
          fs.mkdirSync(distDataDir, { recursive: true })
        }

        // Copy all JSON files from output to dist/data
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
        for (const file of files) {
          fs.copyFileSync(resolve(dataDir, file), resolve(distDataDir, file))
          console.log(`Copied ${file} to dist/data/`)
        }
      },
    },
  ],
  base: '/financial-analysis/',
  // Keep default publicDir for static assets (images, etc.)
  server: {
    fs: {
      // Allow serving files from the parent directory
      allow: ['..'],
    },
  },
})
