import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const EMAIL = process.env.ALLOWED_EMAIL ?? "sharath@v12labs.io";

async function main() {
  const user = await db.user.upsert({
    where: { email: EMAIL },
    update: {},
    create: { email: EMAIL, name: "Sharath" },
  });

  await db.businessProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: "V12 Labs",
      email: EMAIL,
      addressLines: ["123 Example St", "San Francisco, CA 94102"],
      defaultCurrency: "USD",
      defaultTaxRate: 0,
      invoicePrefix: "INV-",
      nextInvoiceNumber: 1,
    },
  });

  await db.client.upsert({
    where: { id: "seed-client-acme" },
    update: {},
    create: {
      id: "seed-client-acme",
      userId: user.id,
      name: "Acme Corp",
      email: "billing@acme.example",
      addressLines: ["500 Market St", "San Francisco, CA 94105"],
    },
  });

  await db.product.upsert({
    where: { id: "seed-product-consulting" },
    update: {},
    create: {
      id: "seed-product-consulting",
      userId: user.id,
      name: "Consulting hour",
      description: "Senior engineering consulting",
      unitPrice: 20000,
      currency: "USD",
      defaultTaxRate: 0,
    },
  });

  console.log(`\nSeed complete. Log in at http://localhost:3000/login with ${EMAIL}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
