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
  // With multer, text fields are correctly populated in req.body
  const {
    clientId,
    wasteCategory,
    wasteType,
    quantity,
    unit,
    recycledDate,
    recyclingTechnology,
    pickupAddress,
    facilityAddress,
    distanceKm,
    vehicleType,
    pickupDate,
  } = req.body;

  if (!clientId || !wasteType || !quantity || !unit || !recycledDate) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Security check: Ensure the client belongs to the user's tenant
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: req.user.tenantId },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found or you do not have permission.' });
    }
    
    let imageUrl = [];
    // Handle multiple file fields from multer in req.files
    if (req.files) {
      const wasteImages = req.files['wasteImages'] || [];
      const recyclingImages = req.files['recyclingImages'] || [];
      const allFiles = [...wasteImages, ...recyclingImages];

      // ----- Local Upload (default active) -----
      // Creates a public path to the uploaded files
      imageUrl = allFiles.map(file => `/uploads/${file.filename}`);
      
      // ----- AWS S3 Upload (optional, uncomment to use S3) -----
      // const uploadPromises = allFiles.map(file => uploadToS3(file));
      // imageUrl = await Promise.all(uploadPromises);
    }

    // Convert quantity to a universal unit (KG) on the backend
    const quantityInKg = parseFloat(quantity) * (unitToKg[unit] || 1);

    const newWasteEntry = await prisma.wasteData.create({
      data: {
        clientId,
        wasteCategory,
        wasteType,
        quantity: quantityInKg, // Always store the value in KG
        unit: unit, // Store the original unit for display purposes
        recycledDate: new Date(recycledDate),
        recyclingTechnology,
        pickupAddress,
        facilityAddress,
        distanceKm: distanceKm ? parseFloat(distanceKm) : null,
        vehicleType,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        imageUrl, // Save the array of image paths/URLs
        createdById: req.user.userId,
      },
    });

    res.status(201).json(newWasteEntry);
  } catch (error) {
    console.error("Error creating waste entry:", error);
    // In a real app, you might want to clean up uploaded files if the DB transaction fails
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get all waste data entries for a specific client
 * @route   GET /api/waste-data/:clientId
 * @access  Private
 */
const getWasteEntriesForClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: req.user.tenantId },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found or you do not have permission.' });
    }

    const wasteEntries = await prisma.wasteData.findMany({
      where: { clientId },
      orderBy: { recycledDate: 'desc' },
    });

    res.json(wasteEntries);
  } catch (error) {
    console.error("Error fetching waste entries:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Only the controller functions should be exported
module.exports = {
  createWasteEntry,
  getWasteEntriesForClient,
};

