import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, MoreHorizontal, Trash2, Edit, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import ConfirmationDialog from '@/components/ui/ConfirmDialogue';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import AddUserDialog from '@/components/ui/Tenant/AddUserDialogue';
import EditUserDialog from '@/components/ui/Tenant/EditUserDialogue';
import { cn } from '@/lib/utils';
import AuthContext, { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';

const UserManagementPage = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const { user: currentUser } = useAuth();
    useEffect(() => {
        if (!loading && user) {
            console.log("Current logged-in user:", user);
        }
    }, [loading, user]);

    const [userToEdit, setUserToEdit] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete.id}`);
            toast.success('User deleted successfully.');
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user.');
            setUserToDelete(null);
        }
    };

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="flex-1 space-y-6 p-4 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-800 [text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">{t('users.title', 'User Management')}</h2>
                    <p className="text-gray-500">{t('users.description', 'Add, edit, or remove users for your tenant.')}</p>
                </div>
                <AddUserDialog users={users} onUserAdded={fetchUsers} />
            </div>

            <Card className="bg-white/70 backdrop-blur-lg border border-gray-200/50 shadow-sm rounded-xl">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-200/60">
                                        <TableHead>{t('users.table_col_name', 'Name')}</TableHead>
                                        <TableHead>{t('users.table_col_email', 'Email')}</TableHead>
                                        <TableHead>{t('users.table_col_role', 'Role')}</TableHead>
                                        <TableHead>{t('users.table_col_joined', 'Joined')}</TableHead>
                                        <TableHead className="text-right">{t('users.table_col_actions', 'Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <TableRow key={user.id} className="border-gray-100 hover:bg-gray-50">
                                                <TableCell className="font-medium text-gray-800">{user.name}</TableCell>
                                                <TableCell className="text-gray-600">{user.email}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                                                        user.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                                                    )}>
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">{format(new Date(user.createdAt), 'PPP')}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="bg-white/90 backdrop-blur-sm border-gray-200/50 shadow-lg"
                                                        >
                                                            {/* Edit Option */}
                                                            <DropdownMenuItem
                                                                onSelect={() => setUserToEdit(user)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" /> {t('users.dropdown_edit', 'Edit User')}
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            {/* Delete Option - Only Admins Can Delete Others */}
                                                            <DropdownMenuItem
                                                                onSelect={() => {
                                                                    // Only allow deletion if logged-in user is ADMIN and not deleting self
                                                                    if (currentUser?.role === "ADMIN" && currentUser?.userId !== user.id) {
                                                                        setUserToDelete(user);
                                                                    }
                                                                }}
                                                                disabled={currentUser?.role !== "ADMIN" || currentUser?.userId === user.id}
                                                                className={`${currentUser?.role === "ADMIN" && currentUser?.userId !== user.id
                                                                        ? "text-red-600 focus:text-white focus:bg-red-500 cursor-pointer"
                                                                        : "text-gray-400 cursor-not-allowed"
                                                                    }`}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> {t('users.dropdown_delete', 'Delete User')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="5" className="h-48 text-center text-gray-500">
                                                {t('users.table_no_users', 'No users found. Click "Add New User" to get started.')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <EditUserDialog
                user={userToEdit}
                isOpen={!!userToEdit}
                onOpenChange={(isOpen) => !isOpen && setUserToEdit(null)}
                onUserUpdated={fetchUsers}
            />
            <ConfirmationDialog
                open={!!userToDelete}
                onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
                onConfirm={handleDeleteUser}
                title={t('users.confirm_delete_title', 'Are you sure you want to delete this user?')}
                description={t('users.confirm_delete_desc', "This action cannot be undone. This will permanently delete the user's account.")}
            />
        </div>
    );
};

export default UserManagementPage;
