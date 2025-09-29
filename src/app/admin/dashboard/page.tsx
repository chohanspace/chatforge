// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, UserPlus, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
  } from 'recharts';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardData = {
    stats: {
        totalUsers: number;
        newUsers: number;
        totalSubmissions: number;
    },
    recentSubmissions: any[];
    signupChartData: { date: string, signups: number }[];
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getDashboardStats();
        if (result.error) {
          toast({ title: 'Error fetching stats', description: result.error, variant: 'destructive' });
        } else {
          setData(result);
        }
      } catch (e) {
        toast({ title: 'An unexpected error occurred.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return <div className="text-center text-muted-foreground">Could not load dashboard data.</div>;
  }

  const { stats, signupChartData } = data;

  const statCards = [
      { title: "Total Users", value: stats.totalUsers, description: "All registered users", icon: Users },
      { title: "New Users (7d)", value: `+${stats.newUsers}`, description: "Signups in the last week", icon: UserPlus },
      { title: "Total Submissions", value: stats.totalSubmissions, description: "Plan inquiries received", icon: Mail },
  ]

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">A high-level overview of your application.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            {statCards.map((card, i) => (
                <motion.div
                    key={card.title}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                >
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>

        <div className="grid gap-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5"/>Weekly Signups</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <RechartsBarChart data={signupChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                                stroke="#888888"
                                fontSize={12}
                            />
                            <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                            <Bar dataKey="signups" fill="hsl(var(--primary))" name="New Users" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

const DashboardSkeleton = () => (
    <div className="space-y-8">
        <div>
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
         <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-7 w-1/4" />
                    <Skeleton className="h-3 w-1/2 mt-1" />
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-7 w-1/4" />
                    <Skeleton className="h-3 w-1/2 mt-1" />
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-7 w-1/4" />
                    <Skeleton className="h-3 w-1/2 mt-1" />
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-8">
            <Card className="shadow-lg">
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent>
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
);
