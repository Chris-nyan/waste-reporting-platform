const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Get all master data (waste categories, types, technologies, and report questions)
 * @route   GET /api/master-data
 * @access  Private
 */
const getMasterData = async (req, res) => {
  try {
    // Fetch all data points in parallel for maximum efficiency
    const [wasteCategories, recyclingTechnologies, masterReportQuestions] = await Promise.all([
      prisma.wasteCategory.findMany({
        include: {
          types: {
            orderBy: { name: 'asc' }
          }, 
        },
        orderBy: {
            name: 'asc'
        }
      }),
      prisma.recyclingTechnology.findMany({
        orderBy: {
            name: 'asc'
        }
      }),
      // --- THIS IS THE NEW ADDITION ---
      // Fetch the master list of report questions, ordered by displayOrder
      prisma.masterReportQuestion.findMany({
        where: { isActive: true }, // Only fetch active questions
        orderBy: {
            displayOrder: 'asc'
        }
      }),
    ]);

    res.json({
      wasteCategories,
      recyclingTechnologies,
      masterReportQuestions, // <-- Include the questions in the response
    });
  } catch (error) {
    console.error("Error fetching master data:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getMasterData,
};

