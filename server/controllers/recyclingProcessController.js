const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Create a new Recycling Process for a WasteData entry
 * @route   POST /api/recycling-processes
 * @access  Private
 */
const createRecyclingProcess = async (req, res) => {
  const {
    wasteDataId,
    quantityRecycled,
    recycledDate,
  } = req.body;

  if (!wasteDataId || !quantityRecycled || !recycledDate) {
    return res.status(400).json({ message: 'Waste Entry ID, quantity, and recycled date are required.' });
  }

  try {
    const quantity = parseFloat(quantityRecycled);

    // Use a transaction to ensure data integrity
    const newProcess = await prisma.$transaction(async (tx) => {
      // 1. Find the parent WasteData entry and verify permissions
      const wasteData = await tx.wasteData.findFirst({
        where: { id: wasteDataId, client: { tenantId: req.user.tenantId } },
      });

      if (!wasteData) {
        throw new Error('Waste entry not found or you do not have permission.');
      }

      // 2. Check if recycling more than the available quantity
      const newRecycledQuantity = wasteData.recycledQuantity + quantity;
      if (newRecycledQuantity > wasteData.quantity) {
        throw new Error('Cannot recycle more than the initial quantity of the waste entry.');
      }

      // 3. Create the new recycling process entry
      const createdProcess = await tx.recyclingProcess.create({
        data: {
          wasteData: { connect: { id: wasteDataId } },
          quantityRecycled: quantity,
          recycledDate: new Date(recycledDate),
        },
      });

      // 4. Update the parent WasteData's recycled quantity and status
      let newStatus = "PARTIALLY_RECYCLED";
      // Use a small tolerance for floating point comparisons
      if (newRecycledQuantity >= wasteData.quantity - 0.001) {
        newStatus = "FULLY_RECYCLED";
      }

      await tx.wasteData.update({
        where: { id: wasteDataId },
        data: {
          recycledQuantity: newRecycledQuantity,
          status: newStatus,
        },
      });

      return createdProcess;
    });

    res.status(201).json(newProcess);
  } catch (error) {
    console.error("Error creating recycling process:", error);
    if (error.message.includes('Cannot recycle more') || error.message.includes('not found')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  createRecyclingProcess,
};

