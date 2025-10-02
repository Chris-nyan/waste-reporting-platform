const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

// -------- AWS S3 CONFIG (commented out by default) --------
// const AWS = require('aws-sdk');
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION
// });

// async function uploadToS3(file) {
//   const fileContent = fs.readFileSync(file.path);
//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET_NAME,
//     Key: `waste-entries/${Date.now()}-${file.originalname}`,
//     Body: fileContent,
//     ContentType: file.mimetype,
//   };
//   try {
//      const result = await s3.upload(params).promise();
//      fs.unlinkSync(file.path); // Clean up temp file from /uploads
//      return result.Location; // public URL
//   } catch (error) {
//      console.error("S3 Upload Error:", error);
//      fs.unlinkSync(file.path); // Clean up temp file even on error
//      throw error;
//   }
// }
// ----------------------------------------------------------


// Conversion factors to KG - placed on the backend for data consistency
const unitToKg = {
  KG: 1,
  G: 0.001,
  T: 1000,
  LB: 0.453592,
};

/**
 * @desc    Create a new waste data entry for a client
 * @route   POST /api/waste-data
 * @access  Private
 */
const createWasteEntry = async (req, res) => {
  // --- DEBUGGING: Log the incoming request body from the frontend ---
  console.log("Backend received body:", req.body);
  console.log("Backend received files:", req.files);
  
  const {
    clientId,
    wasteCategoryId,
    wasteTypeId,
    quantity,
    unit,
    recycledDate,
    recyclingTechnologyId,
    pickupAddress,
    facilityAddress,
    distanceKm,
    vehicleType,
    pickupDate,
  } = req.body;

  if (!clientId || !wasteTypeId || !quantity || !unit || !recycledDate) {
    console.error("Validation Failed. Missing one or more required fields.");
    console.error({ clientId, wasteTypeId, quantity, unit, recycledDate });
    return res.status(400).json({ message: 'Missing required fields. Please check server logs for details.' });
  }

  try {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: req.user.tenantId },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found or you do not have permission.' });
    }
    
    let imageUrl = [];
    if (req.files) {
      const wasteImages = req.files['wasteImages'] || [];
      const recyclingImages = req.files['recyclingImages'] || [];
      const allFiles = [...wasteImages, ...recyclingImages];
      imageUrl = allFiles.map(file => `/uploads/${file.filename}`);
    }

    const quantityInKg = parseFloat(quantity) * (unitToKg[unit] || 1);

    const newWasteEntry = await prisma.wasteData.create({
      data: {
        // --- THIS IS THE CRITICAL FIX ---
        // Instead of providing clientId directly, we use 'connect'
        // to establish the relation to the existing Client record.
        client: {
          connect: { id: clientId }
        },
        createdBy: {
          connect: { id: req.user.userId }
        },
        wasteType: {
          connect: { id: wasteTypeId }
        },
        ...(recyclingTechnologyId && { 
            recyclingTechnology: { 
                connect: { id: recyclingTechnologyId } 
            } 
        }),
        quantity: quantityInKg,
        unit: unit,
        recycledDate: new Date(recycledDate),
        pickupAddress,
        facilityAddress,
        distanceKm: distanceKm ? parseFloat(distanceKm) : null,
        vehicleType,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        imageUrl,
      },
    });

    res.status(201).json(newWasteEntry);
  } catch (error) {
    console.error("Error creating waste entry:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get all waste data entries for a specific client
 * @route   GET /api/waste-data/:clientId
 * @access  Private
 */
const getWasteEntriesForClient = async (req, res) => {
    // This function will also be updated to return the full related data
    try {
        const { clientId } = req.params;
        const client = await prisma.client.findFirst({
            where: { id: clientId, tenantId: req.user.tenantId },
        });
        if (!client) {
            return res.status(404).json({ message: 'Client not found.' });
        }
        const wasteEntries = await prisma.wasteData.findMany({
            where: { clientId },
            orderBy: { recycledDate: 'desc' },
            include: {
                wasteType: { include: { category: true } },
                recyclingTechnology: true,
            }
        });
        // Remap data to be more frontend friendly
        const formattedEntries = wasteEntries.map(entry => ({
            ...entry,
            wasteCategory: entry.wasteType.category.name,
            wasteType: entry.wasteType.name,
            recyclingTechnology: entry.recyclingTechnology?.name || null,
        }));
        res.json(formattedEntries);
    } catch (error) {
        console.error("Error fetching waste entries:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Update an existing waste data entry
 * @route   PUT /api/waste-data/:id
 * @access  Private
 */
const updateWasteEntry = async (req, res) => {
  const { id } = req.params;
  const {
    pickupDate,
    wasteCategoryId, // Not directly used, but good to get
    wasteTypeId,
    quantity,
    unit,
    recycledDate,
    recyclingTechnologyId,
    vehicleType,
    pickupAddress,
    facilityAddress,
    distanceKm,
  } = req.body;

  try {
    // Security check: ensure the entry belongs to the user's tenant
    const existingEntry = await prisma.wasteData.findFirst({
      where: { id, client: { tenantId: req.user.tenantId } },
    });

    if (!existingEntry) {
      return res.status(404).json({ message: 'Waste entry not found or you do not have permission.' });
    }

    const updatedEntry = await prisma.wasteData.update({
      where: { id },
      data: {
        pickupDate: pickupDate ? new Date(pickupDate) : undefined,
        wasteTypeId: wasteTypeId,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit: unit,
        recycledDate: recycledDate ? new Date(recycledDate) : undefined,
        recyclingTechnologyId: recyclingTechnologyId,
        vehicleType: vehicleType,
        pickupAddress: pickupAddress,
        facilityAddress: facilityAddress,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      },
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating waste entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @desc    Delete a waste data entry
 * @route   DELETE /api/waste-data/:id
 * @access  Private
 */
const deleteWasteEntry = async (req, res) => {
  const { id } = req.params;

  try {
    // Security check
    const existingEntry = await prisma.wasteData.findFirst({
      where: { id, client: { tenantId: req.user.tenantId } },
    });

    if (!existingEntry) {
      return res.status(404).json({ message: 'Waste entry not found or you do not have permission.' });
    }
    
    // In production, you would also delete associated images from cloud storage here
    // existingEntry.imageUrls.forEach(url => deleteFromS3(url));

    await prisma.wasteData.delete({
      where: { id },
    });

    res.json({ message: 'Waste entry deleted successfully' });
  } catch (error) {
    console.error("Error deleting waste entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Only the controller functions should be exported
module.exports = {
  createWasteEntry,
  getWasteEntriesForClient,
  updateWasteEntry,
  deleteWasteEntry,
};
