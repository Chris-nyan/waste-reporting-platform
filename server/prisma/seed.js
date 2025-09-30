const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- HASH A DUMMY PASSWORD ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // --- CLEAN UP EXISTING DATA ---
  await prisma.report.deleteMany();
  await prisma.wasteData.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('Cleared existing data.');

  // --- CREATE TENANT 1: EcoSolutions Inc. ---
  const tenant1 = await prisma.tenant.create({
    data: {
      companyName: 'EcoSolutions Inc.',
      logoUrl: 'https://example.com/logo_eco.png',
      primaryColor: '#34D399',
    },
  });
  console.log(`Created tenant: ${tenant1.companyName}`);

  // --- CREATE USERS FOR TENANT 1 ---
  const adminUser1 = await prisma.user.create({
    data: {
      email: 'admin@ecosolutions.com',
      name: 'Alice Admin',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant1.id,
    },
  });
  console.log(`Created user: ${adminUser1.email}`);

  // --- CREATE CLIENTS FOR TENANT 1 ---
  const client1_1 = await prisma.client.create({
    data: {
      companyName: 'Global Tech Corp',
      contactPerson: 'John Doe',
      email: 'john.doe@globaltech.com',
      tenantId: tenant1.id,
      createdById: adminUser1.id,
    },
  });

  const client1_2 = await prisma.client.create({
    data: {
      companyName: 'Local Foods Ltd.',
      contactPerson: 'Jane Smith',
      email: 'jane.smith@localfoods.com',
      tenantId: tenant1.id,
      createdById: adminUser1.id,
    },
  });
  console.log('Created clients for EcoSolutions Inc.');
  
  // --- CREATE WASTE DATA FOR TENANT 1's CLIENTS (WITH NEW FIELDS) ---
  await prisma.wasteData.createMany({
    data: [
      { 
        wasteCategory: 'Paper',
        wasteType: 'Cardboard', 
        quantity: 550.5, 
        unit: 'KG', 
        recycledDate: new Date(), 
        clientId: client1_1.id, 
        createdById: adminUser1.id,
        
        // New fields
        recyclingTechnology: 'Mechanical Recycling',
        vehicleType: 'Heavy-duty truck',
        pickupDate: new Date(),
        pickupAddress: '123 Main St, City A',
        facilityAddress: 'Recycling Plant A',
        distanceKm: 12.4,
        imageUrl: 'https://example.com/cardboard.jpg'
      },
      { 
        wasteCategory: 'Plastic',
        wasteType: 'PET Plastic', 
        quantity: 230.0, 
        unit: 'KG', 
        recycledDate: new Date(), 
        clientId: client1_1.id, 
        createdById: adminUser1.id,
        
        recyclingTechnology: 'Chemical Recycling',
        vehicleType: 'Light-duty truck',
        pickupDate: new Date(),
        pickupAddress: '456 Side Rd, City B',
        facilityAddress: 'Recycling Plant B',
        distanceKm: 8.7,
        imageUrl: 'https://example.com/pet-plastic.jpg'
      },
      { 
        wasteCategory: 'Metal',
        wasteType: 'Aluminum', 
        quantity: 75.2, 
        unit: 'KG', 
        recycledDate: new Date(), 
        clientId: client1_2.id, 
        createdById: adminUser1.id,
        
        recyclingTechnology: 'Smelting',
        vehicleType: 'Light-duty truck',
        pickupDate: new Date(),
        pickupAddress: '789 Industrial Rd, City C',
        facilityAddress: 'Metal Recovery Facility',
        distanceKm: 20.1,
        imageUrl: 'https://example.com/aluminum.jpg'
      },
    ]
  })
  console.log('Created waste data for EcoSolutions Inc.');
  
  console.log('---');

  // --- CREATE TENANT 2: GreenWorks Logistics ---
  const tenant2 = await prisma.tenant.create({
    data: {
      companyName: 'GreenWorks Logistics',
      logoUrl: 'https://example.com/logo_green.png',
      primaryColor: '#60A5FA',
    },
  });
  console.log(`Created tenant: ${tenant2.companyName}`);

  // --- CREATE USER FOR TENANT 2 ---
  const adminUser2 = await prisma.user.create({
    data: {
      email: 'manager@greenworks.com',
      name: 'Bob Manager',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant2.id,
    },
  });
  console.log(`Created user: ${adminUser2.email}`);

  // --- CREATE CLIENT FOR TENANT 2 ---
  const client2_1 = await prisma.client.create({
    data: {
      companyName: 'City Hospital',
      contactPerson: 'Dr. Carol White',
      email: 'c.white@cityhospital.com',
      tenantId: tenant2.id,
      createdById: adminUser2.id,
    },
  });
  console.log('Created clients for GreenWorks Logistics.');

  // --- CREATE WASTE DATA FOR TENANT 2's CLIENT (WITH NEW FIELDS) ---
  await prisma.wasteData.createMany({
    data: [
      { 
        wasteType: 'Glass', 
        quantity: 1.2, 
        unit: 'TONNE', 
        recycledDate: new Date(), 
        clientId: client2_1.id, 
        createdById: adminUser2.id,
        recyclingTechnology: 'Cullet Processing',
        vehicleType: 'Heavy-duty truck',
        pickupDate: new Date(),
      },
    ]
  });
  console.log('Created waste data for GreenWorks Logistics.');
  
  // --- CREATE SUPER ADMIN USER ---
  await prisma.user.create({
    data: {
      email: 'superadmin@platform.com', // Changed email for clarity
      name: 'Platform Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });
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
