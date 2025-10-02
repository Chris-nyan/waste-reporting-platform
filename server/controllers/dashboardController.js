const { PrismaClient } = require('@prisma/client');
const { subMonths } = require('date-fns');
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
    const { timeframe } = req.query;

    let startDate;
    const endDate = new Date();

    if (timeframe === '6m') startDate = subMonths(endDate, 6);
    else if (timeframe === '1y') startDate = subMonths(endDate, 12);
    else startDate = new Date(0);

    // --- KPI Card Calculations ---
    const clientCount = await prisma.client.count({ where: { tenantId } });

    // --- THIS IS THE CRITICAL FIX ---
    // The query now correctly filters by 'generatedAt' instead of 'createdAt'
    const reportCount = await prisma.report.count({
      where: {
        client: { tenantId },
        generatedAt: { gte: startDate, lte: endDate },
      },
    });
    
    const wasteEntries = await prisma.wasteData.findMany({
      where: {
        client: { tenantId },
        recycledDate: { gte: startDate, lte: endDate },
      },
      include: {
        client: { select: { companyName: true } },
        wasteType: true,
      }
    });
    
    const totalWasteEntries = wasteEntries.length;
    const totalRecycledWeight = wasteEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    const averageWastePerClient = clientCount > 0 ? totalRecycledWeight / clientCount : 0;

    // --- Chart Data Calculations ---
    const wasteBreakdown = wasteEntries.reduce((acc, entry) => {
      acc[entry.wasteType.name] = (acc[entry.wasteType.name] || 0) + entry.quantity;
      return acc;
    }, {});
    const wasteBreakdownChartData = Object.entries(wasteBreakdown).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
    
    const clientPerformance = wasteEntries.reduce((acc, entry) => {
        const { companyName } = entry.client;
        acc[companyName] = (acc[companyName] || 0) + entry.quantity;
        return acc;
    }, {});

    const allReportsInPeriod = await prisma.report.findMany({
        where: { client: { tenantId }, generatedAt: { gte: startDate, lte: endDate } },
        select: { clientId: true }
    });

    const clientLeaderboardData = Object.entries(clientPerformance)
        .map(([clientName, totalWeight]) => {
            const clientRecord = wasteEntries.find(we => we.client.companyName === clientName)?.client;
            const reportsGenerated = allReportsInPeriod.filter(r => r.clientId === clientRecord?.id).length;
            return { clientName, totalWeight: parseFloat(totalWeight.toFixed(2)), reportsGenerated };
        })
        .sort((a, b) => b.totalWeight - a.totalWeight);

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

    res.json({
      kpis: {
        totalClients: clientCount,
        totalWasteEntries,
        totalReportsGenerated: reportCount,
        totalRecycledWeight: parseFloat(totalRecycledWeight.toFixed(2)),
      },
      charts: {
        clientLeaderboard: clientLeaderboardData,
        clientWasteBreakdown: {
            data: clientWasteBreakdown,
            wasteTypes,
        },
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

