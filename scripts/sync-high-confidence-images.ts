import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// ─── PURE JS ENVIRONMENT LOADER ──────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

// ─── INITIALIZE CLIENTS ──────────────────────────────────────────────────────
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── PRODUCT MAPPING ─────────────────────────────────────────────────────────
interface HighConfidenceProduct {
  id: number;
  staticName: string;
  dbName: string;
  driveFolderId: string;
}

const HIGH_CONFIDENCE_PRODUCTS: HighConfidenceProduct[] = [
  { id: 1, staticName: "Turba Dryfly", dbName: "Magic Dryfly", driveFolderId: "1anXbpwYQ1WhpSB43LFt68vgH4KQKKEsM" },
  { id: 2, staticName: "Turba Dryplay", dbName: "Magic Dryplay", driveFolderId: "1H8K8zHWJ_UPfq7wFpe1rRzTAKhoGI_Rp" },
  { id: 3, staticName: "Turba Bio (Men)", dbName: "Magic Bio (Men)", driveFolderId: "1622kSFc6Ow4neaAthN8CDzlwrRKp7Rfx" },
  { id: 4, staticName: "Turba Bio Girls", dbName: "Magic Bio Girls", driveFolderId: "1YB6vflVz4y2Qx4ufqucUvI08UU6tOVw6" },
  { id: 5, staticName: "Turba Bio Kids", dbName: "Magic Bio Kids", driveFolderId: "11c0XZa06osG9oUW2Lh3HXIPTDr4wLUJ8" },
  { id: 6, staticName: "Turba Tuck Polo", dbName: "Magic Tuck Polo", driveFolderId: "1zh-OtSv1Y0XuZJQfdgWXlDtkORA1mLFP" },
  { id: 8, staticName: "High O2 — Oxi Polo", dbName: "High O2 — Oxi Polo", driveFolderId: "13EHWKKMLzBoJFvXjA2_JavvLe2F-Vcq1" },
  { id: 12, staticName: "Turba Solids Polo", dbName: "Magic Solids Polo", driveFolderId: "199hzr1z9BSP9LBjR89ahWmsAHyi4X8hs" },
  { id: 14, staticName: "Turba IO Polo", dbName: "Magic IO Polo", driveFolderId: "1QHN8TTHMEAC1Ktu_jXGBHN9EJv8tT1-i" },
  { id: 16, staticName: "Premium Interlock Polo", dbName: "Wild Horn Interlock Polo", driveFolderId: "1m4WwhDD0xjUeSNFh3yWxrUmYvVJGk35g" },
  { id: 17, staticName: "Turba Hood + Kangaroo Hoodie", dbName: "Magic Hood + Kangaroo Hoodie", driveFolderId: "1zsa7y-f3b7NjzxARRYl5T2Jpo1nA1HWa" },
  { id: 20, staticName: "Turba Stand Collar HighNeck", dbName: "Rufty HighNeck + Stand Collar", driveFolderId: "14OZDxSBlcJIq6W7xCBd33Xl-fvNFDynR" },
  { id: 29, staticName: "Legacy Polo (Dryfit)", dbName: "Legacy Polo (Dryfit)", driveFolderId: "1wMOSBUgFiKaJ2SAk2yErgVIh057iCOh2" },
  { id: 35, staticName: "Infinity Round Neck", dbName: "Infinity Round Neck", driveFolderId: "1xbkSi8n3_DGlRWHK5O2hcqDWenL90R4A" },
  { id: 39, staticName: "Seeker Collar Polo", dbName: "Seeker Collar Polo", driveFolderId: "1xbkSi8n3_DGlRWHK5O2hcqDWenL90R4A" },
  { id: 48, staticName: "FilaFil Shirt", dbName: "FilaFil Shirt", driveFolderId: "1GEwLeBmITsD7jKc1m_qpN5Nz3eJwtfOm" },
  { id: 49, staticName: "Chambray Shirt", dbName: "Chambray Shirt", driveFolderId: "1GMBoiDxodGzRv2ui1gKFGko6OwQWGajj" },
  { id: 50, staticName: "Performance Shirt", dbName: "Performance Shirt", driveFolderId: "1BmOhm3CL2JbS1JX4U-6Jp-9Ze6Wf8c-z" },
  { id: 51, staticName: "Parkland Trouser", dbName: "Parkland Trouser", driveFolderId: "15zPRVZa_QbNKELzLPRuInGk8NbG-BE7s" },
  { id: 52, staticName: "Lab Coat", dbName: "Lab Coat — Dankat", driveFolderId: "1U2v1Ml696EdAzdAn6f87w7-UpebptxWU" },
  { id: 59, staticName: "Oversized Originals", dbName: "Oversized Originals", driveFolderId: "1BSSxxiSkikvgKAS-HCyN3Af_9A_VmZN1" },
  { id: 70, staticName: "Flexi-Waist Trouser", dbName: "Flexi-Waist Trouser", driveFolderId: "1lPTB9yLgDm8BvYc6rIxfUCcmSQ9-4cB_" }
];

