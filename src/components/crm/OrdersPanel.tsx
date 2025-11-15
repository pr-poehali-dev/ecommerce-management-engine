import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  marketplace_name?: string;
  status: string;
  total_amount: number;
  items_count: number;
  order_date: string;
  fulfillment_type?: string;
  tracking_number?: string;
  shipped_at?: string;
}

const OrdersPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all'
        ? `${CRM_API}/?action=getOrders`
        : `${CRM_API}/?action=getOrders&status=${filterStatus}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${CRM_API}/?action=updateOrderStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      const data = await response.json();
      
      if (data.order) {
        toast({
          title: 'Успешно',
          description: 'Статус заказа обновлен'
        });
        loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive'
      });
    }
  };

  const handleShipOrder = async () => {
    if (!shippingOrder || !trackingNumber) {
      toast({
        title: 'Ошибка',
        description: 'Укажите трек-номер',
        variant: 'destructive'
      });
      return;
    }

    try {
      setShipping(true);
      const response = await fetch(`${CRM_API}/?action=shipOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: shippingOrder.id, 
          trackingNumber 
        })
      });

      const data = await response.json();
      
      if (data.order) {
        toast({
          title: 'Заказ отправлен',
          description: `Трек-номер: ${trackingNumber}`
        });
        setShippingDialogOpen(false);
        setTrackingNumber('');
        loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить заказ',
        variant: 'destructive'
      });
    } finally {
      setShipping(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      processing: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      shipped: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
      returned: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    };
    return colors[status] || colors.new;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: 'Новый',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён',
      returned: 'Возврат'
    };
    return texts[status] || status;
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Заказы</h2>
          <p className="text-muted-foreground mt-1">
            Все заказы с маркетплейсов
          </p>
        </div>
        <Button variant="outline">
          <Icon name="Download" className="mr-2 h-4 w-4" />
          Экспорт
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Поиск по номеру заказа или клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="processing">В обработке</SelectItem>
            <SelectItem value="shipped">Отправлены</SelectItem>
            <SelectItem value="delivered">Доставлены</SelectItem>
            <SelectItem value="cancelled">Отменены</SelectItem>
            <SelectItem value="returned">Возвраты</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Icon name="ShoppingCart" className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Заказов не найдено</p>
            <p className="text-sm mt-2">Измените фильтры или дождитесь новых заказов</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{order.order_number}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Клиент</p>
                        <p className="font-medium">{order.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Маркетплейс</p>
                        <p className="font-medium">
                          {order.marketplace_name || '—'}
                          {order.fulfillment_type && (
                            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                              {order.fulfillment_type}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Сумма</p>
                        <p className="font-medium">{formatMoney(order.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Дата</p>
                        <p className="font-medium">{formatDate(order.order_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="Package" className="h-4 w-4" />
                        <span>{order.items_count} товар(ов)</span>
                      </div>
                      {order.tracking_number && (
                        <div className="flex items-center gap-2">
                          <Icon name="Truck" className="h-4 w-4" />
                          <span className="font-mono">{order.tracking_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      <Icon name="Eye" className="mr-2 h-3 w-3" />
                      Детали
                    </Button>
                    {(order.status === 'new' || order.status === 'processing') && !order.tracking_number && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setShippingOrder(order);
                          setShippingDialogOpen(true);
                        }}
                      >
                        <Icon name="Truck" className="mr-2 h-3 w-3" />
                        Отправить
                      </Button>
                    )}
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <Icon name="RefreshCw" className="h-3 w-3" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новый</SelectItem>
                        <SelectItem value="processing">В обработке</SelectItem>
                        <SelectItem value="shipped">Отправлен</SelectItem>
                        <SelectItem value="delivered">Доставлен</SelectItem>
                        <SelectItem value="cancelled">Отменён</SelectItem>
                        <SelectItem value="returned">Возврат</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Показано {filteredOrders.length} из {orders.length} заказов</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Icon name="ChevronLeft" className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправка заказа</DialogTitle>
          </DialogHeader>
          {shippingOrder && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Заказ:</span>
                  <span className="font-semibold">{shippingOrder.order_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Клиент:</span>
                  <span className="font-medium">{shippingOrder.customer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Сумма:</span>
                  <span className="font-semibold">{formatMoney(shippingOrder.total_amount)}</span>
                </div>
                {shippingOrder.fulfillment_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Тип доставки:</span>
                    <span className="font-medium">{shippingOrder.fulfillment_type}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="tracking">Трек-номер отправления</Label>
                <Input
                  id="tracking"
                  placeholder="Например: 1234567890"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Укажите трек-номер, полученный от службы доставки. 
                  Статус заказа автоматически изменится на "Отправлен".
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1" 
                  onClick={handleShipOrder}
                  disabled={shipping || !trackingNumber}
                >
                  {shipping ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Truck" className="mr-2 h-4 w-4" />
                      Подтвердить отправку
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShippingDialogOpen(false);
                    setTrackingNumber('');
                  }}
                  disabled={shipping}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPanel;