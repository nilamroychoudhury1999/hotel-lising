const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://homavia.in';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const staticPages = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/premium', changefreq: 'weekly', priority: '0.8' },
  { path: '/bike-rental', changefreq: 'weekly', priority: '0.8' },
  { path: '/car-rental', changefreq: 'weekly', priority: '0.8' }
];

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value) {
  if (!value) return new Date().toISOString().split('T')[0];

  const date = value?.toDate?.() || value;
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().split('T')[0]
    : parsed.toISOString().split('T')[0];
}

function createSlug(name = '', id = '', city = '') {
  const baseSlug = String(name || id)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/@/g, 'at')
    .replace(/'/g, '')
    .replace(/"/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
    .replace(/-+$/g, '');

  const citySlug = String(city || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return [baseSlug, citySlug, id].filter(Boolean).join('-');
}

function getListingImages(data = {}) {
  const images = [];

  if (Array.isArray(data.images)) {
    images.push(...data.images);
  }

  if (data.imageUrl) images.push(data.imageUrl);
  if (data.image) images.push(data.image);

  return [...new Set(images.filter(Boolean))].slice(0, 5);
}

function renderUrlEntry({ loc, lastmod, changefreq, priority, images = [] }) {
  const imageTags = images.map(image => `
    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
      <image:caption>${escapeXml(image.caption)}</image:caption>
    </image:image>`).join('');

  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>${imageTags}
  </url>`;
}

async function loadHomestaysFromFirestore() {
  const keyPath = path.join(__dirname, '..', 'firebase-admin-key.json');

  if (!fs.existsSync(keyPath)) {
    console.warn('Firebase admin key not found. Generating static sitemap only.');
    return [];
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch (error) {
    console.warn('firebase-admin is not installed. Generating static sitemap only.');
    return [];
  }

  try {
    const serviceAccount = require(keyPath);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const snapshot = await admin.firestore().collection('homestays').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn(`Could not load Firestore homestays: ${error.message}`);
    return [];
  } finally {
    await Promise.all(admin.apps.map(app => app.delete()));
  }
}

async function generateSitemap() {
  const entries = staticPages.map(page => ({
    loc: `${BASE_URL}${page.path}`,
    lastmod: formatDate(),
    changefreq: page.changefreq,
    priority: page.priority
  }));

  const homestays = await loadHomestaysFromFirestore();

  homestays.forEach(homestay => {
    const slug = createSlug(homestay.name, homestay.id, homestay.city);
    if (!slug) return;

    entries.push({
      loc: `${BASE_URL}/homestays/${slug}`,
      lastmod: formatDate(homestay.updatedAt || homestay.createdAt),
      changefreq: 'weekly',
      priority: '0.9',
      images: getListingImages(homestay).map(image => ({
        loc: image,
        caption: `${homestay.name || 'Homavia homestay'} - ${homestay.roomType || 'Homestay'} in ${homestay.city || 'India'}`
      }))
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map(renderUrlEntry).join('\n')}
</urlset>
`;

  fs.writeFileSync(OUTPUT_PATH, sitemap);
  console.log(`Sitemap generated at ${OUTPUT_PATH}`);
  console.log(`Total URLs: ${entries.length}`);
}

generateSitemap().catch(error => {
  console.error('Error generating sitemap:', error);
  process.exitCode = 1;
});
