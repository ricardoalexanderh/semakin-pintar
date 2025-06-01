#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const DOMAIN = 'https://www.semakinpintar.com';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml');

// Get current date in ISO format
const currentDate = new Date().toISOString().split('T')[0];

// Define your routes and their properties
const routes = [
  {
    url: '/',
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '1.0',
    images: [
      {
        loc: `${DOMAIN}/logo.png`,
        title: 'Semakin Pintar - Free Educational Games Platform'
      }
    ]
  },
  {
    url: '/games/mental-arithmetic',
    lastmod: currentDate,
    changefreq: 'monthly',
    priority: '0.8'
  },
  {
    url: '/games/multiplication-table',
    lastmod: currentDate,
    changefreq: 'monthly',
    priority: '0.8'
  },
  {
    url: '/games/',
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.7'
  }
];

// Generate XML sitemap
function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  routes.forEach(route => {
    xml += `  
  <url>
    <loc>${DOMAIN}${route.url === '/' ? '' : route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>`;

    // Add images if they exist
    if (route.images) {
      route.images.forEach(image => {
        xml += `
    <image:image>
      <image:loc>${image.loc}</image:loc>
      <image:title>${image.title}</image:title>
    </image:image>`;
      });
    }

    xml += `
  </url>`;
  });

  xml += `

</urlset>`;

  return xml;
}

// Write sitemap to file
function writeSitemap() {
  try {
    const sitemapXML = generateSitemap();
    
    // Ensure the directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, sitemapXML, 'utf8');
    console.log(`✅ Sitemap generated successfully at ${OUTPUT_FILE}`);
    console.log(`📝 Generated ${routes.length} URLs`);
    console.log(`🕒 Last modified: ${currentDate}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  writeSitemap();
}

module.exports = { generateSitemap, writeSitemap };