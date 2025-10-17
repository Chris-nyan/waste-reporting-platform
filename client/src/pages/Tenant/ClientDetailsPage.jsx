import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Recycle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import AddWasteEntryDialog from '@/components/ui/Tenant/AddWasteEntryDialogue';
import AddRecyclingProcessDialog from '@/components/ui/Tenant/AddRecyclingProcessDialogue';
import WasteEntryDetailDialog from '@/components/ui/Tenant/WasteEntryDetailDialogue';
import ConfirmationDialog from '@/components/ui/ConfirmDialogue';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getStatusAppearance = (status) => {
    switch (status) {
        case 'FULLY_RECYCLED':
            return { badge: 'bg-green-100 text-green-800', progressBar: '[&>div]:bg-green-500', text: 'Fully Recycled' };
        case 'PARTIALLY_RECYCLED':
            return { badge: 'bg-yellow-100 text-yellow-800', progressBar: '[&>div]:bg-yellow-500', text: 'Partially Recycled' };
        default:
            return { badge: 'bg-gray-100 text-gray-800', progressBar: '[&>div]:bg-gray-400', text: 'Pending' };
    }
};

const ClientDetailPage = () => {
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [wasteEntries, setWasteEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [entryToProcess, setEntryToProcess] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null); // State for delete confirmation

    const fetchClientData = useCallback(async () => {
        try {
            setLoading(true);
            const [clientRes, entriesRes] = await Promise.all([
                api.get(`/clients/${clientId}`),
                api.get(`/waste-data/client/${clientId}`)
            ]);
            setClient(clientRes.data);
            setWasteEntries(entriesRes.data);
        } catch (err) {
            setError('Failed to fetch client data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    const handleDeleteEntry = async () => {
        if (!entryToDelete) return;
        try {
            await api.delete(`/waste-data/${entryToDelete.id}`);
            toast.success('Waste entry deleted successfully.');
            setEntryToDelete(null); // Close confirmation dialog
            fetchClientData(); // Refresh data
        } catch (err) {
            toast.error('Failed to delete waste entry.');
            setEntryToDelete(null);
        }
    };

    if (loading) {
        return (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>);
    }
    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="flex-1 space-y-6 p-4 lg:p-8">
            <Link to="/app/clients" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Clients
            </Link>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-gray-800">{client?.companyName}</CardTitle>
                    <CardDescription>Client profile and waste management history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-600">
                        <div><strong>Contact Person:</strong> {client?.contactPerson || 'N/A'}</div>
                        <div><strong>Email:</strong> {client?.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> {client?.phone || 'N/A'}</div>
                        <div><strong>Address:</strong> {client?.address || 'N/A'}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Waste Entries</CardTitle>
                        <CardDescription>Log and track collected waste for this client. Click a row to see details.</CardDescription>
                    </div>
                    <AddWasteEntryDialog clientId={clientId} onWasteEntryAdded={fetchClientData} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pickup Date</TableHead>
                                <TableHead>Waste Type</TableHead>
                                <TableHead>Total Quantity</TableHead>
                                <TableHead className="w-[250px]">Recycling Progress</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wasteEntries.length > 0 ? (
                                wasteEntries.map((entry) => {
                                    const progress = entry.quantity > 0 ? (entry.recycledQuantity / entry.quantity) * 100 : 0;
                                    const appearance = getStatusAppearance(entry.status);
                                    return (
                                        <TableRow key={entry.id} className="hover:bg-gray-50">
                                            <TableCell onClick={() => setSelectedEntry(entry)} className="cursor-pointer">{entry.pickupDate ? format(new Date(entry.pickupDate), 'PPP') : 'N/A'}</TableCell>
                                            <TableCell onClick={() => setSelectedEntry(entry)} className="font-medium cursor-pointer">{entry.wasteType.name}</TableCell>
                                            <TableCell onClick={() => setSelectedEntry(entry)} className="cursor-pointer">{`${entry.quantity.toLocaleString()} ${entry.unit}`}</TableCell>
                                            <TableCell onClick={() => setSelectedEntry(entry)} className="cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <Progress value={progress} className={cn("h-2", appearance.progressBar)} />
                                                    <span className="text-xs font-semibold">{Math.round(progress)}%</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-xs text-gray-500">{entry.recycledQuantity} of {entry.quantity} {entry.unit}</p>
                                                    <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-full", appearance.badge)}>
                                                        {appearance.text}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEntryToProcess(entry);
                                                        }}
                                                        disabled={entry.status === 'FULLY_RECYCLED'}
                                                    >
                                                        <Recycle className="mr-2 h-4 w-4" />
                                                        {entry.status === 'FULLY_RECYCLED' ? 'Recycled' : 'Process'}
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => setSelectedEntry(entry)}><Edit className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => setEntryToDelete(entry)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan="5" className="h-24 text-center text-gray-500">
                                        No waste entries found. Click "Add Waste Entry" to log a collection.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AddRecyclingProcessDialog
                wasteEntry={entryToProcess}
                isOpen={!!entryToProcess}
                onOpenChange={(isOpen) => !isOpen && setEntryToProcess(null)}
                onProcessAdded={() => {
                    setEntryToProcess(null);
                    fetchClientData();
                }}
            />
            <WasteEntryDetailDialog
                entry={selectedEntry}
                isOpen={!!selectedEntry}
                onOpenChange={(isOpen) => { if (!isOpen) setSelectedEntry(null); }}
            />
            <ConfirmationDialog
                open={!!entryToDelete}
                onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}
                onConfirm={handleDeleteEntry}
                title="Are you sure?"
                description="This action cannot be undone. This will permanently delete this waste entry and all of its recycling history."
            />
        </div>
    );
};

export default ClientDetailPage;

