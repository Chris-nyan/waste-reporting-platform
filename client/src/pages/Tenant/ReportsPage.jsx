import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Download } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch reports. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Reports</h2>
          <p className="text-gray-500">View and manage all your generated sustainability reports.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200">
          <Link to="/app/reports/generate">
            <PlusCircle className="mr-2 h-4 w-4" /> Generate New Report
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
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
                    <TableHead>Report Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Generated On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.length > 0 ? (
                    reports.map((report) => (
                        <TableRow key={report.id} className="border-gray-100 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-800">{report.reportTitle}</TableCell>
                        <TableCell className="text-gray-600">{report.client.companyName}</TableCell>
                        <TableCell className="text-gray-600">
                          {format(new Date(report.startDate), 'MMM d, yyyy')} - {format(new Date(report.endDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-gray-600">{format(new Date(report.generatedAt), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan="5" className="h-48 text-center text-gray-500">
                        No reports have been generated yet.
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

export default ReportsPage;