// Helper to clean names for comparison
function cleanName(name: string): string {
  return name.toLowerCase()
    .replace("turba", "")
    .replace("magic", "")
    .replace("rufty", "")
    .replace("abs", "")
    .replace("—", "")
    .replace("-", "")
    .replace("(", "")
    .replace(")", "")
    .replace("s", "")
    .replace(/\s+/g, "")
    .trim();
}

// ─── NETWORK & FILE HELPERS ──────────────────────────────────────────────────
async function fetchDriveFolderHtml(folderId: string): Promise<string> {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', reject);
  });
}

function parseDriveHtml(html: string): Array<{ id: string; name: string }> {
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];
  
  const escapedStr = match[1];
  const decodedStr = escapedStr.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  const files: Array<{ id: string; name: string }> = [];
  const regex = /\["([a-zA-Z0-9_-]{28,40})",\s*\["([a-zA-Z0-9_-]{28,40})"\]\s*,\s*"([^"]+)"/g;
  let fileMatch;
  while ((fileMatch = regex.exec(decodedStr)) !== null) {
    const fileId = fileMatch[1];
    const fileName = fileMatch[3];
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp')) {
      if (!lowerName.includes('sizechart') && !lowerName.includes('ini')) {
        files.push({ id: fileId, name: fileName });
      }
    }
  }
  return files;
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (response) => {
      if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode)) {
        file.close();
        downloadFile(response.headers.location!, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`Status code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function uploadToCloudinary(filePath: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: "turba_products"
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result!.secure_url);
    });
  });
}

function updateStaticFile(productId: number, mainUrl: string, galleryUrls: string[]) {
  const filePath = path.join(__dirname, '../src/lib/products-data.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  const lines = content.split('\n');
  const targetIndex = lines.findIndex(line => line.includes(`id: ${productId},`));
  
  if (targetIndex !== -1) {
    let line = lines[targetIndex];
    
    // Replace image: ... with image: "mainUrl"
    line = line.replace(/image:\s*[^,]+,/, `image: "${mainUrl}",`);
    
    // Replace gallery: [...] with gallery: [galleryUrls]
    const galleryStr = galleryUrls.map(u => `"${u}"`).join(', ');
    line = line.replace(/gallery:\s*\[[^\]]*\],/, `gallery: [${galleryStr}],`);
    
    lines[targetIndex] = line;
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`✅ Static file updated for Product ID ${productId}`);
  } else {
    console.error(`❌ Product ID ${productId} not found in products-data.ts`);
  }
}

// ─── MAIN PROCESS ────────────────────────────────────────────────────────────
async function run() {
  console.log("🚀 Starting High-Confidence Product Image Sync...");
  
  const tempDir = path.join(__dirname, '../scratch/temp-downloads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Load database products
  let dbProducts: any[] = [];
  try {
    dbProducts = await prisma.product.findMany();
    console.log(`Connected to database. Found ${dbProducts.length} products.`);
  } catch (err) {
    console.error("Warning: Database connection failed. DB updates will be skipped.", err);
  }

  const syncResults: Record<number, { main: string; gallery: string[] }> = {};

  for (const p of HIGH_CONFIDENCE_PRODUCTS) {
    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`📦 Processing Product ID ${p.id}: "${p.staticName}"`);
    console.log(`🔗 GDrive Folder: ${p.driveFolderId}`);
    
    try {
      // 1. Fetch GDrive Folder
      const html = await fetchDriveFolderHtml(p.driveFolderId);
      const files = parseDriveHtml(html);
      
      if (files.length === 0) {
        console.log(`⚠️ No image files found in GDrive folder.`);
        continue;
      }
      
      console.log(`Found ${files.length} image files in folder.`);
      
      const productTempDir = path.join(tempDir, `prod_${p.id}`);
      if (!fs.existsSync(productTempDir)) {
        fs.mkdirSync(productTempDir, { recursive: true });
      }
      
      const uploadedUrls: Array<{ name: string; url: string }> = [];
      
      // 2. Download and Upload
      for (const file of files) {
        const destPath = path.join(productTempDir, file.name);
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        
        console.log(`  Downloading: "${file.name}"...`);
        try {
          await downloadFile(downloadUrl, destPath);
          
          const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
          const publicId = `prod_${p.id}_${cleanFileName}`;
          
          console.log(`  Uploading to Cloudinary: "${publicId}"...`);
          const secureUrl = await uploadToCloudinary(destPath, publicId);
          console.log(`  Uploaded successfully: ${secureUrl}`);
          uploadedUrls.push({ name: file.name, url: secureUrl });
          
          // Delete local file right after upload to save space
          fs.unlinkSync(destPath);
        } catch (fileErr) {
          console.error(`  ❌ Error processing file "${file.name}":`, fileErr);
        }
      }
      
      if (uploadedUrls.length === 0) {
        console.log(`⚠️ No files were successfully uploaded for this product.`);
        continue;
      }
      
      // 3. Separate Cover Image vs Gallery
      // Look for filename containing 'profile'
      const profileItem = uploadedUrls.find(item => item.name.toLowerCase().includes('profile'));
      const mainUrl = profileItem ? profileItem.url : uploadedUrls[0].url;
      const galleryUrls = uploadedUrls.map(item => item.url);
      
      syncResults[p.id] = { main: mainUrl, gallery: galleryUrls };
      console.log(`⭐ Selected Main Image: ${mainUrl}`);
      console.log(`⭐ Gallery count: ${galleryUrls.length}`);
      
      // 4. Update Static Code File
      updateStaticFile(p.id, mainUrl, galleryUrls);
      
      // 5. Update Database Record
      if (dbProducts.length > 0) {
        const spClean = cleanName(p.staticName);
        const matchedDbProduct = dbProducts.find(dbp => {
          const dbpClean = cleanName(dbp.name);
          return dbpClean.includes(spClean) || spClean.includes(dbpClean);
        });
        
        if (matchedDbProduct) {
          await prisma.product.update({
            where: { id: matchedDbProduct.id },
            data: {
              images: galleryUrls // Store the entire array of uploaded images
            }
          });
          console.log(`✅ Database updated for Product: "${matchedDbProduct.name}" (ID: ${matchedDbProduct.id})`);
        } else {
          console.warn(`⚠️ Could not find matched product in database for: "${p.staticName}"`);
        }
      }
      
      // Clean up product temp folder
      fs.rmdirSync(productTempDir);
      
    } catch (err) {
      console.error(`❌ Failed to sync Product ID ${p.id}:`, err);
    }
  }

  // Write mapping reference JSON
  const mappingPath = path.join(__dirname, '../scratch/cloudinary_mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(syncResults, null, 2), 'utf8');
  console.log(`\nMapping configuration saved to scratch/cloudinary_mapping.json`);
  
  // Clean up main temp folder
  if (fs.existsSync(tempDir)) {
    fs.rmdirSync(tempDir);
  }
  
  console.log("\n🎉 Sync Process Completed!");
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
