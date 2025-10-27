const { PrismaClient } = require('@prisma/client');
// Add 'format' for monthly grouping
const { subMonths, format } = require('date-fns');
const prisma = new PrismaClient();

// A placeholder for emission factors (in a real app, this would be in a separate config or table)
const EMISSION_FACTORS = {
    'Cardboard': 2.5,
    'PET': 1.8,
    'Aluminum': 9.1,
    'Glass': 0.8,
    'Default': 1.5, // Average factor for other materials
};

const getTenantDashboard = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { timeframe, start, end } = req.query;
        let startDate;
        let endDate = new Date();

        if (timeframe === '30d') startDate = subMonths(endDate, 1);
        else if (timeframe === '3m') startDate = subMonths(endDate, 3);
        else if (timeframe === '6m') startDate = subMonths(endDate, 6);
        else if (timeframe === '1y') startDate = subMonths(endDate, 12);
        else if (timeframe === 'custom' && start && end) {
            startDate = new Date(start);
            endDate = new Date(end);
        } else startDate = new Date(0); // default: all time

        // --- KPI Card Calculations (Partial) ---
        const clientCount = await prisma.client.count({ where: { tenantId } });

        const reportCount = await prisma.report.count({
            where: {
                client: { tenantId },
                generatedAt: { gte: startDate, lte: endDate },
            },
        });
        console.log('--- DEBUGGING QUERY ---');
        console.log('Tenant ID:', tenantId);
        console.log('Start Date (gte):', startDate.toISOString());
        console.log('End Date (lte):', endDate.toISOString());

        // --- Main Data Fetch (OPTIMIZED) ---
        // We now fetch all related data in one go for efficiency
        const wasteEntries = await prisma.wasteData.findMany({
            where: {
                client: { tenantId },
                pickupDate: { gte: startDate, lte: endDate },
            },
            include: {
                client: { select: { companyName: true, id: true } }, // Include 'id' for leaderboard logic
                wasteType: {
                    include: {
                        category: { select: { name: true } } // NEW: For 'Waste by Category' chart
                    }
                },
                facility: { select: { name: true } } // NEW: For 'Waste by Facility' chart
            }
        });

        const totalWasteEntries = wasteEntries.length;

        // --- KPI & Chart Data Initializers ---
        let totalRecycledWeight = 0;
        let totalEmissionsAvoided = 0;
        const wasteByTypeMap = {};
        const clientPerformanceMap = {};
        const monthlyPickupMap = {};
        const wasteByCategoryMap = {};
        const emissionsBreakdownMap = {};
        const wasteByFacilityMap = {};

        // Iterate over waste entries ONCE to build all data maps
        for (const entry of wasteEntries) {
            const quantity = entry.quantity;
            const wasteTypeName = entry.wasteType.name;

            // 1. Calculate Total Weight
            totalRecycledWeight += quantity;

            // 2. Calculate Emissions (for KPI & Chart)
            const emissionFactor = EMISSION_FACTORS[wasteTypeName] || EMISSION_FACTORS['Default'];
            const emissions = quantity * emissionFactor;
            totalEmissionsAvoided += emissions;
            emissionsBreakdownMap[wasteTypeName] = (emissionsBreakdownMap[wasteTypeName] || 0) + emissions;

            // 3. Aggregate for 'Waste by Type' chart (Original)
            wasteByTypeMap[wasteTypeName] = (wasteByTypeMap[wasteTypeName] || 0) + quantity;

            // 4. Aggregate for 'Client Performance' (Original)
            clientPerformanceMap[entry.client.companyName] = (clientPerformanceMap[entry.client.companyName] || 0) + quantity;


            // 5. NEW: Aggregate for 'Monthly Pickup Trend'
            const monthKeyPickup = format(entry.pickupDate, 'yyyy-MM');
            monthlyPickupMap[monthKeyPickup] = (monthlyPickupMap[monthKeyPickup] || 0) + quantity;


            // 6. NEW: Aggregate for 'Waste by Category'
            const categoryName = entry.wasteType.category?.name || 'Uncategorized';
            wasteByCategoryMap[categoryName] = (wasteByCategoryMap[categoryName] || 0) + quantity;

            // 7. NEW: Aggregate for 'Waste by Facility'
            const facilityName = entry.facility?.name || 'Unspecified Facility';
            wasteByFacilityMap[facilityName] = (wasteByFacilityMap[facilityName] || 0) + quantity;
        }

        // --- Helper to format map data for charts ---
        const formatChartData = (map) => Object.entries(map)
            .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
            .sort((a, b) => b.value - a.value); // Sort descending by value

        // --- Format Chart Data ---
        const wasteByTypeChart = formatChartData(wasteByTypeMap);
        const wasteByCategoryChart = formatChartData(wasteByCategoryMap);
        const emissionsAvoidedBreakdownChart = formatChartData(emissionsBreakdownMap);
        const wasteByFacilityChart = formatChartData(wasteByFacilityMap);

        // Format monthly data and sort by date (ascending)
        const monthlyPickupTrend = Object.entries(monthlyPickupMap)
            .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
            .sort((a, b) => a.name.localeCompare(b.name));

        // --- Client Leaderboard Logic (Original, slightly cleaner) ---
        const allReportsInPeriod = await prisma.report.findMany({
            where: { client: { tenantId }, generatedAt: { gte: startDate, lte: endDate } },
            select: { clientId: true }
        });

        const clientLeaderboardData = Object.entries(clientPerformanceMap)
            .map(([clientName, totalWeight]) => {
                // Find the client ID from the entries we already have
                const clientId = wasteEntries.find(we => we.client.companyName === clientName)?.client.id;
                const reportsGenerated = allReportsInPeriod.filter(r => r.clientId === clientId).length;
                return { clientName, totalWeight: parseFloat(totalWeight.toFixed(2)), reportsGenerated };
            })
            .sort((a, b) => b.totalWeight - a.totalWeight);

        // --- Client Waste Breakdown Logic (Original, unchanged) ---
        const top5ClientNames = clientLeaderboardData.slice(0, 5).map(c => c.clientName);
        const wasteTypes = [...new Set(wasteEntries.map(e => e.wasteType.name))];

        const clientWasteBreakdown = top5ClientNames.map(clientName => {
            const clientData = { clientName };
            wasteTypes.forEach(type => {
                const total = wasteEntries
                    .filter(entry => entry.client.companyName === clientName && entry.wasteType.name === type)
                    .reduce((sum, entry) => sum + entry.quantity, 0);
                clientData[type] = parseFloat(total.toFixed(2));
            });
            return clientData;
        });

        // --- Final Response Object ---
        res.json({
            kpis: {
                totalClients: clientCount,
                totalWasteEntries,
                totalReportsGenerated: reportCount,
                totalRecycledWeight: parseFloat(totalRecycledWeight.toFixed(2)),
                totalEmissionsAvoided: parseFloat(totalEmissionsAvoided.toFixed(2)), // <-- NEW KPI
            },
            charts: {
                // Original Charts
                clientLeaderboard: clientLeaderboardData,
                clientWasteBreakdown: {
                    data: clientWasteBreakdown,
                    wasteTypes,
                },
                // NEW Charts
                monthlyPickupTrend,
                wasteByType: wasteByTypeChart, // Renamed from 'wasteBreakdownChartData'
                wasteByCategory: wasteByCategoryChart,
                emissionsAvoidedBreakdown: emissionsAvoidedBreakdownChart,
                wasteByFacility: wasteByFacilityChart,
            },
        });

    } catch (error) {
        console.error("Error fetching tenant dashboard data:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getSuperAdminDashboard = async (req, res) => {
    // This function remains the same
};

module.exports = {
    getTenantDashboard,
    getSuperAdminDashboard,
};