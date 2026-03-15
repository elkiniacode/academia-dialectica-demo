// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Read the CSV file from the root of your project
  const fileContent = fs.readFileSync('./clients.csv', 'utf-8');

  // 2. Parse the CSV content into an array of objects
  const records = parse(fileContent, {
    columns: true, // This automatically uses your first row as object keys
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} clients in the CSV. Starting migration...`);

  // 3. Loop through and upsert each client
  for (const record of records as Record<string, string>[]) {
    const clientName = record['Client Name']?.trim();
    const rawCost = record['Cost']?.trim();

    // Skip rows that don't have both a name and a cost
    if (!clientName || !rawCost) {
      console.warn(`Skipping invalid row: ${JSON.stringify(record)}`);
      continue;
    }

    // Parse the Cost: Remove the '$', commas, and spaces, then convert to a float
    const cleanCost = parseFloat(rawCost.replace(/[\$,\s]/g, ''));

    const student = record['Student']?.trim() || undefined;
    const grado = record['Grado']?.trim() || undefined;
    const celular = record['Cel']?.trim() || undefined;
    const correo = record['Correo']?.trim() || undefined;
    const direccion = record['Direccion']?.trim() || undefined;

    // Upsert the client into the database
    await prisma.client.upsert({
      where: { name: clientName },
      update: {
        hourlyRate: cleanCost,
        currency: 'COP',
        student,
        grado,
        celular,
        correo,
        direccion,
      },
      create: {
        name: clientName,
        hourlyRate: cleanCost,
        currency: 'COP',
        student,
        grado,
        celular,
        correo,
        direccion,
      },
    });

    console.log(`Upserted: ${clientName} at ${cleanCost} COP`);
  }

  console.log('✅ Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect(); // Always close the database connection
  });