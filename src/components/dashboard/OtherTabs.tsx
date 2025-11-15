import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { exportOrdersToExcel, exportCustomersToExcel } from '@/lib/excel-export';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  marketplace: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered';
  items: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
}

interface Marketplace {
  id: string;
  name: string;
  logo: string;
  country: string;
  connected: boolean;
}

interface OtherTabsProps {
  activeTab: string;
  orders: Order[];
  orderStatus: string;
  setOrderStatus: (status: string) => void;
  customers: Customer[];
  marketplaces: Marketplace[];
  userInfo: { email: string; name: string };
  handleConnectMarketplace: (marketplace: Marketplace) => void;
  onLogout: () => void;
}

const OtherTabs: React.FC<OtherTabsProps> = ({
  activeTab,
  orders,
  orderStatus,
  setOrderStatus,
  customers,
  marketplaces,
  userInfo,
  handleConnectMarketplace,
  onLogout
}) => {
  if (activeTab === 'orders') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Orders</h2>
          <Button variant="outline" onClick={() => exportOrdersToExcel(orders)}>
            <Icon name="FileDown" className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="flex gap-2">
          {['all', 'processing', 'shipped', 'delivered'].map((status) => (
            <Button
              key={status}
              variant={orderStatus === status ? 'default' : 'outline'}
              onClick={() => setOrderStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.marketplace || 'Direct'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'delivered'
                            ? 'default'
                            : order.status === 'shipped'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>{order.total.toLocaleString('ru-RU')} ₽</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'customers') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Customers</h2>
          <Button variant="outline" onClick={() => exportCustomersToExcel(customers)}>
            <Icon name="FileDown" className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="grid gap-4">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}`} />
                    <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                    {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{customer.totalSpent.toLocaleString('ru-RU')} ₽</div>
                  <div className="text-sm text-muted-foreground">{customer.totalOrders} orders</div>
                  <Badge variant={customer.status === 'premium' ? 'default' : 'secondary'} className="mt-2">
                    {customer.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'marketplaces') {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Marketplace Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {marketplaces.map((marketplace) => (
            <Card key={marketplace.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <img src={marketplace.logo} alt={marketplace.name} className="h-8 w-8 rounded" />
                  <Badge variant={marketplace.connected ? 'default' : 'outline'}>
                    {marketplace.connected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-1">{marketplace.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{marketplace.country}</p>
                <Button
                  className="w-full"
                  variant={marketplace.connected ? 'outline' : 'default'}
                  onClick={() => handleConnectMarketplace(marketplace)}
                >
                  {marketplace.connected ? 'Manage' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Profile</h2>
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userInfo.name}`} />
                <AvatarFallback>{userInfo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">{userInfo.name}</div>
                <div className="text-sm text-muted-foreground">{userInfo.email}</div>
              </div>
            </div>
            <Button variant="destructive" onClick={onLogout} className="w-full">
              <Icon name="LogOut" className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default OtherTabs;