import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Edit, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Loader2, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import AddClientDialog from '@/components/ui/Tenant/AddClientDialogue';
import EditClientDialog from '@/components/ui/Tenant/EditClientDialogue';
import ConfirmationDialog from '@/components/ui/ConfirmDialogue';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';


const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    // State for managing modals
    const [clientToEdit, setClientToEdit] = useState(null);
    const [clientToDelete, setClientToDelete] = useState(null);

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (err) {
            setError('Failed to fetch clients. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;
        try {
            await api.delete(`/clients/${clientToDelete.id}`);
            toast.success(t('clients.toast_delete_success', 'Client "{{name}}" deleted successfully.', {
                name: clientToDelete.companyName
            })); setClientToDelete(null); // Close confirmation dialog
            fetchClients(); // Refresh data
        } catch (err) {
            toast.error(t('clients.toast_delete_error', 'Failed to delete client.'));
            setClientToDelete(null);
        }
    };


    return (
        <div className="flex-1 space-y-6 p-4 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-800 [text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">            {t('clients.title', 'Clients')}
                    </h2>
                    <p className="text-gray-500">{t('clients.description', 'Manage your client profiles and their waste data.')}
                    </p>
                </div>
                <AddClientDialog onClientAdded={fetchClients} />
            </div>

            <Card className="bg-white/70 backdrop-blur-lg border border-gray-200/50 shadow-sm rounded-xl">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-200/60">
                                        <TableHead>{t('clients.table_col_company', 'Company Name')}</TableHead>
                                        <TableHead>{t('clients.table_col_contact', 'Contact Person')}</TableHead>
                                        <TableHead>{t('clients.table_col_email', 'Email')}</TableHead>
                                        <TableHead className="hidden md:table-cell">{t('clients.table_col_phone', 'Phone')}</TableHead>
                                        <TableHead className="text-right">{t('clients.table_col_actions', 'Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.length > 0 ? (
                                        clients.map((client) => (
                                            <TableRow key={client.id} className="border-gray-100 hover:bg-gray-50">
                                                <TableCell className="font-medium text-gray-800">{client.companyName}</TableCell>
                                                <TableCell className="text-gray-600">{client.contactPerson || '—'}</TableCell>
                                                <TableCell className="text-gray-600">{client.email || '—'}</TableCell>
                                                <TableCell className="hidden md:table-cell text-gray-600">{client.phone || '—'}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                                                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm border-gray-200/50 shadow-lg">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link to={`/app/clients/${client.id}`} className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4" /> {t('clients.dropdown_waste', 'Waste Data')}
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => setClientToEdit(client)} className="cursor-pointer">
                                                                <Edit className="mr-2 h-4 w-4" /> {t('clients.dropdown_edit', 'Edit Client')}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => setClientToDelete(client)} className="text-red-600 focus:text-white focus:bg-red-500 cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" /> {t('clients.dropdown_delete', 'Delete Client')}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="5" className="h-48 text-center text-gray-500">
                                                {t('clients.table_no_clients', 'No clients found. Click "Add New Client" to get started.')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Render the modals */}
            <EditClientDialog
                client={clientToEdit}
                isOpen={!!clientToEdit}
                onOpenChange={(isOpen) => !isOpen && setClientToEdit(null)}
                onClientUpdated={() => {
                    setClientToEdit(null);
                    fetchClients();
                }}
            />
            <ConfirmationDialog
                open={!!clientToDelete}
                onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}
                onConfirm={handleDeleteClient}
                title={t('clients.confirm_delete_title', 'Are you sure you want to delete this client?')}
                description={t('clients.confirm_delete_desc', 'This action cannot be undone. All waste data and reports for this client will also be permanently deleted.')}
            />
        </div>
    );
};

export default ClientsPage;

