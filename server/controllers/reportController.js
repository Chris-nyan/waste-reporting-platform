const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const puppeteer = require('puppeteer');

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

// --- Helper for formatting numbers ---
const formatNumber = (num) => parseFloat(num.toFixed(2));

/**
 * @desc    Generate a new waste report
 * @route   POST /api/reports/generate
 * @access  Private
 */
const generateReport = async (req, res) => {
    // --- ADD THIS LOG ---
    console.log("--- RECEIVED REQUEST BODY ON BACKEND ---");
    console.log(JSON.stringify(req.body, null, 2));
    // --------------------
    const {
        clientId,
        startDate,
        endDate,
        includedWasteTypeIds,
        questions, // The array with the 'text' field
        reportTitle,
    } = req.body;

    if (!clientId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Client and reporting period are required.' });
    }

    try {
        // --- All the calculations from Phase 1 remain the same ---
        const wasteEntries = await prisma.wasteData.findMany({ /* ... */ });
        const totalWeightRecycled = wasteEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const formatNumber = (num) => parseFloat(num.toFixed(2));
        const emissionsAvoided = totalWeightRecycled * 2.5;
        const logisticsEmissions = wasteEntries.reduce((sum, entry) => sum + (entry.distanceKm || 0) * 0.1, 0);
        const recyclingEmissions = totalWeightRecycled * 0.5;
        const netImpact = emissionsAvoided - (logisticsEmissions + recyclingEmissions);
        const diversionRate = 85;
        const totalWasteGenerated = totalWeightRecycled / (diversionRate / 100);
        const carsOffRoadEquivalent = (netImpact / 1000) * 0.22;
        const treesSaved = (totalWeightRecycled / 1000) * 17;
        const landfillSpaceSaved = (totalWeightRecycled / 1000) * 3;

        // --- The data object preparation ---
        const reportData = {
            reportTitle,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            includedWasteTypes: includedWasteTypeIds || [],
            totalWeightRecycled: formatNumber(totalWeightRecycled),
            emissionsAvoided: formatNumber(emissionsAvoided),
            logisticsEmissions: formatNumber(logisticsEmissions),
            recyclingEmissions: formatNumber(recyclingEmissions),
            netImpact: formatNumber(netImpact),
            diversionRate,
            totalWasteGenerated: formatNumber(totalWasteGenerated),
            carsOffRoadEquivalent: formatNumber(carsOffRoadEquivalent),
            treesSaved: formatNumber(treesSaved),
            landfillSpaceSaved: formatNumber(landfillSpaceSaved),
            client: { connect: { id: clientId } },
            createdBy: { connect: { id: req.user.userId } },
        };

        // --- THE FIX IS HERE ---
        // We now transform the 'questions' array to match the database schema.
        if (questions && questions.length > 0) {
            reportData.questions = {
                create: questions.map(q => ({
                    questionText: q.text, // Rename 'text' to 'questionText'
                    answerText: q.answerText,
                })),
            };
        }

        const newReport = await prisma.report.create({
            data: reportData,
            include: {
                questions: true,
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
/**
 * @desc    Download a generated report as a PDF
 * @route   GET /api/reports/:id/download
 * @access  Private
 */
const downloadReport = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch the same data as the preview page
        const report = await prisma.report.findFirst({
            where: {
                id,
                client: { tenantId: req.user.tenantId },
            },
            include: { client: true, questions: true },
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        // 2. Create an HTML template for the PDF
        const htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        h1 { color: #22c55e; }
                        .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .question { margin-top: 20px; }
                        .question p { margin: 0; }
                        .question .q-text { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>${report.reportTitle}</h1>
                    <p>Client: ${report.client.companyName}</p>
                    <hr>
                    <h2>Key Metrics</h2>
                    <div class="metric"><span>Total Weight Recycled:</span> <span>${report.totalWeightRecycled.toFixed(2)} kg</span></div>
                    <div class="metric"><span>Emissions Avoided:</span> <span>${report.emissionsAvoided.toFixed(2)} kg CO2e</span></div>
                    <div class="metric"><span>Net Impact:</span> <span>${report.netImpact.toFixed(2)} kg CO2e</span></div>
                    
                    <h2>Insights</h2>
                    ${report.questions.map(q => `
                        <div class="question">
                            <p class="q-text">${q.text}</p>
                            <p>${q.answerText || 'N/A'}</p>
                        </div>
                    `).join('')}
                </body>
            </html>
        `;

        // 3. Use Puppeteer to generate the PDF
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] }); // Use --no-sandbox in containerized environments
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        // 4. Send the PDF to the client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${report.id}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: 'Failed to generate PDF.' });
    }
};


module.exports = {
    getReports,
    generateReport,
    getReportConfigData,
    getWasteTypesForPeriod,
    getReportById,
    downloadReport,
};

