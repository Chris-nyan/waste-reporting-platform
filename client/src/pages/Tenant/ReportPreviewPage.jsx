import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import api from '@/lib/api';
import ReportDocument from '@/components/reports/ReportDocument';

const ReportPreviewPage = () => {
  const { reportId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/reports/${reportId}`);
        setReportData(response.data);
      } catch (err) {
        setError('Failed to load report data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [reportId]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full p-4 lg:p-8">
      <div className="flex-shrink-0 mb-4 flex items-center justify-between">
        <Link to="/app/reports" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
        </Link>
        <PDFDownloadLink
          document={<ReportDocument data={reportData} />}
          fileName={`${reportData.client.companyName} - ${reportData.reportTitle}.pdf`}
        >
          {({ loading: downloadLoading }) => (
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              {downloadLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden">
        <PDFViewer width="100%" height="100%">
          <ReportDocument data={reportData} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default ReportPreviewPage;

