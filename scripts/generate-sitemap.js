const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (update with your credentials)
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to create SEO-friendly slug
function createSlug(name, id, city) {
  if (!name || !id) return id || '';
  
  const cityPart = city ? `-${city.toLowerCase().replace(/\s+/g, '-')}` : '';
  
  const slug = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  
  return `${slug}${cityPart}-${id}`;
}

async function generateSitemap() {
  const baseUrl = 'https://homavia.in';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static pages with priorities
  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0' },
    { url: 'about', changefreq: 'monthly', priority: '0.8' },
    { url: 'contact', changefreq: 'monthly', priority: '0.7' },
    { url: 'premium', changefreq: 'weekly', priority: '0.9' },
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // Add static pages
  staticPages.forEach(page => {
    sitemap += `  <url>
    <loc>${baseUrl}/${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  try {
    // Fetch all homestays from Firestore
    const snapshot = await db.collection('homestays').get();
    
    console.log(`Found ${snapshot.size} homestays`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const slug = createSlug(data.name, doc.id, data.city);
      
      sitemap += `  <url>
    <loc>${baseUrl}/homestays/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;
      
      // Add image information
      if (data.images && data.images.length > 0) {
        data.images.slice(0, 5).forEach(image => {
          sitemap += `
    <image:image>
      <image:loc>${image}</image:loc>
      <image:caption>${data.name} - ${data.roomType || 'Homestay'} in ${data.city}</image:caption>
    </image:image>`;
        });
      }
      
      sitemap += `
  </url>
`;
    });
    
    sitemap += `</urlset>`;
    
    // Write sitemap to public folder
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    
    console.log(`✅ Sitemap generated successfully at ${sitemapPath}`);
    console.log(`Total URLs: ${staticPages.length + snapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  } finally {
    admin.app().delete();
  }
}

generateSitemap();
