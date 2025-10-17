import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Loader2, MoreHorizontal, Trash2, Edit, Eye, MenuIcon } from 'lucide-react';
import api from '@/lib/api';
import AddWasteEntryDialog from '@/components/ui/Tenant/AddWasteEntryDialogue';
import WasteEntryDetailDialog from '@/components/ui/Tenant/WasteEntryDetailDialogue';
import ConfirmationDialog from '@/components/ui/ConfirmDialogue';
import EditWasteEntryDialog from '@/components/ui/Tenant/EditWasteEntryDialogue';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [wasteEntries, setWasteEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [entryToEdit, setEntryToEdit] = useState(null);

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientRes, wasteRes] = await Promise.all([
        api.get(`/clients/${clientId}`),
        api.get(`/waste-data/client/${clientId}`)
      ]);
      setClient(clientRes.data);
      setWasteEntries(wasteRes.data);
    } catch (err) {
      setError('Failed to fetch client data.');
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
      setEntryToDelete(null);
      fetchClientData();
    } catch (err) {
      toast.error('Failed to delete waste entry.');
    }
  };

  if (loading) {
    return ( <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> );
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
                <CardTitle>Waste Data Entries</CardTitle>
                <CardDescription>Log and view all waste pickups for this client.</CardDescription>
            </div>
            <AddWasteEntryDialog clientId={clientId} onWasteEntryAdded={fetchClientData} />
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recycled Date</TableHead>
                  <TableHead>Waste Type</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteEntries.length > 0 ? (
                  wasteEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell onClick={() => setSelectedEntry(entry)} className="cursor-pointer hover:bg-gray-50">{format(new Date(entry.recycledDate), 'PPP')}</TableCell>
                      <TableCell onClick={() => setSelectedEntry(entry)} className="font-medium cursor-pointer hover:bg-gray-50">{entry.wasteType}</TableCell>
                      <TableCell onClick={() => setSelectedEntry(entry)} className="text-right cursor-pointer hover:bg-gray-50">{entry.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setSelectedEntry(entry)} className="cursor-pointer">
                                <MenuIcon className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setEntryToEdit(entry)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setEntryToDelete(entry)} className="text-red-600 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="4" className="h-24 text-center text-gray-500">
                      No waste entries found. Click "Add New Client" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <WasteEntryDetailDialog 
        entry={selectedEntry} 
        isOpen={!!selectedEntry} 
        onOpenChange={(isOpen) => !isOpen && setSelectedEntry(null)}
      />
      
      <EditWasteEntryDialog 
        entry={entryToEdit}
        isOpen={!!entryToEdit}
        onOpenChange={(isOpen) => !isOpen && setEntryToEdit(null)}
        onEntryUpdated={() => {
            setEntryToEdit(null);
            fetchClientData();
        }}
      />

      <ConfirmationDialog
        open={!!entryToDelete}
        onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
        title="Are you sure you want to delete this entry?"
        description="This action cannot be undone. This will permanently delete the waste data record."
      />
    </div>
  );
};

export default ClientDetailPage;

