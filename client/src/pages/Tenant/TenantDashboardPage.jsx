import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Recycle, Weight, FileText, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import useAuth from '../../hooks/use-auth';
import api from '../../lib/api';

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

const CHART_COLORS = ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5", "#E5E7EB"];

// --- Main Dashboard Component ---
const TenantDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('6m');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/dashboard/tenant?timeframe=${timeframe}`);
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [timeframe]);

  if (error) return <div className="p-4 lg:p-6 text-red-600 bg-red-50 rounded-md m-4">{error}</div>;

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h2>
            <p className="text-gray-500">Welcome back, {user?.name || 'User'}! Here's your impact overview.</p>
        </div>
        <div className="flex items-center space-x-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px] shadow-sm bg-white">
                <SelectValue placeholder="Select a timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Clients" value={data?.kpis?.totalClients ?? '0'} icon={Users} loading={loading} />
        <StatCard title="Waste Entries" value={data?.kpis?.totalWasteEntries ?? '0'} icon={Recycle} loading={loading} />
        <StatCard title="Total Recycled (kg)" value={data?.kpis?.totalRecycledWeight?.toLocaleString() ?? '0'} icon={Weight} loading={loading} />
        <StatCard title="Reports Generated" value={data?.kpis?.totalReportsGenerated ?? '0'} icon={FileText} loading={loading} />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Client Leaderboard</CardTitle>
            <CardDescription>Top clients by recycled volume in the period.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Reports Generated</TableHead>
                    <TableHead className="text-right">Total (kg)</TableHead>
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
            <CardTitle className="text-gray-800">Waste Composition by Top Clients</CardTitle>
            <CardDescription>Breakdown of waste types for your most active clients.</CardDescription>
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
      </div>
    </div>
  );
};

export default TenantDashboardPage;

