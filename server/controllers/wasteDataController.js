const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const ExcelJS = require('exceljs');

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

// csv-parser for bulk upload
const csv = require('csv-parser');
const { format, writeToString } = require('fast-csv');
const axios = require('axios');

async function getDistanceKm(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!origin || !destination) {
    return null; // Can't calculate if an address is missing
  }

  if (!apiKey) {
    console.warn("⚠️ Google Maps API key missing. Returning MOCK distance for bulk upload.");
    return parseFloat((Math.random() * (100 - 10) + 10).toFixed(2));
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=metric&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      return parseFloat((distanceInMeters / 1000).toFixed(2));
    } else {
      console.error("❌ Google API error during bulk upload:", data.error_message || 'Could not calculate distance.');
      return null; // Return null on API error
    }
  } catch (error) {
    console.error("🚨 Distance Matrix API request failed during bulk upload:", error.message);
    return null; // Return null on network error
  }
}
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

// ===============================================
// Generate Excel Template
// ===============================================
const getTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    // --- Helper function to style header rows ---
    const styleHeaderRow = (worksheet, rowHeight = 25) => {
      const headerRow = worksheet.getRow(1);
      headerRow.font = {
        name: 'Calibri',
        size: 14, // Set font size
        bold: true, // Make it bold
        color: { argb: 'FFFFFFFF' } // White text
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF004d40' } // Dark Green background
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = rowHeight;
    };
    // --- Sheet 1: Instructions ---
    const instructionsSheet = workbook.addWorksheet('Instructions');

    // --- NEW: Add a prominent instruction block ---
    instructionsSheet.mergeCells('A1:D1');
    const titleCell = instructionsSheet.getCell('A1');
    titleCell.value = '⚠️ Important: Please Read Before Filling';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFBF0000' } }; // Dark Red
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    instructionsSheet.getRow(1).height = 30;

    instructionsSheet.addRow([]); // Add a blank row for spacing

    const instructions = [
      '1. Do NOT change, rename, or delete any column headers in the "Data Entry" sheet.',
      '2. Always use the exact IDs provided in the "Reference" sheets. Do not enter names or create your own IDs.',
      '3. Please read the description for each column below carefully before entering your data.',
    ];
    instructions.forEach(inst => {
      const row = instructionsSheet.addRow([inst]);
      instructionsSheet.mergeCells(`A${row.number}:D${row.number}`);
      row.getCell(1).font = { name: 'Calibri', size: 12, bold: true };
    });

    instructionsSheet.addRow([]); // Add another blank row
    // --- END of new block ---


    // Define and style the main instruction table header
    const mainHeaderRow = instructionsSheet.addRow(['Column Name', 'Description', 'Required?', 'Example']);
    mainHeaderRow.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    mainHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004d40' } };
    mainHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    instructionsSheet.columns = [
      { key: 'column', width: 25 }, { key: 'desc', width: 60 },
      { key: 'req', width: 50 }, { key: 'ex', width: 35 },
    ];

    // Add the detailed instruction rows
    instructionsSheet.addRows([
      { column: 'pickupDate', desc: 'The date the material was picked up. Must be in YYYY-MM-DD format.', req: 'No', ex: '2025-10-05' }, // NEW
      { column: 'recycledDate', desc: 'The date the material was recycled. Must be in YYYY-MM-DD format.', req: 'Yes', ex: '2025-10-07' },
      { column: 'wasteTypeId', desc: 'The unique ID for the type of waste. Go to the "Reference - Waste Types" sheet, find the material, and copy the ID from the column next to it.', req: 'Yes', ex: 'cmg7otx650001s8v80f7kwbpb' },
      { column: 'recyclingTechnologyId', desc: 'The unique ID for the recycling technology used. Go to the "Reference - Technologies" sheet and copy the ID. This is optional and can be left blank.', req: 'No', ex: 'clxyztechid001...' },
      { column: 'quantity', desc: 'The numerical amount of the waste. Do not include units like "kg" here.', req: 'Yes', ex: '150.75' },
      { column: 'unit', desc: 'The unit of measurement. Must be one of: KG, G, T, LB.', req: 'Yes', ex: 'KG' },
      { column: 'pickupAddress', desc: 'The full street address where the waste was collected. Used to calculate distance. Can be left blank.', req: 'Optional unless you want to calculate carbon emission', ex: '123 Main St, Bangkok, Thailand' },
      { column: 'facilityAddress', desc: 'The full street address of the recycling facility. Used to calculate distance. Can be left blank.', req: 'Optional unless you want to calculate carbon emisison', ex: '456 Industrial Park, Samut Prakan, Thailand' },
      { column: 'vehicleType', desc: 'The type of vehicle used for transport (e.g., Truck, Van). This is optional.', req: 'Optional', ex: 'Truck' }
    ]);
    instructionsSheet.getColumn('desc').alignment = { wrapText: true, vertical: 'top' };

    // --- Sheet 2: Data Entry ---
    const entrySheet = workbook.addWorksheet('Data Entry');
    entrySheet.columns = [
      { header: 'pickupDate', key: 'pickupDate', width: 15 }, // NEW
      { header: 'recycledDate', key: 'recycledDate', width: 15 },
      { header: 'wasteTypeId', key: 'wasteTypeId', width: 30 },
      { header: 'recyclingTechnologyId', key: 'recyclingTechnologyId', width: 30 }, // NEW
      { header: 'quantity', key: 'quantity', width: 10 },
      { header: 'unit', key: 'unit', width: 10 },
      { header: 'pickupAddress', key: 'pickupAddress', width: 40 },
      { header: 'facilityAddress', key: 'facilityAddress', width: 40 },
      { header: 'vehicleType', key: 'vehicleType', width: 20 },
    ];
    styleHeaderRow(entrySheet, 30);
    entrySheet.addRow({
      pickupDate: '2025-10-05',
      recycledDate: '2025-10-06',
      wasteTypeId: 'Copy ID from "Waste Types" sheet',
      recyclingTechnologyId: 'Copy ID from "Technologies" sheet (Optional)',
      quantity: 123.45,
      unit: 'KG',
    });

    // --- Sheet 3: Reference for Waste Types ---
    const wasteTypeSheet = workbook.addWorksheet('Reference - Waste Types');
    wasteTypeSheet.columns = [
      { header: 'Waste Type Name', key: 'name', width: 30 },
      { header: 'ID (Copy this value)', key: 'id', width: 30 },
    ];
    wasteTypeSheet.views = [{ state: 'frozen', ySplit: 1 }];
    const wasteTypes = await prisma.wasteType.findMany({ select: { id: true, name: true } });
    styleHeaderRow(wasteTypeSheet, 30);
    wasteTypeSheet.addRows(wasteTypes);

    // --- Sheet 4: Reference for Technologies ---
    const techSheet = workbook.addWorksheet('Reference - Technologies'); // NEW
    techSheet.columns = [
      { header: 'Technology Name', key: 'name', width: 30 },
      { header: 'ID (Copy this value)', key: 'id', width: 30 },
    ];
    techSheet.views = [{ state: 'frozen', ySplit: 1 }];
    const technologies = await prisma.recyclingTechnology.findMany({ select: { id: true, name: true } });
    styleHeaderRow(techSheet, 30);
    techSheet.addRows(technologies);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="waste_data_template.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error generating Excel template:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ===============================================
// Handle Bulk Excel Upload
// ===============================================
const bulkCreateWasteEntries = async (req, res) => {
  const { clientId } = req.body;
  const file = req.file;
  if (!clientId || !file) {
    return res.status(400).json({ message: 'Client ID and a file are required.' });
  }

  // Security check to ensure the client belongs to the user's tenant
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId: req.user.tenantId }
  });
  if (!client) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(404).json({ message: "Client not found or you do not have permission." });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.getWorksheet('Data Entry');

    if (!worksheet) {
      throw new Error("The uploaded file must contain a sheet named 'Data Entry'.");
    }

    const validWasteTypeIds = (await prisma.wasteType.findMany({ select: { id: true } })).map(wt => wt.id);
    const validatedData = [];

    // Iterate over all rows starting from row 2 (to skip the header)
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      // --- FIX: Access cells by column NUMBER, not by name ---
      const rowData = {
        pickupDate: row.getCell(1).value, // NEW
        recycledDate: row.getCell(2).value,
        wasteTypeId: row.getCell(3).value,
        recyclingTechnologyId: row.getCell(4).value,
        quantity: row.getCell(5).value,
        unit: row.getCell(6).value,
        pickupAddress: row.getCell(7).value,
        facilityAddress: row.getCell(8).value,
        vehicleType: row.getCell(9).value,
      };

      // Skip if the row is effectively empty (all primary fields are null)
      if (!rowData.recycledDate && !rowData.wasteTypeId && !rowData.quantity) {
        continue;
      }

      // --- Validation ---
      if (!rowData.pickupDate ||!rowData.recycledDate || !rowData.wasteTypeId || !rowData.quantity || !rowData.unit) {
        throw new Error(`Row ${i} is missing one or more required values (pickupDate, recycledDate, wasteTypeId, quantity, unit).`);
      }
      if (!validWasteTypeIds.includes(String(rowData.wasteTypeId))) {
        throw new Error(`Row ${i} has an invalid or unrecognized wasteTypeId: '${rowData.wasteTypeId}'`);
      }
      const parsedRecycledDate = new Date(rowData.recycledDate);
      if (isNaN(parsedRecycledDate.getTime())) {
        throw new Error(`Row ${i} has an invalid date for recycledDate. Use YYYY-MM-DD.`);
      }

      let parsedPickupDate = null;
      if (rowData.pickupDate) {
        parsedPickupDate = new Date(rowData.pickupDate);
        if (isNaN(parsedPickupDate.getTime())) {
          throw new Error(`Row ${i} has an invalid date for pickupDate. Use YYYY-MM-DD.`);
        }
      }

      // Auto-calculate distance
      const distance = await getDistanceKm(rowData.pickupAddress, rowData.facilityAddress);

      // Prepare the final object for Prisma
      const entry = {
        clientId,
        createdById: req.user.userId,
        wasteTypeId: String(rowData.wasteTypeId),
        quantity: parseFloat(rowData.quantity) * (unitToKg[String(rowData.unit).toUpperCase()] || 1),
        unit: String(rowData.unit).toUpperCase(),
        recycledDate: parsedRecycledDate,
        pickupDate: parsedPickupDate, // NEW: Set pickupDate same as recycledDate if not provided
        pickupAddress: rowData.pickupAddress ? String(rowData.pickupAddress) : null,
        facilityAddress: rowData.facilityAddress ? String(rowData.facilityAddress) : null,
        distanceKm: distance,
        vehicleType: rowData.vehicleType ? String(rowData.vehicleType) : null,
      };

      // Conditionally add the technology relation if it exists
      if (rowData.recyclingTechnologyId) {
        entry.recyclingTechnologyId = String(rowData.recyclingTechnologyId);
      }

      validatedData.push(entry);
    }

    // Final check and database insertion
    if (validatedData.length > 0) {
      const result = await prisma.wasteData.createMany({ data: validatedData });
      res.status(201).json({ message: `${result.count} entries created successfully!` });
    } else {
      res.status(200).json({ message: "No new data rows were found in the uploaded file." });
    }

  } catch (error) {
    console.error("Error processing bulk upload:", error);
    res.status(400).json({ message: error.message });
  } finally {
    // Ensure the temporary file is always deleted
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};
// Only the controller functions should be exported
module.exports = {
  createWasteEntry,
  getWasteEntriesForClient,
  updateWasteEntry,
  deleteWasteEntry,
  getTemplate,
  bulkCreateWasteEntries,
};
