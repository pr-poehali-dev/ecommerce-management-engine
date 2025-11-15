import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportProductsToExcel, exportOrdersToExcel, exportCustomersToExcel, exportFullReport } from '@/lib/excel-export';

const API_URL = 'https://functions.poehali.dev/26680cc3-0053-45ae-ac6a-1c7a3c94505c';

interface IndexProps {
  onLogout: () => void;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
}

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

interface Analytics {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  revenueData: Array<{ name: string; revenue: number }>;
  ordersData: Array<{ name: string; orders: number; customers: number }>;
}

const Index: React.FC<IndexProps> = ({ onLogout }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', price: 0, stock: 0 });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>('all');

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Marketplaces state
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics>({
    revenue: 0,
    orders: 0,
    products: 0,
    customers: 0,
    revenueData: [],
    ordersData: []
  });

  // User info
  const [userInfo, setUserInfo] = useState({ email: '', name: '' });

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || email.split('@')[0];
    setUserInfo({ email, name });
  }, []);

  // Fetch data functions
  const fetchProducts = async (category: string = 'all') => {
    setLoading(true);
    try {
      const url = category === 'all' 
        ? `${API_URL}?path=products`
        : `${API_URL}?path=products&category=${encodeURIComponent(category)}`;
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.products || []);
      if (data.categories) setCategories(data.categories);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (status: string = 'all') => {
    setLoading(true);
    try {
      const url = status === 'all'
        ? `${API_URL}?path=orders`
        : `${API_URL}?path=orders&status=${status}`;
      const response = await fetch(url);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=customers`);
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load customers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketplaces = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=marketplaces`);
      const data = await response.json();
      setMarketplaces(data.marketplaces || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load marketplaces', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') fetchProducts(selectedCategory);
    if (activeTab === 'orders') fetchOrders(orderStatus);
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'marketplaces') fetchMarketplaces();
    if (activeTab === 'dashboard') fetchAnalytics();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders(orderStatus);
  }, [orderStatus]);

  // Product CRUD operations
  const handleAddProduct = async () => {
    try {
      const response = await fetch(`${API_URL}?path=products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Product added successfully' });
        setProductDialog(false);
        setProductForm({ name: '', description: '', category: '', price: 0, stock: 0 });
        fetchProducts(selectedCategory);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add product', variant: 'destructive' });
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const response = await fetch(`${API_URL}?path=products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, id: editingProduct?.id })
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Product updated successfully' });
        setProductDialog(false);
        setEditingProduct(null);
        setProductForm({ name: '', description: '', category: '', price: 0, stock: 0 });
        fetchProducts(selectedCategory);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`${API_URL}?path=products&id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'Product deleted successfully' });
        fetchProducts(selectedCategory);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock
    });
    setProductDialog(true);
  };

  const handleConnectMarketplace = (marketplaceName: string) => {
    toast({ title: 'Info', description: `Connecting to ${marketplaceName}...` });
  };

  // Render functions for each tab
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <Button onClick={() => exportFullReport(products, orders, customers, analytics)}>
          <Icon name="FileDown" className="mr-2 h-4 w-4" />
          Export Full Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Icon name="DollarSign" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.revenue.toLocaleString('ru-RU')} ₽</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <Icon name="ShoppingCart" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Icon name="Package" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.products}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Icon name="Users" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.customers}</div>
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
              <LineChart data={analytics.revenueData}>
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
              <BarChart data={analytics.ordersData}>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.total.toLocaleString('ru-RU')} ₽</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Products</h2>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportProductsToExcel(products)}>
            <Icon name="FileDown" className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', category: '', price: 0, stock: 0 }); setProductDialog(true); }}>
            <Icon name="Plus" className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price.toLocaleString('ru-RU')} ₽</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                          <Icon name="Pencil" className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                          <Icon name="Trash2" className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
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
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.marketplace}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          order.status === 'delivered' ? 'default' : 
                          order.status === 'shipped' ? 'secondary' : 
                          'outline'
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
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Customers</h2>
        <Button variant="outline" onClick={() => exportCustomersToExcel(customers)}>
          <Icon name="FileDown" className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Badge variant={customer.status === 'premium' ? 'default' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>{customer.totalSpent.toLocaleString('ru-RU')} ₽</TableCell>
                    <TableCell>{customer.joinedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketplaces = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Marketplaces</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : (
          marketplaces.map((marketplace) => (
            <Card key={marketplace.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <Icon name="Store" className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{marketplace.name}</CardTitle>
                      <CardDescription>{marketplace.country}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={marketplace.connected ? 'default' : 'outline'}>
                    {marketplace.connected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant={marketplace.connected ? 'outline' : 'default'}
                  onClick={() => handleConnectMarketplace(marketplace.name)}
                >
                  <Icon name={marketplace.connected ? 'Settings' : 'Link'} className="mr-2 h-4 w-4" />
                  {marketplace.connected ? 'Manage' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Profile</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <p className="text-lg font-medium">{userInfo.name}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-lg font-medium">{userInfo.email}</p>
            </div>
            <Button variant="destructive" onClick={onLogout} className="w-full mt-4">
              <Icon name="LogOut" className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Products:</span>
              <span className="font-semibold">{analytics.products}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Orders:</span>
              <span className="font-semibold">{analytics.orders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Customers:</span>
              <span className="font-semibold">{analytics.customers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Revenue:</span>
              <span className="font-semibold">{analytics.revenue.toLocaleString('ru-RU')} ₽</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold">E-Commerce</h1>
        </div>
        <nav className="space-y-1 px-3">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
            { id: 'products', label: 'Products', icon: 'Package' },
            { id: 'orders', label: 'Orders', icon: 'ShoppingCart' },
            { id: 'customers', label: 'Customers', icon: 'Users' },
            { id: 'marketplaces', label: 'Marketplaces', icon: 'Store' },
            { id: 'profile', label: 'Profile', icon: 'User' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Icon name={tab.icon} className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'marketplaces' && renderMarketplaces()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </div>

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Create a new product'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(false)}>Cancel</Button>
            <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
