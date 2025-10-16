const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to check if user is an admin - This will no longer be used for settings management
// const isAdmin = (user) => user.role === 'ADMIN';

// --- Profile ---
const getProfile = async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId } });
    res.json({ user, tenant });
};

const updateProfile = async (req, res) => {
    const { name } = req.body;
    // For security, we don't allow email changes via this endpoint
    const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: { name },
    });
    res.json(updatedUser);
};

// --- Generic CRUD Functions for Tenant-Specific Items ---
const createItem = async (model, data, tenantId, res) => {
    try {
        const item = await prisma[model].create({ data: { ...data, tenantId } });
        res.status(201).json(item);
    } catch (error) {
        console.error(`Error creating ${model}:`, error);
        res.status(500).json({ message: `Failed to create ${model}` });
    }
};

const getItems = async (model, tenantId, res) => {
    try {
        const items = await prisma[model].findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
        res.json(items);
    } catch (error) {
        console.error(`Error fetching ${model}s:`, error);
        res.status(500).json({ message: `Failed to fetch ${model}s` });
    }
};

const updateItem = async (model, id, data, tenantId, res) => {
    try {
        const result = await prisma[model].updateMany({ where: { id, tenantId }, data });
        if (result.count === 0) return res.status(404).json({ message: 'Item not found or you do not have permission.' });
        const updatedItem = await prisma[model].findUnique({ where: { id } });
        res.json(updatedItem);
    } catch (error) {
        console.error(`Error updating ${model}:`, error);
        res.status(500).json({ message: `Failed to update ${model}` });
    }
};

const deleteItem = async (model, id, tenantId, res) => {
    try {
        const result = await prisma[model].deleteMany({ where: { id, tenantId } });
        if (result.count === 0) return res.status(404).json({ message: 'Item not found or you do not have permission.' });
        res.json({ message: `${model} deleted successfully` });
    } catch (error) {
        console.error(`Error deleting ${model}:`, error);
        res.status(500).json({ message: `Failed to delete ${model}` });
    }
};

// --- Exported functions without the isAdmin check ---
module.exports = {
    getProfile,
    updateProfile,
    getFacilities: (req, res) => getItems('facility', req.user.tenantId, res),
    createFacility: (req, res) => createItem('facility', req.body, req.user.tenantId, res),
    updateFacility: (req, res) => updateItem('facility', req.params.id, req.body, req.user.tenantId, res),
    deleteFacility: (req, res) => deleteItem('facility', req.params.id, req.user.tenantId, res),

    getPickupLocations: (req, res) => getItems('pickupLocation', req.user.tenantId, res),
    createPickupLocation: (req, res) => createItem('pickupLocation', req.body, req.user.tenantId, res),
    updatePickupLocation: (req, res) => updateItem('pickupLocation', req.params.id, req.body, req.user.tenantId, res),
    deletePickupLocation: (req, res) => deleteItem('pickupLocation', req.params.id, req.user.tenantId, res),

    getVehicleTypes: (req, res) => getItems('vehicleType', req.user.tenantId, res),
    createVehicleType: (req, res) => createItem('vehicleType', req.body, req.user.tenantId, res),
    updateVehicleType: (req, res) => updateItem('vehicleType', req.params.id, req.body, req.user.tenantId, res),
    deleteVehicleType: (req, res) => deleteItem('vehicleType', req.params.id, req.user.tenantId, res),
};

