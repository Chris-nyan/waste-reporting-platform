const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get all clients for the logged-in user's tenant
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: {
        tenantId: req.user.tenantId,
      },
      orderBy: {
        companyName: 'asc',
      },
    });
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Create a new client for the logged-in user's tenant
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res) => {
  const { companyName, contactPerson, email, phone, address } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    const newClient = await prisma.client.create({
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        address,
        tenantId: req.user.tenantId,
        createdById: req.user.userId,
      },
    });
    res.status(201).json(newClient);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// @desc    Get a single client by ID
// @route   GET /api/clients/:id
// @access  Private
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        tenantId: req.user.tenantId, // Security check
      },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error("Error fetching client by ID:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Update an existing client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res) => {
    const { id } = req.params;
    const { companyName, contactPerson, email, phone, address } = req.body;

    if (!companyName) {
        return res.status(400).json({ message: 'Company name is required.' });
    }

    try {
        // Security check: ensure the client exists and belongs to the user's tenant
        const client = await prisma.client.findFirst({
            where: { id, tenantId: req.user.tenantId },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found or you do not have permission.' });
        }

        const updatedClient = await prisma.client.update({
            where: { id },
            data: {
                companyName,
                contactPerson,
                email,
                phone,
                address,
            },
        });
        res.json(updatedClient);
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res) => {
    const { id } = req.params;

    try {
        // Security check
        const client = await prisma.client.findFirst({
            where: { id, tenantId: req.user.tenantId },
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found or you do not have permission.' });
        }

        // The `onDelete: Cascade` in our Prisma schema will automatically delete
        // all related WasteData and Report records for this client.
        await prisma.client.delete({
            where: { id },
        });

        res.json({ message: 'Client deleted successfully.' });
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
};

