import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportFullReport } from '@/lib/excel-export';
import { useLanguage } from '@/contexts/LanguageContext';
import LiveActivityFeed from './LiveActivityFeed';
import QuickActions from './QuickActions';

interface Analytics {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  revenueData: Array<{ name: string; revenue: number }>;
  ordersData: Array<{ name: string; orders: number; customers: number }>;
}

interface Order {
  id: string;
  customerName: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered';
  total: number;
}

interface DashboardTabProps {
  analytics: Analytics;
  orders: Order[];
  products: any[];
  customers: any[];
  onNavigate?: (tab: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ analytics, orders, products, customers, onNavigate }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6 animate-fade-in">
      {onNavigate && <QuickActions onNavigate={onNavigate} />}
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {t('dashboard')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Обзор ключевых метрик вашего бизнеса</p>
        </div>
        <Button onClick={() => exportFullReport(products, orders, customers, analytics)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Icon name="FileDown" className="mr-2 h-4 w-4" />
          {t('exportFullReport')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-purple-600 shadow-lg hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
              <Icon name="DollarSign" className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics?.revenue || 0).toLocaleString('ru-RU')} ₽</div>
            <p className="text-xs text-muted-foreground mt-1">+12.5% от прошлого месяца</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-lg hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('orders')}</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
              <Icon name="ShoppingCart" className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.orders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+8.2% от прошлого месяца</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-lg hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('products')}</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800">
              <Icon name="Package" className="h-4 w-4 text-green-700 dark:text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.products || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">В наличии и активны</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600 shadow-lg hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('customers')}</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800">
              <Icon name="Users" className="h-4 w-4 text-orange-700 dark:text-orange-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.customers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+15 новых за неделю</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders & Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.ordersData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#8884d8" />
                <Bar dataKey="customers" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Clock" className="text-blue-600" />
              {t('recentOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderId')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders || []).slice(0, 5).map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === 'delivered' ? 'default' : 'secondary'}
                        className={
                          order.status === 'delivered' ? 'bg-green-600' :
                          order.status === 'shipped' ? 'bg-blue-600' :
                          'bg-orange-600'
                        }
                      >
                        {t(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{(order.total || 0).toLocaleString('ru-RU')} ₽</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <LiveActivityFeed />
      </div>
    </div>
  );
};

export default DashboardTab;