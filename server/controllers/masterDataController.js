// In your masterDataController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Get all master data (global and tenant-specific)
 * @route   GET /api/master-data
 * @access  Private
 */
const getMasterData = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication error: User tenant not found.' });
    }

    const [
      wasteCategories,
      recyclingTechnologies,
      masterReportQuestions,
      facilities,
      pickupLocations,
      vehicleTypes,
    ] = await Promise.all([
      // --- Global Data ---
      prisma.wasteCategory.findMany({
        include: { types: { orderBy: { name: 'asc' } } },
        orderBy: { name: 'asc' },
      }),
      prisma.recyclingTechnology.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.masterReportQuestion.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),

      // --- Tenant-Specific Data (NOW WITH fullAddress) ---
      prisma.facility.findMany({
        where: { tenantId: tenantId },
        // Select the address needed for calculation
        select: { id: true, name: true, fullAddress: true }, 
        orderBy: { name: 'asc' },
      }),
      prisma.pickupLocation.findMany({
        where: { tenantId: tenantId },
        // Select the address needed for calculation
        select: { id: true, name: true, fullAddress: true },
        orderBy: { name: 'asc' },
      }),
      prisma.vehicleType.findMany({
        where: { tenantId: tenantId },
        select: { id: true, name: true }, // Vehicle doesn't need an address
        orderBy: { name: 'asc' },
      }),
    ]);

    res.json({
      wasteCategories,
      recyclingTechnologies,
      masterReportQuestions,
      facilities,
      pickupLocations,
      vehicleTypes,
    });

  } catch (error) {
    console.error("Error fetching master data:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getMasterData,
};