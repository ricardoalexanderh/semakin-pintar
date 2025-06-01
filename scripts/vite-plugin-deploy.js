// Vite plugin for automatic deployment tasks
import { copyAssets } from './copy-assets.js';
import { writeSitemap } from './generate-sitemap.js';

export function deployPlugin(options = {}) {
  const {
    copyAssets: shouldCopyAssets = true,
    generateSitemap = true,
    runOnBuild = true
  } = options;

  return {
    name: 'deploy-plugin',
    
    // Run after build completes
    closeBundle() {
      if (runOnBuild) {
        console.log('🔧 Running deployment tasks...');
        
        if (generateSitemap) {
          console.log('🗺️  Generating sitemap...');
          writeSitemap();
        }
        
        if (shouldCopyAssets) {
          console.log('📁 Copying additional assets...');
          copyAssets();
        }
        
        console.log('✅ Deployment tasks completed!');
      }
    },
    
    // Add custom commands
    configureServer(server) {
      server.middlewares.use('/deploy-status', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'ready',
            timestamp: new Date().toISOString(),
            buildReady: true
          }));
        } else {
          next();
        }
      });
    }
  };
}