const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- HASH A DUMMY PASSWORD ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // --- CLEAN UP EXISTING DATA (in correct order) ---
  console.log('Clearing existing data...');
  await prisma.reportQuestion.deleteMany(); // Must be deleted before reports
  await prisma.report.deleteMany();
  await prisma.wasteData.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.wasteType.deleteMany();
  await prisma.wasteCategory.deleteMany();
  await prisma.recyclingTechnology.deleteMany();
  await prisma.masterReportQuestion.deleteMany(); // <-- ADD THIS
  await prisma.tenant.deleteMany();
  console.log('Cleared existing data.');

  // --- CREATE MASTER DATA (EXPANDED) ---
  console.log('Creating comprehensive master data...');
  
  // --- (Waste Categories & Technologies remain the same) ---
  const plasticCategory = await prisma.wasteCategory.create({ data: { name: 'Plastic', types: { create: [ { name: 'PET (Polyethylene Terephthalate)' }, { name: 'HDPE (High-Density Polyethylene)' }, { name: 'PVC (Polyvinyl Chloride)' }, { name: 'LDPE (Low-Density Polyethylene)' }, { name: 'PP (Polypropylene)' }, { name: 'PS (Polystyrene)' }, { name: 'Mixed Plastics' }, ] } }, include: { types: true } });
  const paperCategory = await prisma.wasteCategory.create({ data: { name: 'Paper & Cardboard', types: { create: [ { name: 'Corrugated Cardboard' }, { name: 'Newspaper' }, { name: 'Magazines & Glossy Paper' }, { name: 'Office Paper (White & Colored)' }, { name: 'Mixed Paper' }, { name: 'Paperboard (e.g., cereal boxes)' }, ] } }, include: { types: true } });
  const metalCategory = await prisma.wasteCategory.create({ data: { name: 'Metal', types: { create: [ { name: 'Aluminum Cans' }, { name: 'Steel Cans (Tin Cans)' }, { name: 'Aluminum Foil & Trays' }, { name: 'Ferrous Scrap Metal' }, { name: 'Non-Ferrous Scrap Metal (Copper, Brass)' }, ] } }, include: { types: true } });
  const glassCategory = await prisma.wasteCategory.create({ data: { name: 'Glass', types: { create: [ { name: 'Clear Glass' }, { name: 'Brown Glass' }, { name: 'Green Glass' }, ] } }, include: { types: true } });
  const organicCategory = await prisma.wasteCategory.create({ data: { name: 'Organic Waste', types: { create: [ { name: 'Food Waste (Pre-consumer)' }, { name: 'Food Waste (Post-consumer)' }, { name: 'Yard Trimmings & Green Waste' }, { name: 'Wood & Lumber' }, ]}}, include: { types: true } });
  const eWasteCategory = await prisma.wasteCategory.create({ data: { name: 'E-Waste', types: { create: [ { name: 'Batteries (Alkaline, Li-ion)' }, { name: 'Small Appliances' }, { name: 'IT & Telecom Equipment' }, { name: 'Cables & Wires' }, { name: 'Lamps & Light Bulbs' }, ]}}, include: { types: true } });
  const hazardousCategory = await prisma.wasteCategory.create({ data: { name: 'Hazardous Waste', types: { create: [ { name: 'Paints & Solvents' }, { name: 'Oils & Lubricants' }, { name: 'Chemicals & Cleaners' }, { name: 'Medical Sharps' }, ]}}, include: { types: true } });
  const mechanicalRecycling = await prisma.recyclingTechnology.create({ data: { name: 'Mechanical Recycling' } });
  const chemicalRecycling = await prisma.recyclingTechnology.create({ data: { name: 'Chemical Recycling (Pyrolysis)' } });
  const smelting = await prisma.recyclingTechnology.create({ data: { name: 'Smelting' } });
  const composting = await prisma.recyclingTechnology.create({ data: { name: 'Industrial Composting' } });
  const anaerobicDigestion = await prisma.recyclingTechnology.create({ data: { name: 'Anaerobic Digestion' } });
  const culletProcessing = await prisma.recyclingTechnology.create({ data: { name: 'Cullet Processing' } });
  const refining = await prisma.recyclingTechnology.create({ data: { name: 'Refining and Purification' } });
  const secureDestruction = await prisma.recyclingTechnology.create({ data: { name: 'Secure Destruction & Recovery' } });

  // --- NEW: CREATE MASTER REPORT QUESTIONS ---
  await prisma.masterReportQuestion.createMany({
    data: [
      { text: "Executive Summary: What were the key achievements and overall performance for this reporting period?", displayOrder: 1 },
      { text: "Program Objectives: What were the primary goals set for waste management and recycling during this time?", displayOrder: 2 },
      { text: "Initiatives Implemented: Describe any new programs, training, or operational changes introduced to improve sustainability.", displayOrder: 3 },
      { text: "Performance Analysis: How did the actual recycling rates compare to the objectives? Please explain any significant variances.", displayOrder: 4 },
      { text: "Challenges Encountered: What were the main obstacles faced (e.g., contamination, logistics, low participation)?", displayOrder: 5 },
      { text: "Solutions & Corrective Actions: How were the challenges addressed? What measures were taken to overcome them?", displayOrder: 6 },
      { text: "Cost-Benefit Analysis: Were there any notable cost savings or financial benefits realized from the recycling program?", displayOrder: 7 },
      { text: "Stakeholder Engagement: How were employees, customers, or the community involved in these initiatives?", displayOrder: 8 },
      { text: "Future Goals & Outlook: What are the key objectives and targets for the next reporting period?", displayOrder: 9 },
      { text: "Compliance & Regulatory Notes: Are there any compliance-related notes or regulatory changes to be aware of?", displayOrder: 10 },
    ],
  });

  console.log('Master data created.');

  // --- (Tenant, User, Client, and WasteData creation remains the same) ---
  const tenant1 = await prisma.tenant.create({ data: { companyName: 'EcoSolutions Inc.' } });
  console.log(`Created tenant: ${tenant1.companyName}`);
  const adminUser1 = await prisma.user.create({ data: { email: 'admin@ecosolutions.com', name: 'Alice Admin', password: hashedPassword, role: 'ADMIN', tenantId: tenant1.id } });
  console.log(`Created user: ${adminUser1.email}`);
  const client1 = await prisma.client.create({ data: { companyName: 'Global Tech Corp', tenantId: tenant1.id, createdById: adminUser1.id } });
  const client2 = await prisma.client.create({ data: { companyName: 'Local Foods Ltd.', tenantId: tenant1.id, createdById: adminUser1.id } });
  console.log('Created clients for EcoSolutions Inc.');
  await prisma.wasteData.create({ data: { client: { connect: { id: client1.id } }, createdBy: { connect: { id: adminUser1.id } }, wasteType: { connect: { id: paperCategory.types.find(t => t.name === 'Corrugated Cardboard').id } }, recyclingTechnology: { connect: { id: mechanicalRecycling.id } }, quantity: 550.5, unit: 'KG', recycledDate: new Date(), pickupDate: new Date(), } });
  await prisma.wasteData.create({ data: { clientId: client1.id, createdById: adminUser1.id, wasteTypeId: plasticCategory.types.find(t => t.name === 'PET (Polyethylene Terephthalate)').id, recyclingTechnologyId: chemicalRecycling.id, quantity: 230.0, unit: 'KG', recycledDate: new Date(), pickupDate: new Date(), } });
  await prisma.wasteData.create({ data: { clientId: client2.id, createdById: adminUser1.id, wasteTypeId: metalCategory.types.find(t => t.name === 'Aluminum Cans').id, recyclingTechnologyId: smelting.id, quantity: 75.2, unit: 'LB', recycledDate: new Date(), pickupDate: new Date(), } });
  console.log('Created waste data for EcoSolutions Inc.');
  
  // --- CREATE SUPER ADMIN USER ---
  await prisma.user.create({ data: { email: 'superadmin@platform.com', name: 'Platform Admin', password: hashedPassword, role: 'SUPER_ADMIN' } });
  console.log('Created Super Admin user.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

