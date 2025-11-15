import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  marketplaces_count?: number;
  total_stock?: number;
}

const ProductsPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarketplace, setFilterMarketplace] = useState('all');

  useEffect(() => {
    loadProducts();
  }, [filterMarketplace]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const url = filterMarketplace === 'all' 
        ? `${CRM_API}/?action=getProducts`
        : `${CRM_API}/?action=getProducts&marketplace=${filterMarketplace}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить товары',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="text-2xl font-bold">Товары</h2>
          <p className="text-muted-foreground mt-1">
            Управление каталогом товаров
          </p>
        </div>
        <Button>
          <Icon name="Plus" className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Поиск по названию или SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Маркетплейс" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все маркетплейсы</SelectItem>
            <SelectItem value="wildberries">Wildberries</SelectItem>
            <SelectItem value="ozon">Ozon</SelectItem>
            <SelectItem value="yandex_market">Яндекс Маркет</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Icon name="Package" className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Товаров не найдено</p>
            <p className="text-sm mt-2">Добавьте товары или измените фильтры</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Icon name="MoreVertical" className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Цена</span>
                  <span className="font-semibold">{formatMoney(product.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Остаток</span>
                  <span className={`font-semibold ${(product.total_stock || product.stock) < 10 ? 'text-red-500' : ''}`}>
                    {product.total_stock || product.stock} шт
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Категория</span>
                  <span className="text-sm">{product.category || 'Без категории'}</span>
                </div>
                {product.marketplaces_count !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Маркетплейсы</span>
                    <span className="text-sm">{product.marketplaces_count}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Icon name="Edit" className="mr-2 h-3 w-3" />
                  Редактировать
                </Button>
                <Button variant="outline" size="sm">
                  <Icon name="Copy" className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Показано {filteredProducts.length} из {products.length} товаров</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Icon name="ChevronLeft" className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductsPanel;
