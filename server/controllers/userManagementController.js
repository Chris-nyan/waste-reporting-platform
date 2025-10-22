const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all users within the admin's tenant
 * @route   GET /api/users
 * @access  Admin
 */
const getTenantUsers = async (req, res) => {
    // Ensure the user is an Admin
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                tenantId: req.user.tenantId, // Only get users from the same tenant
                role: {
                    not: 'SUPER_ADMIN' // Exclude super admins
                }
            },
            select: { // Select only safe fields to send to frontend
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json(users);
    } catch (error) {
        console.error("Error fetching tenant users:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createTenantUser = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Cannot create a Super Admin.' });
    }

    if (role !== 'ADMIN' && role !== 'MEMBER') {
        return res.status(400).json({ message: 'Invalid role. Must be ADMIN or MEMBER.' });
    }

    try {
        // Check if email already exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // LIMIT USERS TO 5 PER TENANT
        const tenantUsersCount = await prisma.user.count({
            where: {
                tenantId: req.user.tenantId,
                role: {
                    not: 'SUPER_ADMIN'
                }
            }
        });

        if (tenantUsersCount >= 5) {
            return res.status(400).json({ message: 'Tenant user limit reached. Maximum 5 users allowed.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                tenantId: req.user.tenantId,
            },
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });

        res.status(201).json(newUser);

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Update a user within the admin's tenant
 * @route   PUT /api/users/:id
 * @access  Admin
 */
const updateTenantUser = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }

    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ message: 'Name, email, and role are required.' });
    }

    if (role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Cannot promote to Super Admin.' });
    }

    try {
        const userToUpdate = await prisma.user.findFirst({
            where: { id, tenantId: req.user.tenantId }
        });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found in your tenant.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email, role },
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Delete a user within the admin's tenant
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteTenantUser = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }

    const { id } = req.params;

    if (id === req.user.userId) {
        return res.status(400).json({ message: "You cannot delete your own account." });
    }

    try {
        const userToDelete = await prisma.user.findFirst({
            where: { id, tenantId: req.user.tenantId }
        });

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found in your tenant.' });
        }

        await prisma.user.delete({ where: { id } });

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getTenantUsers,
    createTenantUser,
    updateTenantUser,
    deleteTenantUser,
};

