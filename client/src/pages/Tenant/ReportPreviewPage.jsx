import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import ReportPDFDocument from '@/components/reports/ReportPDFDocument';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#f87171', '#fb923c']; // Colors for the Pie Chart

const ReportPreviewPage = () => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [chartImages, setChartImages] = useState({ bar: null, pie: null });
    
    const barChartRef = useRef(null);
    const pieChartRef = useRef(null);

    useEffect(() => {
        if (id) {
            api.get(`/reports/${id}`)
                .then(response => setReport(response.data))
                .catch(error => toast.error("Failed to load report data."))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
            toast.error("No report ID specified.");
        }
    }, [id]);

    useEffect(() => {
        if (report && barChartRef.current && pieChartRef.current) {
            setTimeout(() => {
                import('html2canvas').then(module => {
                    const html2canvas = module.default;
                    
                    const barPromise = html2canvas(barChartRef.current).then(canvas => canvas.toDataURL('image/png'));
                    const piePromise = html2canvas(pieChartRef.current).then(canvas => canvas.toDataURL('image/png'));

                    Promise.all([barPromise, piePromise]).then(([barImage, pieImage]) => {
                        setChartImages({ bar: barImage, pie: pieImage });
                    });
                });
            }, 500); // Delay to ensure charts are fully rendered
        }
    }, [report]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <p className="ml-2">Loading Report Preview...</p>
            </div>
        );
    }

    if (!report) {
        return <div className="text-center p-8">Report not found or failed to load.</div>;
    }

    // Data for charts
    const barChartData = [{ name: 'Emissions (kg CO2e)', Avoided: report.emissionsAvoided, Logistics: report.logisticsEmissions, Recycling: report.recyclingEmissions }];
    const pieChartData = [
        { name: 'Logistics Emissions', value: report.logisticsEmissions },
        { name: 'Recycling Emissions', value: report.recyclingEmissions },
    ];

    return (
        <div className="flex flex-col h-screen p-4 lg:p-8 bg-gray-50">
            {/* Hidden container for rendering charts to be captured as images */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div ref={barChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
                    <ResponsiveContainer><BarChart data={barChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Avoided" fill="#4ade80" /><Bar dataKey="Logistics" fill="#f87171" /><Bar dataKey="Recycling" fill="#fb923c" /></BarChart></ResponsiveContainer>
                </div>
                <div ref={pieChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
                    <ResponsiveContainer><PieChart><Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>{pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
                </div>
            </div>

            <div className="flex-shrink-0 mb-4 flex justify-between items-center">
                <Link to="/app/reports" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
                </Link>
                <PDFDownloadLink
                    document={<ReportPDFDocument report={report} chartImages={chartImages} />}
                    fileName={`Report-${report.client.companyName}-${new Date().toISOString().split('T')[0]}.pdf`}
                >
                    {({ loading }) => (
                        <Button disabled={loading || !chartImages.bar}>
                            {loading || !chartImages.bar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden shadow-lg">
                <PDFViewer width="100%" height="100%" showToolbar={true}>
                    <ReportPDFDocument report={report} chartImages={chartImages} />
                </PDFViewer>
            </div>
        </div>
    );
};

export default ReportPreviewPage;