const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Get all generated reports for the tenant
 * @route   GET /api/reports
 * @access  Private
 */
const getReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: {
                client: {
                    tenantId: req.user.tenantId,
                },
            },
            include: {
                client: {
                    select: { companyName: true }
                }
            },
            orderBy: {
                generatedAt: 'desc',
            }
        });
        res.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Generate a new waste report
 * @route   POST /api/reports/generate
 * @access  Private
 */
const generateReport = async (req, res) => {
    // Destructuring fields based on the frontend form and schema
    const {
        clientId,
        startDate,
        endDate,
        includedWasteTypeIds, // Correctly named from schema
        questions,
        reportTitle,
    } = req.body;

    if (!clientId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Client and reporting period are required.' });
    }

    try {
        // --- Data Aggregation ---
        const wasteEntries = await prisma.wasteData.findMany({
            where: {
                clientId,
                recycledDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
                // --- THIS IS THE CRITICAL FIX ---
                // Filtering by the relational wasteTypeId
                ...(includedWasteTypeIds?.length > 0 && { wasteTypeId: { in: includedWasteTypeIds } }),
            },
        });
        
        // --- Calculations (Example) ---
        const totalWeightRecycled = wasteEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        // In a real app, these would be complex calculations based on factors
        const emissionsAvoided = totalWeightRecycled * 2.5; // Placeholder
        const logisticsEmissions = wasteEntries.reduce((sum, entry) => sum + (entry.distanceKm || 0) * 0.1, 0); // Placeholder
        const recyclingEmissions = totalWeightRecycled * 0.5; // Placeholder
        const netImpact = emissionsAvoided - (logisticsEmissions + recyclingEmissions);


        // --- Create Report in Database ---
        const newReport = await prisma.report.create({
            data: {
                reportTitle,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                includedWasteTypes: includedWasteTypeIds || [],
                
                // Calculated fields
                totalWeightRecycled,
                emissionsAvoided,
                logisticsEmissions,
                recyclingEmissions,
                netImpact,

                // Relations
                client: { connect: { id: clientId } },
                createdBy: { connect: { id: req.user.userId } },
                questions: {
                    create: questions, // Create the related question/answer records
                }
            },
            include: {
                questions: true, // Include the questions in the response
            }
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Get data needed to configure a new report (client list)
 * @route   GET /api/reports/config-data
 * @access  Private
 */
const getReportConfigData = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { tenantId: req.user.tenantId },
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });
    res.json({ clients });
  } catch (error) {
    console.error("Error fetching report config data:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get unique waste types for a client within a date range
 * @route   POST /api/reports/waste-types
 * @access  Private
 */
const getWasteTypesForPeriod = async (req, res) => {
    const { clientId, startDate, endDate } = req.body;
    if (!clientId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Client ID and date range are required.' });
    }
    try {
        const wasteEntries = await prisma.wasteData.findMany({
            where: {
                clientId,
                client: { tenantId: req.user.tenantId }, // Security check
                recycledDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            distinct: ['wasteTypeId'],
            select: {
                wasteType: {
                    select: { id: true, name: true }
                }
            }
        });
        const wasteTypes = wasteEntries.map(entry => entry.wasteType);
        res.json({ wasteTypes });
    } catch (error) {
        console.error("Error fetching waste types for period:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
/**
 * @desc    Get a single generated report by its ID
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReportById = async (req, res) => {
    const { id } = req.params;
    try {
        const report = await prisma.report.findFirst({
            where: {
                id,
                client: { tenantId: req.user.tenantId }, // Security check
            },
            include: {
                client: true,
                questions: true,
            },
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        res.json(report);
    } catch (error) {
        console.error("Error fetching report by ID:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {
    getReports,
    generateReport,
    getReportConfigData,
    getWasteTypesForPeriod,
    getReportById,
};

