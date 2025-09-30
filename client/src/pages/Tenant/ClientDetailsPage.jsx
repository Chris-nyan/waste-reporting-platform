import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import AddWasteEntryDialog from '@/components/ui/AddWasteEntryDialogue';
import WasteEntryDetailDialog from '@/components/ui/WasteEntryDetailDialogue';
import { format } from 'date-fns';

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [wasteEntries, setWasteEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to manage which waste entry is selected for the detail view
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both client details and waste entries in parallel for efficiency
      const [clientRes, wasteRes] = await Promise.all([
        api.get(`/clients/${clientId}`),
        api.get(`/waste-data/${clientId}`)
      ]);
      setClient(clientRes.data);
      setWasteEntries(wasteRes.data);
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
                <CardDescription>Log and view all waste pickups for this client. Click a row to see details.</CardDescription>
            </div>
            <AddWasteEntryDialog clientId={clientId} onWasteEntryAdded={fetchClientData} />
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recycled Date</TableHead>
                  <TableHead>Waste Type</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteEntries.length > 0 ? (
                  wasteEntries.map((entry) => (
                    <TableRow key={entry.id} onClick={() => setSelectedEntry(entry)} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>{format(new Date(entry.recycledDate), 'PPP')}</TableCell>
                      <TableCell className="font-medium">{entry.wasteType}</TableCell>
                      <TableCell className="text-gray-500">{entry.recyclingTechnology || 'N/A'}</TableCell>
                      <TableCell className="text-right">{`${entry.quantity.toLocaleString()}`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="4" className="h-24 text-center text-gray-500">
                      No waste entries found. Click "Add Waste Entry" to log data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      {/* The Details Dialog is rendered here, its visibility is controlled by 'selectedEntry' */}
      <WasteEntryDetailDialog 
        entry={selectedEntry} 
        isOpen={!!selectedEntry} 
        onOpenChange={(isOpen) => { if (!isOpen) setSelectedEntry(null); }}
      />
    </div>
  );
};

export default ClientDetailPage;

