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

  // One business per seeded user, with the user as OWNER
  let business = await db.business.findFirst({
    where: { memberships: { some: { userId: user.id, role: "OWNER" } } },
  });
  if (!business) {
    business = await db.business.create({
      data: {
        name: "V12 Labs",
        email: EMAIL,
        addressLines: ["123 Example St", "San Francisco, CA 94102"],
        defaultCurrency: "USD",
        defaultTaxRate: 0,
        invoicePrefix: "INV-",
        nextInvoiceNumber: 1,
        memberships: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });
  }

  await db.client.upsert({
    where: { id: "seed-client-acme" },
    update: {},
    create: {
      id: "seed-client-acme",
      businessId: business.id,
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
      businessId: business.id,
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
