import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Download, Eye } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import ReportPDFDocument from '@/components/reports/ReportPDFDocument';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';


// Helper to generate distinct colors for the pie charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const ReportsPage = () => {
  const { t } = useTranslation();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const navigate = useNavigate();

  // State and refs for background chart generation
  const [reportForChartGen, setReportForChartGen] = useState(null);
  const barChartRef = useRef(null);
  const emissionsPieChartRef = useRef(null);
  const compositionPieChartRef = useRef(null);
  const monthlyTrendChartRef = useRef(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Effect to generate and download the PDF once chart data is ready
  useEffect(() => {
    if (
      reportForChartGen &&
      barChartRef.current &&
      emissionsPieChartRef.current &&
      compositionPieChartRef.current &&
      monthlyTrendChartRef.current
    ) {
      const captureCharts = async () => {
        try {
          // Wait for Recharts to fully render in hidden container
          await new Promise((r) => setTimeout(r, 1500));

          const capture = async (ref, name) => {
            try {
              await new Promise((r) => setTimeout(r, 300)); // small buffer between charts
              const canvas = await html2canvas(ref, {
                scale: 2, // improves quality
                useCORS: true, // allows cross-origin images if any
                logging: false,
              });
              console.log(`${name} captured`);
              return canvas.toDataURL("image/png");
            } catch (err) {
              console.error(`Failed to capture ${name}:`, err);
              return null;
            }
          };

          const [bar, emissionsPie, compositionPie, monthlyTrend] = await Promise.all([
            capture(barChartRef.current, "Emission Balance Bar Chart"),
            capture(emissionsPieChartRef.current, "Emissions Pie Chart"),
            capture(compositionPieChartRef.current, "Composition Pie Chart"),
            capture(monthlyTrendChartRef.current, "Monthly Trend Chart"),
          ]);

          const chartImages = { bar, emissionsPie, compositionPie, monthlyTrend };

          // Create PDF
          const blob = await pdf(
            <ReportPDFDocument report={reportForChartGen} chartImages={chartImages} />
          ).toBlob();

          // Download PDF
          saveAs(
            blob,
            `Report-${reportForChartGen.client.companyName}-${new Date(
              reportForChartGen.generatedAt
            )
              .toISOString()
              .split("T")[0]}.pdf`
          );
        } catch (err) {
          toast.error("Failed to generate PDF.");
          console.error("Download error:", err);
        } finally {
          setDownloadingId(null);
          setReportForChartGen(null);
        }
      };

      captureCharts();
    }
  }, [reportForChartGen, t]);

  // Fetches full report data and sets it to trigger the useEffect above
  const handleDownload = async (reportId) => {
    setDownloadingId(reportId);
    try {
      const fullReportResponse = await api.get(`/reports/${reportId}`);
      setReportForChartGen(fullReportResponse.data);
    } catch (err) {
      toast.error(t('reports.toast_fetch_error', 'Failed to fetch report data for download.'));
      setDownloadingId(null);
    }
  };

  // --- Data processing functions for charts ---
  const getCompositionData = () => {
    if (!reportForChartGen || !reportForChartGen.wasteData) return [];
    const composition = reportForChartGen.wasteData.reduce((acc, entry) => {
      const name = entry.wasteType.name;
      acc[name] = (acc[name] || 0) + entry.quantity;
      return acc;
    }, {});
    return Object.entries(composition).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  };

  const getMonthlyTrendData = () => {
    if (!reportForChartGen || !reportForChartGen.wasteData) return [];
    const monthlyData = reportForChartGen.wasteData.reduce((acc, entry) => {
      const month = format(new Date(entry.recycledDate), 'MMM yyyy');
      acc[month] = (acc[month] || 0) + entry.quantity;
      return acc;
    }, {});
    return Object.entries(monthlyData)
      .map(([month, quantity]) => ({ month, quantity: parseFloat(quantity.toFixed(2)) }))
      .sort((a, b) => new Date(`01 ${a.month}`) - new Date(`01 ${b.month}`));
  };


  return (
    <div className="flex-1 space-y-6 p-4 lg:p-8">
      {/* --- Hidden Container for Background Chart Generation --- */}
      {reportForChartGen && (
        <div
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -9999,
            width: "1000px",
            height: "auto",
          }}
        >
          {/* 1. Bar Chart */}
          <div ref={barChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
            <ResponsiveContainer>
              <BarChart data={[{
                name: t('reports.charts.emissions_label', 'Emissions (kg CO2e)'),
                [t('reports.charts.emissions_avoided', 'Avoided')]: reportForChartGen.emissionsAvoided,
                [t('reports.charts.emissions_logistics', 'Logistics')]: reportForChartGen.logisticsEmissions,
                [t('reports.charts.emissions_recycling', 'Recycling')]: reportForChartGen.recyclingEmissions
              }]}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey={t('reports.charts.emissions_avoided', 'Avoided')} fill="#4ade80" />
                <Bar dataKey={t('reports.charts.emissions_logistics', 'Logistics')} fill="#f87171" />
                <Bar dataKey={t('reports.charts.emissions_recycling', 'Recycling')} fill="#fb923c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* 2. Emissions Pie Chart */}
          <div ref={emissionsPieChartRef} style={{ width: '800px', height: '400px', backgroundColor: 'white', padding: '20px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[
                  { name: t('reports.charts.logistics_emissions', 'Logistics Emissions'), value: reportForChartGen.logisticsEmissions },
                  { name: t('reports.charts.recycling_emissions', 'Recycling Emissions'), value: reportForChartGen.recyclingEmissions }
                ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
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
                <YAxis label={{ value: t('reports.charts.quantity_kg', 'Quantity (kg)'), angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)} kg`} />
                <Legend />
                <Line type="monotone" dataKey="quantity" name={t('reports.charts.quantity_kg', 'Quantity (kg)')} stroke="#00796b" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- Visible Page Content --- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">{t('reports.title', 'Reports')}</h2>
          <p className="text-gray-500">{t('reports.description', 'View and manage all your generated sustainability reports.')}</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200">
          <Link to="/app/reports/generate">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('reports.button_generate', 'Generate New Report')}
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-gray-50">
                    <TableHead>{t('reports.table_col_title', 'Report Title')}</TableHead>
                    <TableHead>{t('reports.table_col_client', 'Client')}</TableHead>
                    <TableHead>{t('reports.table_col_period', 'Period')}</TableHead>
                    <TableHead>{t('reports.table_col_generated', 'Generated On')}</TableHead>
                    <TableHead className="text-right">{t('reports.table_col_actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length > 0 ? (
                    reports.map((report) => (
                      <TableRow key={report.id} className="border-gray-100 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-800">{report.reportTitle}</TableCell>
                        <TableCell className="text-gray-600">{report.client.companyName}</TableCell>
                        <TableCell className="text-gray-600">{format(new Date(report.startDate), 'MMM d, yyyy')} - {format(new Date(report.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-gray-600">{format(new Date(report.generatedAt), 'PPP')}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/app/reports/preview/${report.id}`)}><Eye className="mr-2 h-4 w-4" /> {t('reports.button_preview', 'Preview')}</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(report.id)} disabled={downloadingId === report.id}>
                            {downloadingId === report.id ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Download className="mr-2 h-4 w-4" />)}
                            {t('reports.button_download', 'Download')}
                          </Button>

                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan="5" className="h-48 text-center text-gray-500">{t('reports.table_no_reports', 'No reports have been generated yet.')}</TableCell></TableRow>
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

