import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Import new icons and chart types
import { Users, Recycle, Weight, FileText, Loader2, Leaf } from 'lucide-react';
import {
    Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import useAuth from '../../hooks/use-auth';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeframe, setTimeframe] = useState('6m');

    const [customRange, setCustomRange] = useState({ start: null, end: null });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // If custom timeframe, send both start and end dates
                let url = `/dashboard/tenant?timeframe=${timeframe}`;
                if (timeframe === 'custom' && customRange.start && customRange.end) {
                    url += `&start=${customRange.start.toISOString()}&end=${customRange.end.toISOString()}`;
                }

                const response = await api.get(url);
                setData(response.data);
            } catch (err) {
                setError('Failed to fetch dashboard data. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeframe, customRange, t]);


    if (error) return <div className="p-4 lg:p-6 text-red-600 bg-red-50 rounded-md m-4">{error}</div>;

    return (
        <div className="flex-1 space-y-6 p-4 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2">
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

                    {/* Show date pickers only for custom */}
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

            {/* --- UPDATED KPI GRID --- */}
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-800">{t('dashboard.charts.leaderboard_title', 'Client Leaderboard')}</CardTitle>
                        <CardDescription>{t('dashboard.charts.leaderboard_desc', 'Top clients by recycled volume in the period.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    <CardHeader>
                        <CardTitle className="text-gray-800">{t('dashboard.charts.composition_title', 'Waste Composition by Top Clients')}</CardTitle>
                        <CardDescription>{t('dashboard.charts.composition_desc', 'Breakdown of waste types for your most active clients.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                            <ChartContainer config={{}} className="h-[300px] w-full">
                                <BarChart data={data?.charts?.clientWasteBreakdown?.data} layout="vertical" stackOffset="expand">
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

                {/* --- NEW CHART 1: Monthly Pickup Trend (Line) --- */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-800">{t('dashboard.charts.pickup_trend_title', 'Monthly Pickup Trend')}</CardTitle>
                        <CardDescription>{t('dashboard.charts.pickup_trend_desc', 'Total weight collected month-over-month (by pickup date).')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                            <ChartContainer config={{}} className="h-[300px] w-full">
                                <LineChart data={data?.charts?.monthlyPickupTrend}>
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

                {/* --- NEW CHART 2: Emissions Avoided (Bar) --- */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-800">{t('dashboard.charts.emissions_title', 'Emissions Avoided by Material')}</CardTitle>
                        <CardDescription>{t('dashboard.charts.emissions_desc', 'Environmental impact based on material type (kg CO2e).')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                            <ChartContainer config={{}} className="h-[300px] w-full">
                                <BarChart data={data?.charts?.emissionsAvoidedBreakdown}>
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

                {/* --- NEW CHART 3: Waste by Category (Pie) --- */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-800">{t('dashboard.charts.category_title', 'Waste by Category')}</CardTitle>
                        <CardDescription>{t('dashboard.charts.category_desc', 'High-level breakdown of all waste processed.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                            <ChartContainer config={{}} className="h-[300px] w-full">
                                <PieChart>
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

                {/* --- NEW CHART 4: Waste by Facility (Bar) --- */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-800">{t('dashboard.charts.facility_title', 'Recycling by Facility')}</CardTitle>
                        <CardDescription>{t('dashboard.charts.facility_desc', 'Total volume processed at each facility (kg).')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
                            <ChartContainer config={{}} className="h-[300px] w-full">
                                <BarChart data={data?.charts?.wasteByFacility}>
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
        </div>
    );
};

export default TenantDashboardPage;