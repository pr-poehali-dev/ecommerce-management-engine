import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/26680cc3-0053-45ae-ac6a-1c7a3c94505c';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

interface Order {
  id: string;
  customerName?: string;
  customerEmail?: string;
  date: string;
  status: 'delivered' | 'processing' | 'shipped';
  total: number;
  items: number;
  address?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  totalSpent: number;
  totalOrders: number;
  status: string;
  joinedDate: string;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    products: 0,
    customers: 0,
  });
  const { toast } = useToast();

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, customersRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}?path=products`),
        fetch(`${API_URL}?path=orders`),
        fetch(`${API_URL}?path=customers`),
        fetch(`${API_URL}?path=analytics`),
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const customersData = await customersRes.json();
      const analyticsData = await analyticsRes.json();

      setProducts(productsData.products || []);
      setOrders(ordersData.orders || []);
      setCustomers(customersData.customers || []);
      setStats(analyticsData.stats || stats);
      setChartData(analyticsData.chartData || []);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки данных',
        description: 'Не удалось загрузить данные с сервера',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const response = await fetch(`${API_URL}?path=products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          stock: parseInt(newProduct.stock),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Товар добавлен',
          description: 'Товар успешно добавлен в каталог',
        });
        setNewProduct({ name: '', description: '', price: '', category: '', stock: '' });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить товар',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'processing': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'shipped': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Доставлен';
      case 'processing': return 'Обработка';
      case 'shipped': return 'Отправлен';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Icon name="Store" className="text-sidebar-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">ShopAdmin</h1>
                <p className="text-xs text-sidebar-foreground/60">E-commerce движок</p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', icon: 'LayoutDashboard', label: 'Дашборд' },
                { id: 'products', icon: 'Package', label: 'Товары' },
                { id: 'orders', icon: 'ShoppingCart', label: 'Заказы' },
                { id: 'customers', icon: 'Users', label: 'Клиенты' },
                { id: 'profile', icon: 'User', label: 'Профиль' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Добро пожаловать!</h2>
                  <p className="text-muted-foreground">Вот что происходит в вашем магазине сегодня</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Выручка', value: `${(stats.revenue / 1000).toFixed(0)}K ₽`, icon: 'TrendingUp', color: 'text-green-600', bg: 'bg-green-500/10' },
                    { label: 'Заказы', value: stats.orders, icon: 'ShoppingCart', color: 'text-blue-600', bg: 'bg-blue-500/10' },
                    { label: 'Товары', value: stats.products, icon: 'Package', color: 'text-purple-600', bg: 'bg-purple-500/10' },
                    { label: 'Клиенты', value: stats.customers, icon: 'Users', color: 'text-orange-600', bg: 'bg-orange-500/10' },
                  ].map((stat, idx) => (
                    <Card key={idx} className="hover-scale cursor-pointer border-2">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </CardTitle>
                        <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <Icon name={stat.icon} className={stat.color} size={20} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stat.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="TrendingUp" size={20} />
                        Аналитика продаж
                      </CardTitle>
                      <CardDescription>Динамика выручки за неделю</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#6E59A5" strokeWidth={3} dot={{ fill: '#6E59A5' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="BarChart3" size={20} />
                        Заказы и клиенты
                      </CardTitle>
                      <CardDescription>Новые заказы и клиенты</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Bar dataKey="orders" fill="#0EA5E9" radius={[8, 8, 0, 0]} name="Заказы" />
                          <Bar dataKey="customers" fill="#6E59A5" radius={[8, 8, 0, 0]} name="Клиенты" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Clock" size={20} />
                      Последние заказы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.customerName || 'Клиент'} • {order.date}</p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="font-semibold">{order.total} ₽</p>
                              <p className="text-sm text-muted-foreground">{order.items} товара</p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Управление товарами</h2>
                    <p className="text-muted-foreground">Добавляйте, редактируйте и отслеживайте товары</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="gap-2">
                        <Icon name="Plus" size={20} />
                        Добавить товар
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Новый товар</DialogTitle>
                        <DialogDescription>Заполните информацию о товаре</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Название</Label>
                          <Input 
                            id="name" 
                            placeholder="Введите название товара" 
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="price">Цена (₽)</Label>
                            <Input 
                              id="price" 
                              type="number" 
                              placeholder="0" 
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="stock">Количество</Label>
                            <Input 
                              id="stock" 
                              type="number" 
                              placeholder="0" 
                              value={newProduct.stock}
                              onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Категория</Label>
                          <Input 
                            id="category" 
                            placeholder="Электроника, Одежда..." 
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Описание</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Описание товара" 
                            rows={4}
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          />
                        </div>
                        <Button onClick={handleAddProduct}>Создать товар</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Товар</TableHead>
                          <TableHead>Категория</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead>Остаток</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  {product.description && (
                                    <p className="text-xs text-muted-foreground">{product.description.substring(0, 50)}...</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell className="font-semibold">{product.price} ₽</TableCell>
                            <TableCell>
                              <Badge variant={product.stock < 30 ? 'destructive' : 'secondary'}>
                                {product.stock} шт
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Icon name="Pencil" size={16} />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Icon name="Trash2" size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Управление заказами</h2>
                  <p className="text-muted-foreground">Отслеживайте статусы и обрабатывайте заказы</p>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Номер заказа</TableHead>
                          <TableHead>Клиент</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Сумма</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{order.customerName || 'Клиент'}</p>
                                <p className="text-xs text-muted-foreground">{order.customerEmail || ''}</p>
                              </div>
                            </TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">{order.total} ₽</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="gap-2">
                                Детали
                                <Icon name="ChevronRight" size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">CRM - Управление клиентами</h2>
                  <p className="text-muted-foreground">База клиентов и история их покупок</p>
                </div>

                <div className="grid gap-4">
                  {customers.map((customer) => (
                    <Card key={customer.id} className="hover-scale">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={customer.avatar || '/placeholder.svg'} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                                {customer.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold">{customer.name}</h3>
                                <Badge variant={customer.status === 'premium' ? 'default' : 'secondary'} className="gap-1">
                                  {customer.status === 'premium' && <Icon name="Star" size={12} />}
                                  {customer.status === 'premium' ? 'Премиум' : 'Активный'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{customer.email}</p>
                              {customer.phone && (
                                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{customer.totalSpent.toLocaleString()} ₽</p>
                            <p className="text-sm text-muted-foreground">{customer.totalOrders} заказов</p>
                            <p className="text-xs text-muted-foreground mt-1">С {customer.joinedDate}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Личный кабинет</h2>
                  <p className="text-muted-foreground">Управляйте своим профилем и заказами</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle>Профиль</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 mb-4">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">АИ</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold">Александр Иванов</h3>
                        <p className="text-sm text-muted-foreground mb-4">alex@example.com</p>
                        <Badge variant="secondary" className="gap-1">
                          <Icon name="Star" size={14} />
                          Премиум клиент
                        </Badge>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Заказов всего</span>
                          <span className="font-semibold">23</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">На сумму</span>
                          <span className="font-semibold">234 890 ₽</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Кэшбэк</span>
                          <span className="font-semibold text-green-600">2 348 ₽</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full gap-2">
                        <Icon name="Settings" size={16} />
                        Настройки
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Мои заказы</CardTitle>
                      <CardDescription>История ваших покупок</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-lg">{order.id}</p>
                                <p className="text-sm text-muted-foreground">{order.date}</p>
                              </div>
                              <Badge variant="outline" className={getStatusColor(order.status)}>
                                {getStatusText(order.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Icon name="Package" size={14} />
                                  {order.items} товар(а)
                                </span>
                                <span className="font-semibold text-foreground">{order.total} ₽</span>
                              </div>
                              <Button variant="ghost" size="sm" className="gap-2">
                                Детали
                                <Icon name="ChevronRight" size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
