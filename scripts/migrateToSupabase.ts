/**
 * Migration Script: LocalStorage to Supabase
 *
 * This script helps migrate data from localStorage to Supabase database.
 * Run this in the browser console after setting up Supabase.
 */

import { supabase } from '../lib/supabase';
import {
  productsService,
  categoriesService,
  zonesService,
  requisitionsService,
  receiptsService,
  deliveryNotesService,
} from '../services/supabaseService';

const STORAGE_KEYS = {
  PRODUCTS: 'chicken_farm_products',
  CATEGORIES: 'chicken_farm_categories',
  ZONES: 'chicken_farm_zones',
  REQUISITIONS: 'chicken_farm_requisitions',
  RECEIPTS: 'chicken_farm_receipts',
  DELIVERY_NOTES: 'chicken_farm_delivery_notes',
};

export async function migrateLocalStorageToSupabase() {
  console.log('🚀 Starting migration from localStorage to Supabase...');

  try {
    // 1. Migrate Categories first (products depend on categories)
    console.log('📦 Migrating categories...');
    const categoriesData = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (categoriesData) {
      const categories = JSON.parse(categoriesData);
      for (const category of categories) {
        try {
          await categoriesService.create(category);
          console.log(`✅ Migrated category: ${category.name}`);
        } catch (error: any) {
          if (error.code === '23505') {
            // Duplicate key, skip
            console.log(`⏭️  Category already exists: ${category.name}`);
          } else {
            console.error(`❌ Error migrating category ${category.name}:`, error);
          }
        }
      }
    }

    // 2. Migrate Zones
    console.log('[object Object]
    const zonesData = localStorage.getItem(STORAGE_KEYS.ZONES);
    if (zonesData) {
      const zones = JSON.parse(zonesData);
      for (const zone of zones) {
        try {
          await zonesService.create({
            name: zone.name,
            description: zone.description || '',
          });
          console.log(`✅ Migrated zone: ${zone.name}`);
        } catch (error: any) {
          if (error.code === '23505') {
            console.log(`⏭️  Zone already exists: ${zone.name}`);
          } else {
            console.error(`❌ Error migrating zone ${zone.name}:`, error);
          }
        }
      }
    }

    // 3. Migrate Products
    console.log('📦 Migrating products...');
    const productsData = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (productsData) {
      const products = JSON.parse(productsData);
      for (const product of products) {
        try {
          await productsService.create(product);
          console.log(`✅ Migrated product: ${product.name}`);
        } catch (error) {
          console.error(`❌ Error migrating product ${product.name}:`, error);
        }
      }
    }

    // 4. Migrate Requisitions
    console.log('📦 Migrating requisitions...');
    const requisitionsData = localStorage.getItem(STORAGE_KEYS.REQUISITIONS);
    if (requisitionsData) {
      const requisitions = JSON.parse(requisitionsData);
      for (const requisition of requisitions) {
        try {
          await requisitionsService.create({
            requesterName: requisition.requesterName,
            zone: requisition.zone,
            purpose: requisition.purpose,
            status: requisition.status,
            items: requisition.items,
            fulfilledBy: requisition.fulfilledBy,
            fulfilledAt: requisition.fulfilledAt,
            fulfillmentNotes: requisition.fulfillmentNotes,
          });
          console.log(`✅ Migrated requisition: ${requisition.id}`);
        } catch (error) {
          console.error(`❌ Error migrating requisition ${requisition.id}:`, error);
        }
      }
    }

    // 5. Migrate Receipts
    console.log('📦 Migrating receipts...');
    const receiptsData = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    if (receiptsData) {
      const receipts = JSON.parse(receiptsData);
      for (const receipt of receipts) {
        try {
          await receiptsService.create({
            supplier: receipt.supplier,
            notes: receipt.notes,
            createdBy: receipt.createdBy,
            items: receipt.items,
            linkedRequisitionIds: receipt.linkedRequisitionIds || [],
          });
          console.log(`✅ Migrated receipt: ${receipt.id}`);
        } catch (error) {
          console.error(`❌ Error migrating receipt ${receipt.id}:`, error);
        }
      }
    }

    // 6. Migrate Delivery Notes
    console.log('📦 Migrating delivery notes...');
    const deliveryNotesData = localStorage.getItem(STORAGE_KEYS.DELIVERY_NOTES);
    if (deliveryNotesData) {
      const deliveryNotes = JSON.parse(deliveryNotesData);
      for (const note of deliveryNotes) {
        try {
          await deliveryNotesService.create({
            receiptId: note.receiptId,
            shipperId: note.shipperId,
            status: note.status,
            createdBy: note.createdBy,
            items: note.items,
          });
          console.log(`✅ Migrated delivery note: ${note.id}`);
        } catch (error) {
          console.error(`❌ Error migrating delivery note ${note.id}:`, error);
        }
      }
    }

    console.log('✨ Migration completed successfully!');
    console.log('💡 You can now backup your localStorage data and clear it if needed.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export function to backup localStorage data
export function backupLocalStorage() {
  const backup = {
    timestamp: new Date().toISOString(),
    data: {
      products: localStorage.getItem(STORAGE_KEYS.PRODUCTS),
      categories: localStorage.getItem(STORAGE_KEYS.CATEGORIES),
      zones: localStorage.getItem(STORAGE_KEYS.ZONES),
      requisitions: localStorage.getItem(STORAGE_KEYS.REQUISITIONS),
      receipts: localStorage.getItem(STORAGE_KEYS.RECEIPTS),
      deliveryNotes: localStorage.getItem(STORAGE_KEYS.DELIVERY_NOTES),
    },
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `localStorage-backup-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);
  console.log('✅ LocalStorage backup downloaded!');
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).migrateToSupabase = migrateLocalStorageToSupabase;
  (window as any).backupLocalStorage = backupLocalStorage;
}

