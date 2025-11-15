import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  sales: number;
}

interface Order {
  id: string;
  date: string;
  status: 'delivered' | 'processing' | 'shipped';
  total: number;
  items: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Беспроводные наушники', price: 8990, category: 'Электроника', stock: 45, image: '/placeholder.svg', sales: 156 },
    { id: 2, name: 'Смарт-часы', price: 15990, category: 'Электроника', stock: 23, image: '/placeholder.svg', sales: 89 },
    { id: 3, name: 'Рюкзак городской', price: 3490, category: 'Аксессуары', stock: 67, image: '/placeholder.svg', sales: 234 },
    { id: 4, name: 'Термокружка', price: 1290, category: 'Дом', stock: 120, image: '/placeholder.svg', sales: 567 },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: '#ORD-2024-001', date: '15.11.2024', status: 'delivered', total: 24990, items: 3 },
    { id: '#ORD-2024-002', date: '14.11.2024', status: 'processing', total: 8990, items: 1 },
    { id: '#ORD-2024-003', date: '13.11.2024', status: 'shipped', total: 45600, items: 5 },
  ]);

  const stats = {
    revenue: 1234567,
    orders: 342,
    products: products.length,
    customers: 1856,
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
                        Топ товары по продажам
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {products.sort((a, b) => b.sales - a.sales).slice(0, 4).map((product) => (
                          <div key={product.id} className="flex items-center gap-4">
                            <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.sales} продаж</p>
                            </div>
                            <Badge variant="secondary">{product.price} ₽</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="Clock" size={20} />
                        Последние заказы
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{order.total} ₽</p>
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
                          <Input id="name" placeholder="Введите название товара" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="price">Цена (₽)</Label>
                            <Input id="price" type="number" placeholder="0" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="stock">Количество</Label>
                            <Input id="stock" type="number" placeholder="0" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Категория</Label>
                          <Input id="category" placeholder="Электроника, Одежда..." />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Описание</Label>
                          <Textarea id="description" placeholder="Описание товара" rows={4} />
                        </div>
                        <Button>Создать товар</Button>
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
                          <TableHead>Продажи</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                <span className="font-medium">{product.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell className="font-semibold">{product.price} ₽</TableCell>
                            <TableCell>
                              <Badge variant={product.stock < 30 ? 'destructive' : 'secondary'}>
                                {product.stock} шт
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{product.sales}</TableCell>
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
                        {orders.map((order) => (
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
