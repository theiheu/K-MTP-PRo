import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

// Must import supabaseService after dotenv.config() so process.env is populated
import { categoriesService, productsService } from './services/supabaseService.js';

async function main() {
  console.log('Reading data...');
  const data = JSON.parse(fs.readFileSync('vattu_data.json', 'utf8'));

  const categories = new Set<string>();
  data.forEach((r: any) => categories.add(r.DanhMuc));

  console.log(`Found ${categories.size} categories. Inserting categories...`);
  for (const cat of Array.from(categories)) {
    try {
      await categoriesService.create({ name: cat, icon: '' });
      console.log(`- Created category: ${cat}`);
    } catch (e: any) {
      if (e.code === '23505') {
        console.log(`- Category exists: ${cat}`);
      } else {
        console.error(`- Error category ${cat}:`, e.message);
      }
    }
  }

  console.log(`\nInserting ${data.length} products...`);
  let successCount = 0;
  for (const r of data) {
    try {
      await productsService.create({
        name: r.TenVatTu,
        description: `Mã vật tư: ${r.MaVatTu}`,
        images: [],
        category: r.DanhMuc,
        options: ['Mã SP'],
        variants: [
          {
            id: '', // Supabase generated
            attributes: { 'Mã SP': r.MaVatTu },
            stock: 0,
            price: 0,
            unit: r.DVT
          }
        ]
      });
      successCount++;
      if (successCount % 50 === 0) {
         console.log(`... inserted ${successCount} items`);
      }
    } catch (e: any) {
      // Ignore duplicate product errors if any
      console.error(`- Error inserting ${r.TenVatTu}:`, e.message);
    }
  }

  console.log(`\nDone! Successfully imported ${successCount} items.`);
}

main().catch(console.error);
