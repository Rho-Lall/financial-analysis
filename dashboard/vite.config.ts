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
        const dbtDocsDir = resolve(__dirname, '../submodules/analytics-engineering/output/dbtdocs')
        const imagesDir = resolve(__dirname, 'images')

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

        // Serve dbt docs at /financial-analysis/dbtdocs/
        server.middlewares.use('/financial-analysis/dbtdocs', (req, res, next) => {
          // Default to index.html for root path
          const requestedFile = req.url === '/' || req.url === '' ? 'index.html' : req.url?.slice(1) || 'index.html'
          const filePath = resolve(dbtDocsDir, requestedFile)

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'text/html')
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })

        // Serve images at /financial-analysis/images/
        server.middlewares.use('/financial-analysis/images', (req, res, next) => {
          const filePath = resolve(imagesDir, req.url?.slice(1) || '')

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = filePath.split('.').pop()?.toLowerCase()
            const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream'
            res.setHeader('Content-Type', contentType)
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
        const dbtDocsDir = resolve(__dirname, '../submodules/analytics-engineering/output/dbtdocs')
        const distDbtDocsDir = resolve(__dirname, 'dist/dbtdocs')
        const imagesDir = resolve(__dirname, 'images')
        const distImagesDir = resolve(__dirname, 'dist/images')

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

        // Create dist/dbtdocs directory if it doesn't exist
        if (!fs.existsSync(distDbtDocsDir)) {
          fs.mkdirSync(distDbtDocsDir, { recursive: true })
        }

        // Copy dbt docs
        const dbtDocsFiles = fs.readdirSync(dbtDocsDir)
        for (const file of dbtDocsFiles) {
          const srcPath = resolve(dbtDocsDir, file)
          const destPath = resolve(distDbtDocsDir, file)
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath)
            console.log(`Copied ${file} to dist/dbtdocs/`)
          }
        }

        // Create dist/images directory if it doesn't exist
        if (!fs.existsSync(distImagesDir)) {
          fs.mkdirSync(distImagesDir, { recursive: true })
        }

        // Copy images
        const imageFiles = fs.readdirSync(imagesDir)
        for (const file of imageFiles) {
          const srcPath = resolve(imagesDir, file)
          const destPath = resolve(distImagesDir, file)
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath)
            console.log(`Copied ${file} to dist/images/`)
          }
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
