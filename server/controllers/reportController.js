const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const puppeteer = require('puppeteer');
const { generateAiContent } = require('../services/aiService');
const { format } = require('date-fns'); 


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
    // --- LOG FOR DATA REPORT CHECKING---
    console.log("--- RECEIVED REQUEST BODY ON BACKEND ---");
    // console.log(JSON.stringify(req.body, null, 2));
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
        // --- All the calculations---
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
 * @desc    Get a single generated report by its ID, with all data filtered by the report's date range.
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReportById = async (req, res) => {
    const { id } = req.params;
    try {
        const report = await prisma.report.findFirst({
            where: {
                id,
                client: { tenantId: req.user.tenantId },
            },
            include: {
                client: true,
                questions: true,
            },
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        // Fetch the underlying waste data for the report period
        const wasteData = await prisma.wasteData.findMany({
            where: {
                clientId: report.clientId,
                // fetch any waste entry that was PICKED UP during the period
                pickupDate: {
                    gte: report.startDate,
                    lte: report.endDate,
                },
                wasteTypeId: {
                    in: report.includedWasteTypes,
                }
            },
            include: {
                wasteType: true,
                // fetch recycling processes that occurred WITHIN the report's date range.
                recyclingProcesses: {
                    where: {
                        recycledDate: {
                            gte: report.startDate,
                            lte: report.endDate,
                        }
                    },
                    orderBy: {
                        recycledDate: 'asc'
                    }
                }
            }
        });

        const fullReportPayload = {
            ...report,
            wasteData: wasteData, // contains the correctly filtered recycling logs
        };

        res.json(fullReportPayload);

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
/**
 * @desc    Use AI to generate answers for the report's insight questions
 * @route   POST /api/reports/generate-insights
 * @access  Private
 */
const generateAIInsights = async (req, res) => {
    const { clientId, startDate, endDate, includedWasteTypeIds, questions } = req.body;

    if (!clientId || !startDate || !endDate || !questions?.length) {
        return res.status(400).json({ message: 'Client, date range, and questions are required for AI insights.' });
    }

    try {
        const [client, wasteEntries] = await Promise.all([
            prisma.client.findUnique({ where: { id: clientId } }),
            prisma.wasteData.findMany({
                where: {
                    clientId,
                    pickupDate: { gte: new Date(startDate), lte: new Date(endDate) },
                    ...(includedWasteTypeIds?.length > 0 && { wasteTypeId: { in: includedWasteTypeIds } }),
                },
                include: {
                    wasteType: true,
                    recyclingProcesses: {
                        where: {
                            recycledDate: { gte: new Date(startDate), lte: new Date(endDate) }
                        }
                    }
                }
            })
        ]);

        if (!client) return res.status(404).json({ message: 'Client not found.' });

        const totalWeightRecycled = wasteEntries.flatMap(e => e.recyclingProcesses)
            .reduce((sum, process) => sum + process.quantityRecycled, 0);

        const prompt = `
As a professional sustainability consultant, generate concise and insightful answers for a waste management report.

Report Context:
- Client: ${client.companyName}
- Period: ${format(new Date(startDate), 'MMMM yyyy')} to ${format(new Date(endDate), 'MMMM yyyy')}
- Total Recycled Weight: ${totalWeightRecycled.toFixed(2)} kg

Questions:
${questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}

Provide only the answers, separated by a newline character.
        `;

        let aiResponse;
        try {
            aiResponse = await generateAiContent(prompt);
        } catch (err) {
            console.error("AI generation failed:", err);
            return res.status(500).json({ message: "AI service failed.", details: err.message });
        }

        const answers = aiResponse.split('\n').filter(ans => ans.trim() !== '');

        const answeredQuestions = questions.map((q, index) => ({
            ...q,
            answerText: answers[index] || "AI could not generate an answer for this question.",
        }));

        res.json({ questions: answeredQuestions });

    } catch (error) {
        console.error("Error generating AI insights:", error);
        res.status(500).json({ message: "Failed to generate AI insights." });
    }
};


module.exports = {
    getReports,
    generateReport,
    getReportConfigData,
    getWasteTypesForPeriod,
    getReportById,
    downloadReport,
    generateAIInsights,
};

