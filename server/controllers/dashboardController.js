const { PrismaClient } = require('@prisma/client');
const { subMonths, startOfDay, endOfDay, format } = require('date-fns');

const prisma = new PrismaClient();

// A placeholder for emission factors (in a real app, this would be in a separate config or table)
const EMISSION_FACTORS = {
  'Cardboard': 2.5,
  'PET Plastic': 1.8,
  'Aluminum': 9.1,
  'Glass': 0.8,
  'Default': 1.5, // Average factor for other materials
};

const getTenantDashboard = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { timeframe } = req.query;

    let startDate;
    const endDate = new Date();

    if (timeframe === '6m') startDate = subMonths(endDate, 6);
    else if (timeframe === '1y') startDate = subMonths(endDate, 12);
    else startDate = new Date(0);

    const wasteEntries = await prisma.wasteData.findMany({
      where: { client: { tenantId }, recycledDate: { gte: startDate, lte: endDate } },
      include: { client: { select: { id: true, companyName: true } } },
    });

    const reports = await prisma.report.findMany({
        where: { client: { tenantId }, createdAt: { gte: startDate, lte: endDate } },
        select: { clientId: true }
    });

    // --- KPI Card Calculations ---
    const clientCount = await prisma.client.count({ where: { tenantId } });
    const totalReportsGenerated = reports.length;
    const totalWasteEntries = wasteEntries.length;
    const totalRecycledWeight = wasteEntries.reduce((sum, entry) => sum + entry.quantity, 0);

    // --- Chart Data Calculations ---
    
    // 1. Client Leaderboard (Table)
    const clientPerformance = wasteEntries.reduce((acc, entry) => {
        const { id, companyName } = entry.client;
        if (!acc[id]) {
            acc[id] = { clientName: companyName, totalWeight: 0, reportsGenerated: 0 };
        }
        acc[id].totalWeight += entry.quantity;
        return acc;
    }, {});

    reports.forEach(report => {
        if(clientPerformance[report.clientId]) {
            clientPerformance[report.clientId].reportsGenerated += 1;
        }
    });
    const clientLeaderboardData = Object.values(clientPerformance)
        .sort((a, b) => b.totalWeight - a.totalWeight);

    // 2. Client Waste Breakdown (Stacked Bar Chart)
    const top5ClientNames = clientLeaderboardData.slice(0, 5).map(c => c.clientName);
    const wasteTypes = [...new Set(wasteEntries.map(e => e.wasteType))]; // Get all unique waste types

    const clientWasteBreakdown = top5ClientNames.map(clientName => {
        const clientData = { clientName };
        wasteTypes.forEach(type => {
            const total = wasteEntries
                .filter(entry => entry.client.companyName === clientName && entry.wasteType === type)
                .reduce((sum, entry) => sum + entry.quantity, 0);
            clientData[type] = parseFloat(total.toFixed(2));
        });
        return clientData;
    });


    res.json({
      kpis: {
        totalClients: clientCount,
        totalWasteEntries,
        totalReportsGenerated,
        totalRecycledWeight: parseFloat(totalRecycledWeight.toFixed(2)),
      },
      charts: {
        clientLeaderboard: clientLeaderboardData,
        clientWasteBreakdown: {
            data: clientWasteBreakdown,
            wasteTypes: wasteTypes, // Send the keys for the chart
        },
      },
    });

  } catch (error) {
    console.error("Error fetching tenant dashboard data:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ... (getSuperAdminDashboard and module.exports)
const getSuperAdminDashboard = async (req, res) => {
    try {
        const tenantCount = await prisma.tenant.count();
        const activeTenants = await prisma.tenant.count({ where: { status: 'ACTIVE' }});
        const pausedTenants = await prisma.tenant.count({ where: { status: 'PAUSED' }});
        const totalUsers = await prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } });
        const estimatedRevenue = activeTenants * 99;
        res.json({
            totalTenants: tenantCount,
            activeTenants,
            pausedTenants,
            totalTenantUsers: totalUsers,
            estimatedMonthlyRevenue: estimatedRevenue
        });
    } catch (error) {
        console.error("Error fetching super admin dashboard data:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
  getTenantDashboard,
  getSuperAdminDashboard,
};

