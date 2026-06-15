import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
  const properties = await prisma.property.findMany({
    include: { units: true },
  });

  for (const property of properties) {
    if (property.units.length > 0) continue;

    const unitCount = property.unitCount || 0;

    if (unitCount === 0) continue;

    await prisma.unit.createMany({
      data: Array.from({ length: unitCount }, (_, i) => ({
        unitNumber: String(i + 1),
        propertyId: property.id,
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 0,
      })),
    });
  }
}

backfill()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
