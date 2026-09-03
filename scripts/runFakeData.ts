import { config } from 'dotenv';
config();

async function run() {
  const { generateFakeData } = await import('./fakeData.js');
  await generateFakeData();
  console.log('Xong!');
  process.exit(0);
}

run().catch(console.error);
