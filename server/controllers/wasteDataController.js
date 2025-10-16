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
    wasteTypeId,
    quantity,
    unit,
    recycledDate,
    recyclingTechnologyId,
    pickupLocationId,
    facilityId,
    vehicleTypeId,
    distanceKm,
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
        client: { connect: { id: clientId } },
        createdBy: { connect: { id: req.user.userId } },
        wasteType: { connect: { id: wasteTypeId } },
        ...(recyclingTechnologyId && {
          recyclingTechnology: { connect: { id: recyclingTechnologyId } }
        }),
        ...(pickupLocationId && {
          pickupLocation: { connect: { id: pickupLocationId } }
        }),
        ...(facilityId && {
          facility: { connect: { id: facilityId } }
        }),
        ...(vehicleTypeId && {
          vehicleType: { connect: { id: vehicleTypeId } }
        }),
        quantity: parseFloat(quantity) * (unitToKg[unit] || 1),
        unit,
        recycledDate: new Date(recycledDate),
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        distanceKm: distanceKm ? parseFloat(distanceKm) : null,
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
  try {
    const { clientId } = req.params;

    // Ensure client belongs to current tenant
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: req.user.tenantId },
    });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // Fetch all waste data entries
    const wasteEntries = await prisma.wasteData.findMany({
      where: { clientId },
      orderBy: { recycledDate: 'desc' },
      include: {
        wasteType: { include: { category: true } },
        recyclingTechnology: { select: { id: true, name: true } },
        pickupLocation: { select: { id: true, name: true, fullAddress: true } },
        facility: { select: { id: true, name: true, fullAddress: true } },
        vehicleType: { select: { id: true, name: true } },
      },
    });

    // Format response data for frontend
    const formattedEntries = wasteEntries.map(entry => ({
      id: entry.id,
      pickupDate: entry.pickupDate,
      recycledDate: entry.recycledDate,
      quantity: entry.quantity,
      unit: entry.unit,
      distanceKm: entry.distanceKm,

      wasteCategory: entry.wasteType?.category?.name || 'N/A',
      wasteType: entry.wasteType?.name || 'N/A',
      recyclingTechnology: entry.recyclingTechnology?.name || 'N/A',

      pickupLocation: entry.pickupLocation?.name || 'N/A',
      pickupAddress: entry.pickupLocation?.fullAddress || 'N/A',

      facility: entry.facility?.name || 'N/A',
      facilityAddress: entry.facility?.fullAddress || 'N/A',

      vehicleType: entry.vehicleType?.name || 'N/A',

      imageUrls: Array.isArray(entry.imageUrl)
        ? entry.imageUrl
        : entry.imageUrl
          ? JSON.parse(entry.imageUrl)
          : [],
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
    vehicleTypeId,
    pickupLocationId,
    facilityId,
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
        wasteTypeId,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit,
        recycledDate: recycledDate ? new Date(recycledDate) : undefined,
        recyclingTechnologyId,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        ...(pickupLocationId && { pickupLocationId }),
        ...(facilityId && { facilityId }),
        ...(vehicleTypeId && { vehicleTypeId }),
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


const getTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    const styleHeaderRow = (worksheet, rowHeight = 25) => {
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004d40' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = rowHeight;
    };

    // =========================
    // 1. Data Entry Sheet
    // =========================
    const entrySheet = workbook.addWorksheet('Data Entry');
    entrySheet.columns = [
      { header: 'pickupDate', key: 'pickupDate', width: 15 },
      { header: 'recycledDate', key: 'recycledDate', width: 15 },
      { header: 'wasteTypeName', key: 'wasteTypeName', width: 25 },
      { header: 'recyclingTechName', key: 'recyclingTechName', width: 25 },
      { header: 'quantity', key: 'quantity', width: 10 },
      { header: 'unit', key: 'unit', width: 10 },
      { header: 'pickupLocationName', key: 'pickupLocationName', width: 25 },
      { header: 'facilityName', key: 'facilityName', width: 25 },
      { header: 'vehicleTypeName', key: 'vehicleTypeName', width: 25 },
    ];
    styleHeaderRow(entrySheet, 30);

    // Add sample row
    entrySheet.addRow({
      pickupDate: '2025-10-05',
      recycledDate: '2025-10-06',
      wasteTypeName: '',
      recyclingTechName: '',
      quantity: 0,
      unit: 'KG',
      pickupLocationName: '',
      facilityName: '',
      vehicleTypeName: '',
    });

    // =========================
    // 2. Load Reference Data
    // =========================
    const [wasteTypes, recyclingTechs, pickupLocations, facilities, vehicleTypes] =
      await Promise.all([
        prisma.wasteType.findMany({ select: { id: true, name: true } }),
        prisma.recyclingTechnology.findMany({ select: { id: true, name: true } }),
        prisma.pickupLocation.findMany({ select: { id: true, name: true } }),
        prisma.facility.findMany({ select: { id: true, name: true } }),
        prisma.vehicleType.findMany({ select: { id: true, name: true } }),
      ]);

    // =========================
    // 3. Create Hidden Reference Sheets
    // =========================
    const createReferenceSheet = (sheetName, data) => {
      const ws = workbook.addWorksheet(sheetName, { state: 'veryHidden' });
      ws.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'ID', key: 'id', width: 45 },
      ];
      ws.addRows(data.map(d => ({ name: d.name, id: d.id })));
      styleHeaderRow(ws, 25);
      return ws;
    };

    const wtSheet = createReferenceSheet('Ref_WasteTypes', wasteTypes);
    const techSheet = createReferenceSheet('Ref_Technologies', recyclingTechs);
    const pickupSheet = createReferenceSheet('Ref_PickupLocations', pickupLocations);
    const facSheet = createReferenceSheet('Ref_Facilities', facilities);
    const vehSheet = createReferenceSheet('Ref_VehicleTypes', vehicleTypes);

    // =========================
    // 4. Add Dropdowns
    // =========================
    const addDropdown = (columnLetter, refSheet, rowCount = 100) => {
      for (let i = 2; i <= rowCount + 1; i++) {
        entrySheet.getCell(`${columnLetter}${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`='${refSheet.name}'!$A$2:$A$${refSheet.rowCount}`],
          showErrorMessage: true,
          errorStyle: 'stop',
          error: 'Please select a valid value from the list',
        };
      }
    };

    addDropdown('C', wtSheet); // wasteTypeName
    addDropdown('D', techSheet); // recyclingTechName
    addDropdown('G', pickupSheet); // pickupLocationName
    addDropdown('H', facSheet); // facilityName
    addDropdown('I', vehSheet); // vehicleTypeName

    // =========================
    // 5. Units Dropdown
    // =========================
    const units = ['KG', 'G', 'T', 'LB'];
    for (let i = 2; i <= 101; i++) {
      entrySheet.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${units.join(',')}"`],
        showErrorMessage: true,
        errorStyle: 'stop',
        error: 'Please select a valid unit',
      };
    }

    // =========================
    // 6. Send Workbook
    // =========================
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="waste_data_template.xlsx"');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Excel template:', error);
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

  // Security check: verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId: req.user.tenantId },
  });
  if (!client) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(404).json({ message: 'Client not found or you do not have permission.' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.getWorksheet('Data Entry');

    if (!worksheet) {
      throw new Error("The uploaded file must contain a sheet named 'Data Entry'.");
    }

    // ===============================================
    // Load reference tables to map names
    // ===============================================
    const [wasteTypes, recyclingTechs, pickupLocations, facilities, vehicleTypes] =
      await Promise.all([
        prisma.wasteType.findMany({ select: { id: true, name: true } }),
        prisma.recyclingTechnology.findMany({ select: { id: true, name: true } }),
        prisma.pickupLocation.findMany({ select: { id: true, name: true, fullAddress: true } }),
        prisma.facility.findMany({ select: { id: true, name: true, fullAddress: true } }),
        prisma.vehicleType.findMany({ select: { id: true, name: true } }),
      ]);

    // Helper: map any name to actual ID
    const mapId = (value, list) => {
      if (!value) return null;
      const val = String(value).trim().toLowerCase();
      const match =
        list.find(
          (item) =>
            item.id === value ||
            item.shortId?.toLowerCase() === val ||
            item.name?.toLowerCase() === val
        ) || null;
      return match ? match.id : null;
    };

    // ===============================================
    // Unit Conversion Table
    // ===============================================
    const unitToKg = {
      KG: 1,
      G: 0.001,
      TON: 1000,
      L: 1, // optional if liquid weight ≈ 1kg/L
    };

    const validatedData = [];

    // ===============================================
    // Process each row
    // ===============================================
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      const rowData = {
        pickupDate: row.getCell(1).value,
        recycledDate: row.getCell(2).value,
        wasteTypeValue: row.getCell(3).value,
        recyclingTechValue: row.getCell(4).value,
        quantity: row.getCell(5).value,
        unit: row.getCell(6).value,
        pickupLocationValue: row.getCell(7).value,
        facilityValue: row.getCell(8).value,
        vehicleTypeValue: row.getCell(9).value,
      };

      // Skip empty rows
      if (!rowData.recycledDate && !rowData.wasteTypeValue && !rowData.quantity) continue;

      // Required field validation
      if (!rowData.pickupDate || !rowData.recycledDate || !rowData.wasteTypeValue || !rowData.quantity || !rowData.unit) {
        throw new Error(`Row ${i} is missing required fields (pickupDate, recycledDate, wasteType, quantity, unit).`);
      }

      // Convert to actual IDs
      const wasteTypeId = mapId(rowData.wasteTypeValue, wasteTypes);
      const recyclingTechnologyId = mapId(rowData.recyclingTechValue, recyclingTechs);
      const pickupLocationId = mapId(rowData.pickupLocationValue, pickupLocations);
      const facilityId = mapId(rowData.facilityValue, facilities);
      const vehicleTypeId = mapId(rowData.vehicleTypeValue, vehicleTypes);

      if (!wasteTypeId) {
        throw new Error(`Row ${i} has invalid Waste Type: '${rowData.wasteTypeValue}'`);
      }

      // Validate and parse dates
      const recycledDate = new Date(rowData.recycledDate);
      const pickupDate = new Date(rowData.pickupDate);
      if (isNaN(recycledDate.getTime()) || isNaN(pickupDate.getTime())) {
        throw new Error(`Row ${i} has invalid date format. Use YYYY-MM-DD.`);
      }

      // Calculate distance if both addresses exist
      let distanceKm = null;
      if (pickupLocationId && facilityId) {
        const pickupLoc = pickupLocations.find((p) => p.id === pickupLocationId);
        const facilityLoc = facilities.find((f) => f.id === facilityId);
        if (pickupLoc?.fullAddress && facilityLoc?.fullAddress) {
          distanceKm = await getDistanceKm(pickupLoc.fullAddress, facilityLoc.fullAddress);
        }
      }

      // Parse quantity and convert to kg
      const quantityKg = parseFloat(rowData.quantity) * (unitToKg[String(rowData.unit).toUpperCase()] || 1);

      // ===============================================
      // Prepare validated entry
      // ===============================================
      validatedData.push({
        clientId,
        createdById: req.user.userId,
        wasteTypeId,
        recyclingTechnologyId,
        pickupLocationId,
        facilityId,
        vehicleTypeId,
        quantity: quantityKg,
        unit: String(rowData.unit).toUpperCase(),
        recycledDate,
        pickupDate,
        distanceKm,
      });
    }

    // ===============================================
    // Database Insertion
    // ===============================================
    if (validatedData.length > 0) {
      const result = await prisma.wasteData.createMany({ data: validatedData });
      res.status(201).json({ message: `${result.count} entries created successfully!` });
    } else {
      res.status(200).json({ message: 'No valid rows found in the uploaded file.' });
    }
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    res.status(400).json({ message: error.message });
  } finally {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
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
