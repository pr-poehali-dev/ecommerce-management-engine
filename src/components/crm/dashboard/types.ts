export interface DashboardStats {
  total_marketplaces: number;
  connected_marketplaces: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
}

export interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  status: string;
  total_amount: number;
  order_date: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  total_stock: number;
}

export const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

export const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-500',
    processing: 'bg-yellow-500/10 text-yellow-500',
    shipped: 'bg-purple-500/10 text-purple-500',
    delivered: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
    returned: 'bg-gray-500/10 text-gray-500'
  };
  return colors[status] || colors.new;
};

export const getStatusText = (status: string) => {
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
