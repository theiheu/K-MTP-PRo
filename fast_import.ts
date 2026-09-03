import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from './lib/supabase.js';

async function main() {
  console.log('Reading data...');
  const data = JSON.parse(fs.readFileSync('vattu_data.json', 'utf8'));

  // 1. Get all categories and map them
  const { data: cats, error: catError } = await supabase.from('categories').select('id, name');
  if (catError) throw catError;

  const catMap = new Map();
  cats.forEach((c: any) => catMap.set(c.name, c.id));

  // Identify what's missing
  const neededCats = new Set<string>();
  data.forEach((r: any) => neededCats.add(r.DanhMuc));

  for (const catName of Array.from(neededCats)) {
    if (!catMap.has(catName)) {
      console.log(`Adding missing category: ${catName}`);
      const { data: newCat, error } = await supabase.from('categories').insert({ name: catName, icon: '' }).select().single();
      if (!error && newCat) {
        catMap.set(catName, newCat.id);
      }
    }
  }

  // 2. Prepare bulk product insert
  // Supabase limits payload size, but 800 simple rows is tiny (maybe 100kb). We can insert in batches of 200 just in case.
  const chunkSize = 200;
  let successCount = 0;

  console.log(`Starting bulk insert for ${data.length} products...`);
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    // Insert products
    const productsToInsert = chunk.map((r: any) => ({
      name: r.TenVatTu,
      description: `Mã vật tư: ${r.MaVatTu}`,
      images: [],
      category_id: catMap.get(r.DanhMuc),
      options: ['Mã SP'],
    }));

    const { data: insertedProducts, error: pError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select('id, name');

    if (pError) {
      console.error('Error inserting products chunk:', pError);
      continue;
    }

    // Map names to original data (assuming names are mostly unique, but we can match by index if order is preserved)
    // Actually, .select() usually returns in order if we don't order, but it's safer to map by name
    const variantsToInsert = [];
    
    for (let j = 0; j < insertedProducts.length; j++) {
      const p = insertedProducts[j];
      const r = chunk.find((c: any) => c.TenVatTu === p.name);
      if (r) {
        variantsToInsert.push({
          product_id: p.id,
          attributes: { 'Mã SP': r.MaVatTu },
          stock: 0,
          price: 0,
          images: [],
          unit: r.DVT
        });
      }
    }

    if (variantsToInsert.length > 0) {
      const { error: vError } = await supabase
        .from('variants')
        .insert(variantsToInsert);
      
      if (vError) {
        console.error('Error inserting variants chunk:', vError);
      } else {
        successCount += insertedProducts.length;
        console.log(`Inserted chunk... total ${successCount}`);
      }
    }
  }

  console.log(`\nBulk import completed! Successfully added ${successCount} items.`);
}

main().catch(console.error);
