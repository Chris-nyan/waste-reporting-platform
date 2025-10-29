import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // --- NEW ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Import new icons and chart types
import { Users, Recycle, Weight, FileText, Loader2, Leaf, Download } from 'lucide-react';
import {
    Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import useAuth from '../../hooks/use-auth';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';

/**
 * Exports a DOM element as a PNG image.
 * @param {React.RefObject<HTMLElement>} elementRef - Ref to the DOM element to capture.
 * @param {string} filename - The desired filename for the download (without .png).
 */
const handleDownloadImage = async (elementRef, filename) => {
    if (!elementRef.current) return;
    try {
        const canvas = await html2canvas(elementRef.current, {
            useCORS: true,
            scale: 2,
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error exporting chart as PNG:", error);
    }
};

/**
 * Exports an array of objects as a CSV file.
 * @param {Array<Object>} data - The data array to convert.
 * @param {string} filename - The desired filename for the download (without .csv).
 */
const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    try {
        const keys = Object.keys(data[0]);
        const header = keys.join(',') + '\n';
        const rows = data.map(row =>
            keys.map(key => {
                let cell = row[key];
                // Handle commas in cell data by wrapping in quotes
                if (typeof cell === 'string' && cell.includes(',')) {
                    return `"${cell}"`;
                }
                return cell;
            }).join(',')
        ).join('\n');

        const csvContent = 'data:text/csv;charset=utf-8,' + header + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error exporting data as CSV:", error);
    }
};

// --- NEW: Reusable Export Dropdown Component ---
const ExportDropdown = ({ chartRef, chartData, baseFilename, t }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                <Download className="h-4 w-4" />
                <span className="sr-only">Export options</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDownloadImage(chartRef, baseFilename)}>
                {t('dashboard.export.png', 'Export as PNG')}
            </DropdownMenuItem>
            {chartData && chartData.length > 0 && (
                <DropdownMenuItem onClick={() => downloadCSV(chartData, baseFilename)}>
                    {t('dashboard.export.csv', 'Export as CSV')}
                </DropdownMenuItem>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
);


// --- Reusable Components ---
const StatCard = ({ title, value, icon: Icon, loading }) => (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        </CardHeader>
        <CardContent>
            {loading ? <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse mt-1" /> : <div className="text-2xl font-bold text-gray-800">{value}</div>}
        </CardContent>
    </Card>
);

const CHART_COLORS = [
    "#10B981", // Vibrant emerald (primary)
    "#059669", // Deep green accent
    "#34D399", // Fresh mint green
    "#3B82F6", // Bright blue for variety
    "#F59E0B", // Amber highlight (contrast)
    "#EF4444", // Soft red for warning/negative
    "#8B5CF6", // Purple accent (balance)
];

// --- Main Dashboard Component ---
const TenantDashboardPage = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [globalData, setGlobalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeframe, setTimeframe] = useState('6m');
    const [customRange, setCustomRange] = useState({ start: null, end: null });

    // --- Refs for all charts (Unchanged) ---
    const clientLeaderboardRef = useRef(null);
    const clientWasteBreakdownRef = useRef(null);
    const monthlyPickupTrendRef = useRef(null);
    const emissionsAvoidedRef = useRef(null);
    const wasteByCategoryRef = useRef(null);
    const wasteByFacilityRef = useRef(null);
    const globalVsTenantTrendRef = useRef(null);
    const globalCompositionRef = useRef(null);

    // --- useEffect hook for data fetching (Unchanged) ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // --- MODIFIED: Fetch tenant and global data in parallel ---
                let tenantUrl = `/dashboard/tenant?timeframe=${timeframe}`;
                let globalUrl = `/dashboard/global?timeframe=${timeframe}`; // --- NEW ---

                if (timeframe === 'custom' && customRange.start && customRange.end) {
                    const start = customRange.start.toISOString();
                    const end = customRange.end.toISOString();
                    tenantUrl += `&start=${start}&end=${end}`;
                    globalUrl += `&start=${start}&end=${end}`; // --- NEW
                }

                // Use Promise.all to fetch both sets of data
                const [tenantResponse, globalResponse] = await Promise.all([
                    api.get(tenantUrl),
                    api.get(globalUrl) // --- NEW: Fetch from global endpoint
                ]);

                setData(tenantResponse.data);
                setGlobalData(globalResponse.data); // --- NEW: Set global data

            } catch (err) {
                // If global fails, still show tenant data
                if (err.response && err.response.config.url.includes('/dashboard/global')) {
                    console.warn('Could not load global data. Displaying tenant data only.');
                    // Try to get tenant data if it hasn't been set
                    if (!data) {
                        try {
                            const tenantResponse = await api.get(tenantUrl);
                            setData(tenantResponse.data);
                        } catch (tenantError) {
                            setError('Failed to fetch dashboard data. Please try again later.');
                        }
                    }
                } else {
                    setError('Failed to fetch dashboard data. Please try again later.');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeframe, customRange, t]);

    // --- Combine tenant trend data (Unchanged) ---
    const combinedTrendData = data?.charts?.monthlyPickupTrend?.map((tenantEntry) => {
        const globalEntry = globalData?.charts?.platformAveragePickupTrend?.find(
            (g) => g.name === tenantEntry.name
        );
        return {
            name: tenantEntry.name,
            [t('dashboard.charts.global_trend_legend_you', 'Your Volume (kg)')]: tenantEntry.value,
            [t('dashboard.charts.global_trend_legend_avg', 'Platform Average (kg)')]: globalEntry ? globalEntry.value : 0,
        };
    });


    if (error) return <div className="p-4 lg:p-6 text-red-600 bg-red-50 rounded-md m-4">{error}</div>;

    return (
        <div className="flex-1 space-y-6 p-4 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2">
                {/* ... (Header and timeframe selector - no change) ... */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-800">{t('dashboard.title', 'Dashboard')}</h2>
                    <p className="text-gray-500">{t('dashboard.welcome', 'Welcome back, {{name}}! Here\'s your impact overview.', {
                        name: user?.name || t('dashboard.default_user', 'User')
                    })}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-[180px] shadow-sm bg-white">
                            <SelectValue placeholder={t('dashboard.timeframe.select', 'Select timeframe')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30d">{t('dashboard.timeframe.days_30', 'Last 30 Days')}</SelectItem>
                            <SelectItem value="3m">{t('dashboard.timeframe.months_3', 'Last 3 Months')}</SelectItem>
                            <SelectItem value="6m">{t('dashboard.timeframe.months_6', 'Last 6 Months')}</SelectItem>
                            <SelectItem value="1y">{t('dashboard.timeframe.year_1', 'Last Year')}</SelectItem>
                            <SelectItem value="all">{t('dashboard.timeframe.all', 'All Time')}</SelectItem>
                            <SelectItem value="custom">{t('dashboard.timeframe.custom', 'Custom Range')}</SelectItem>
                        </SelectContent>
                    </Select>

                    {timeframe === 'custom' && (
                        <div className="flex items-center space-x-2">
                            <DatePicker
                                selected={customRange.start}
                                onChange={(date) => setCustomRange({ ...customRange, start: date })}
                                selectsStart
                                startDate={customRange.start}
                                endDate={customRange.end}
                                placeholderText={t('dashboard.timeframe.start_date', 'Start date')}
                                className="border rounded-md p-2 text-sm"
                            />
                            <DatePicker
                                selected={customRange.end}
                                onChange={(date) => setCustomRange({ ...customRange, end: date })}
                                selectsEnd
                                startDate={customRange.start}
                                endDate={customRange.end}
                                placeholderText={t('dashboard.timeframe.end_date', 'End date')}
                                className="border rounded-md p-2 text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* --- KPI GRID --- (Unchanged) */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <StatCard title={t('dashboard.kpis.clients', 'Total Clients')} value={data?.kpis?.totalClients ?? '0'} icon={Users} loading={loading} />
                <StatCard title={t('dashboard.kpis.entries', 'Waste Entries')} value={data?.kpis?.totalWasteEntries ?? '0'} icon={Recycle} loading={loading} />
                <StatCard title={t('dashboard.kpis.recycled', 'Total Recycled (kg)')} value={data?.kpis?.totalRecycledWeight?.toLocaleString() ?? '0'} icon={Weight} loading={loading} />
                <StatCard title={t('dashboard.kpis.reports', 'Reports Generated')} value={data?.kpis?.totalReportsGenerated ?? '0'} icon={FileText} loading={loading} />
                <StatCard
                    title={t('dashboard.kpis.emissions', 'Emissions Avoided (kg CO2e)')}
                    value={data?.kpis?.totalEmissionsAvoided?.toLocaleString() ?? '0'}
                    icon={Leaf}
                    loading={loading}
                />
            </div>

            {/* --- NEW: TABS STRUCTURE --- */}
            <Tabs defaultValue="tenant" className="w-full pt-4">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="tenant">{t('dashboard.tabs.tenant', '👤 Your Tenant Information')}</TabsTrigger>
                    <TabsTrigger value="global">{t('dashboard.tabs.global', '🌍 Global Benchmarks')}</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: Your Tenant Information --- */}
                <TabsContent value="tenant" className="pt-4">
                    {/* This div now wraps all 6 of your tenant-specific charts */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.leaderboard_title', 'Client Leaderboard')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.leaderboard_desc', 'Top clients by recycled volume in the period.')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={clientLeaderboardRef} chartData={data?.charts?.clientLeaderboard} baseFilename="client_leaderboard" t={t} />
                            </CardHeader>
                            <CardContent ref={clientLeaderboardRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('dashboard.charts.leaderboard_col_client', 'Client Name')}</TableHead>
                                                <TableHead>{t('dashboard.charts.leaderboard_col_reports', 'Reports Generated')}</TableHead>
                                                <TableHead className="text-right">{t('dashboard.charts.leaderboard_col_total', 'Total (kg)')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data?.charts?.clientLeaderboard?.slice(0, 5).map((client) => (
                                                <TableRow key={client.clientName}>
                                                    <TableCell className="font-medium">{client.clientName}</TableCell>
                                                    <TableCell>{client.reportsGenerated}</TableCell>
                                                    <TableCell className="text-right">{client.totalWeight.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.composition_title', 'Waste Composition by Top Clients')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.composition_desc', 'Breakdown of waste types for your most active clients.')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={clientWasteBreakdownRef} chartData={data?.charts?.clientWasteBreakdown?.data} baseFilename="client_waste_composition" t={t} />
                            </CardHeader>
                            <CardContent ref={clientWasteBreakdownRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <BarChart data={data?.charts?.clientWasteBreakdown?.data} layout="vertical" stackOffset="expand">
                                            {/* ... Chart Content (unchanged) ... */}
                                            <CartesianGrid horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="clientName" type="category" tickLine={false} axisLine={false} width={100} />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                            {data?.charts?.clientWasteBreakdown?.wasteTypes?.map((wasteType, index) => (
                                                <Bar
                                                    key={wasteType}
                                                    dataKey={wasteType}
                                                    stackId="a"
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </BarChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.pickup_trend_title', 'Monthly Pickup Trend')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.pickup_trend_desc', 'Total weight collected month-over-month (by pickup date).')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={monthlyPickupTrendRef} chartData={data?.charts?.monthlyPickupTrend} baseFilename="monthly_pickup_trend" t={t} />
                            </CardHeader>
                            <CardContent ref={monthlyPickupTrendRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <LineChart data={data?.charts?.monthlyPickupTrend}>
                                            {/* ... Chart Content (unchanged) ... */}
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="name"
                                                type="category"
                                                interval={0}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Line type="monotone" dataKey="value" name={t('dashboard.charts.pickup_trend_legend', 'Collected (kg)')} stroke={CHART_COLORS[3]} strokeWidth={2} />
                                        </LineChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.emissions_title', 'Emissions Avoided by Material')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.emissions_desc', 'Environmental impact based on material type (kg CO2e).')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={emissionsAvoidedRef} chartData={data?.charts?.emissionsAvoidedBreakdown} baseFilename="emissions_by_material" t={t} />
                            </CardHeader>
                            <CardContent ref={emissionsAvoidedRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <BarChart data={data?.charts?.emissionsAvoidedBreakdown}>
                                            {/* ... Chart Content (unchanged) ... */}
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" name={t('dashboard.charts.emissions_legend', 'Emissions (kg CO2e)')} fill={CHART_COLORS[1]} />
                                        </BarChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.category_title', 'Waste by Category')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.category_desc', 'High-level breakdown of all waste processed.')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={wasteByCategoryRef} chartData={data?.charts?.wasteByCategory} baseFilename="waste_by_category" t={t} />
                            </CardHeader>
                            <CardContent ref={wasteByCategoryRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <PieChart>
                                            {/* ... Chart Content (unchanged) ... */}
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                            <Pie
                                                data={data?.charts?.wasteByCategory}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            >
                                                {data?.charts?.wasteByCategory?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.facility_title', 'Recycling by Facility')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.facility_desc', 'Total volume processed at each facility (kg).')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={wasteByFacilityRef} chartData={data?.charts?.wasteByFacility} baseFilename="recycling_by_facility" t={t} />
                            </CardHeader>
                            <CardContent ref={wasteByFacilityRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <BarChart data={data?.charts?.wasteByFacility}>
                                            {/* ... Chart Content (unchanged) ... */}
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="value" name={t('dashboard.charts.facility_legend', 'Weight (kg)')} fill={CHART_COLORS[2]} />
                                        </BarChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- TAB 2: Global Benchmarks --- */}
                {/* --- TAB 2: Global Benchmarks --- */}
                <TabsContent value="global" className="space-y-6 pt-4">
                    <p className="text-sm text-gray-500">
                        {t('dashboard.global.desc', 'See how your impact compares to the entire platform.')}
                    </p>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Volume Trend vs Tenant */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.global_trend_title', 'Your Volume vs. Platform Average')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.global_trend_desc', 'Monthly collected volume (kg) compared to the average.')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={globalVsTenantTrendRef} chartData={combinedTrendData} baseFilename="volume_vs_average_trend" t={t} />
                            </CardHeader>
                            <CardContent ref={globalVsTenantTrendRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <LineChart data={combinedTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" type="category" interval={0} tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                            <Line type="monotone" dataKey={t('dashboard.charts.global_trend_legend_you', 'Your Volume (kg)')} stroke={CHART_COLORS[0]} strokeWidth={2} />
                                            <Line type="monotone" dataKey={t('dashboard.charts.global_trend_legend_avg', 'Platform Average (kg)')} stroke={CHART_COLORS[3]} strokeWidth={2} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Global Waste Composition */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.global_composition_title', 'Global Waste Composition')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.global_composition_desc', 'Breakdown of all waste processed on the platform.')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={globalCompositionRef} chartData={globalData?.charts?.platformWasteComposition} baseFilename="global_waste_composition" t={t} />
                            </CardHeader>
                            <CardContent ref={globalCompositionRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <PieChart>
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                            <Pie
                                                data={globalData?.charts?.platformWasteComposition}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            >
                                                {globalData?.charts?.platformWasteComposition?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* --- NEW: Global Emissions Trend --- */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.global_emissions_title', 'Global Emissions Trend')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.global_emissions_desc', 'Monthly CO2e emissions across the platform.')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={emissionsAvoidedRef} chartData={globalData?.charts?.platformAverageEmissionsTrend} baseFilename="global_emissions_trend" t={t} />
                            </CardHeader>
                            <CardContent ref={emissionsAvoidedRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <LineChart data={globalData?.charts?.platformAverageEmissionsTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" type="category" interval={0} tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                            <Line type="monotone" dataKey="value" name={t('dashboard.charts.emissions_legend', 'Emissions (kg CO2e)')} stroke={CHART_COLORS[1]} strokeWidth={2} />
                                        </LineChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* --- NEW: Global Monthly Composition (Stacked Bar / Heatmap) --- */}
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-gray-800">{t('dashboard.charts.global_monthly_composition_title', 'Global Waste by Category')}</CardTitle>
                                    <CardDescription>{t('dashboard.charts.global_monthly_composition_desc', 'Monthly breakdown of all waste categories across the platform.')}</CardDescription>
                                </div>
                                <ExportDropdown chartRef={wasteByCategoryRef} chartData={globalData?.charts?.globalMonthlyComposition?.data} baseFilename="global_monthly_composition" t={t} />
                            </CardHeader>
                            <CardContent ref={wasteByCategoryRef}>
                                {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <BarChart data={globalData?.charts?.globalMonthlyComposition?.data}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                            {globalData?.charts?.globalMonthlyComposition?.keys?.map((key, index) => (
                                                <Bar key={key} dataKey={key} stackId="a" fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </BarChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- OLD CHART SECTIONS (REMOVED) --- */}
            {/* The h3 and div grids that were here are now inside the TabsContent blocks above */}

        </div>
    );
};

export default TenantDashboardPage;