import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import AddClientDialog from '@/components/ui/AddClientDialogue';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use useCallback to memoize the fetch function
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      setError('Failed to fetch clients. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch clients on initial component mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800 [text-shadow:1px_1px_1px_rgba(0,0,0,0.05)]">Clients</h2>
          <p className="text-gray-500">Manage your client profiles and their waste data.</p>
        </div>
        {/* The AddClientDialog contains the themed button */}
        <AddClientDialog onClientAdded={fetchClients} />
      </div>

      <Card className="bg-white shadow-sm rounded-xl">
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
                    <TableRow className="border-gray-200">
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                                  <Link to={`/app/clients/${client.id}`} className="cursor-pointer">View Details</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Edit Client</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-500 cursor-pointer">Delete Client</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan="5" className="h-48 text-center text-gray-500">
                        No clients found. Click "Add New Client" to get started.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;

