import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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

  const sampleClient = await db.client.upsert({
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

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.session.create({
    data: { userId: user.id, sessionToken, expires },
  });

  console.log("\n=== Seed complete ===");
  console.log(`User:       ${user.email}`);
  console.log(`Client:     ${sampleClient.name}`);
  console.log(`\nSession cookie (valid 30 days):`);
  console.log(`  Name:  authjs.session-token`);
  console.log(`  Value: ${sessionToken}`);
  console.log(`\nTo log in, open http://localhost:3000, then in DevTools Console run:`);
  console.log(`  document.cookie = 'authjs.session-token=${sessionToken}; path=/; max-age=2592000'`);
  console.log(`Then reload.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
