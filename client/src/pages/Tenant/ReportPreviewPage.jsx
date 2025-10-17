import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import ReportPDFDocument from '@/components/reports/ReportPDFDocument';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const ReportPreviewPage = () => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // Updated to handle all chart images
    const [chartImages, setChartImages] = useState({ bar: null, emissionsPie: null, compositionPie: null, monthlyTrend: null });
    
    // Refs for all four charts
    const barChartRef = useRef(null);
    const emissionsPieChartRef = useRef(null);
    const compositionPieChartRef = useRef(null);
    const monthlyTrendChartRef = useRef(null);

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

    // Updated effect to generate all four charts
    useEffect(() => {
        if (report && barChartRef.current && emissionsPieChartRef.current && compositionPieChartRef.current && monthlyTrendChartRef.current) {
            setTimeout(() => {
                const barPromise = html2canvas(barChartRef.current);
                const emissionsPiePromise = html2canvas(emissionsPieChartRef.current);
                const compositionPiePromise = html2canvas(compositionPieChartRef.current);
                const monthlyTrendPromise = html2canvas(monthlyTrendChartRef.current);

                Promise.all([barPromise, emissionsPiePromise, compositionPiePromise, monthlyTrendPromise]).then(([barCanvas, emissionsPieCanvas, compositionPieCanvas, monthlyTrendCanvas]) => {
                    setChartImages({
                        bar: barCanvas.toDataURL('image/png'),
                        emissionsPie: emissionsPieCanvas.toDataURL('image/png'),
                        compositionPie: compositionPieCanvas.toDataURL('image/png'),
                        monthlyTrend: monthlyTrendCanvas.toDataURL('image/png'),
                    });
                });
            }, 500);
        }
    }, [report]);
    
    // --- Data processing functions for charts ---
    const getCompositionData = () => {
        if (!report || !report.wasteData) return [];
        const composition = report.wasteData.reduce((acc, entry) => {
            const name = entry.wasteType.name;
            acc[name] = (acc[name] || 0) + entry.quantity;
            return acc;
        }, {});
        return Object.entries(composition).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
    };

    const getMonthlyTrendData = () => {
        if (!report || !report.wasteData) return [];
        const monthlyData = report.wasteData.reduce((acc, entry) => {
            const month = format(new Date(entry.recycledDate), 'MMM yyyy');
            acc[month] = (acc[month] || 0) + entry.quantity;
            return acc;
        }, {});
        return Object.entries(monthlyData)
            .map(([month, quantity]) => ({ month, quantity: parseFloat(quantity.toFixed(2)) }))
            .sort((a, b) => new Date(`01 ${a.month}`) - new Date(`01 ${b.month}`));
    };


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

    return (
        <div className="flex flex-col h-screen p-4 lg:p-8 bg-gray-50">
            {/* --- Hidden Container with all 4 charts --- */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Bar Chart */}
                <div ref={barChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
                    <ResponsiveContainer>
                        <BarChart data={[{ name: 'Emissions (kg CO2e)', Avoided: report.emissionsAvoided, Logistics: report.logisticsEmissions, Recycling: report.recyclingEmissions }]}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Avoided" fill="#4ade80" /><Bar dataKey="Logistics" fill="#f87171" /><Bar dataKey="Recycling" fill="#fb923c" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* 2. Emissions Pie Chart */}
                <div ref={emissionsPieChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={[{ name: 'Logistics Emissions', value: report.logisticsEmissions }, { name: 'Recycling Emissions', value: report.recyclingEmissions }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                <Cell key="cell-0" fill="#f87171" /><Cell key="cell-1" fill="#fb923c" />
                            </Pie><Tooltip formatter={(value) => `${value.toFixed(2)} kg`} /><Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* 3. Waste Composition Pie Chart */}
                <div ref={compositionPieChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={getCompositionData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {getCompositionData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toFixed(2)} kg`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* 4. Monthly Trend Line Chart */}
                <div ref={monthlyTrendChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
                    <ResponsiveContainer>
                        <LineChart data={getMonthlyTrendData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis label={{ value: 'Quantity (kg)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => `${value.toFixed(2)} kg`} />
                            <Legend />
                            <Line type="monotone" dataKey="quantity" stroke="#00796b" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
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
                        <Button disabled={loading || !chartImages.monthlyTrend}>
                            {loading || !chartImages.monthlyTrend ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
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
