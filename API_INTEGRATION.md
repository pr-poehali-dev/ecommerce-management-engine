# API Интеграции SellHub

## 🔌 Marketplace Sync API

**URL:** `https://functions.poehali.dev/fd20e79f-008e-45c3-b1f3-525acbe9e95b`

### Подключение маркетплейса

```bash
POST /?marketplace=ozon&action=connect
Content-Type: application/json

{
  "apiKey": "your-api-key",
  "clientId": "your-client-id"
}
```

**Response:**
```json
{
  "success": true,
  "marketplace": "ozon",
  "connected": true,
  "message": "Ozon подключен успешно",
  "stats": {
    "products": 0,
    "orders": 0,
    "revenue": 0
  }
}
```

### Получение товаров с маркетплейса

```bash
GET /?marketplace=ozon&action=getProducts
```

**Response:**
```json
{
  "products": [
    {
      "id": "ozon_1",
      "name": "Наушники беспроводные TWS",
      "price": 3490,
      "stock": 45,
      "category": "Электроника",
      "marketplace": "Ozon",
      "sku": "TWS-001",
      "status": "active"
    }
  ],
  "total": 3,
  "synced_at": "2025-11-15T11:10:51.545160"
}
```

### Получение заказов с маркетплейса

```bash
GET /?marketplace=ozon&action=getOrders
```

**Response:**
```json
{
  "orders": [
    {
      "id": "ozon_order_1",
      "customerName": "Иван Петров",
      "marketplace": "Ozon",
      "date": "2025-11-14",
      "status": "processing",
      "items": 2,
      "total": 12480,
      "products": ["TWS-001", "SW-PRO-01"]
    }
  ],
  "total": 2,
  "synced_at": "2025-11-15T11:10:51.545160"
}
```

### Синхронизация товаров на маркетплейс

```bash
POST /?marketplace=ozon&action=syncProducts
Content-Type: application/json

{
  "products": [
    {
      "name": "Товар 1",
      "price": 1000,
      "stock": 50
    }
  ]
}
```

### Обновление остатков

```bash
POST /?marketplace=ozon&action=updateStock
Content-Type: application/json

{
  "productId": "ozon_1",
  "stock": 100
}
```

---

## 🏪 WebStore API

**URL:** `https://functions.poehali.dev/a088ac42-044b-465b-9291-e546fa248863`

### Получение настроек магазина

```bash
GET /?action=getSettings
```

**Response:**
```json
{
  "storeId": "store_12345",
  "storeName": "Мой интернет-магазин",
  "domain": "mystore.sellhub.app",
  "customDomain": "",
  "status": "published",
  "theme": "modern",
  "colors": {
    "primary": "#8b5cf6",
    "secondary": "#3b82f6",
    "accent": "#06b6d4"
  },
  "contact": {
    "email": "info@mystore.com",
    "phone": "+7 (999) 123-45-67",
    "address": "Москва, ул. Примерная, д. 1"
  },
  "seo": {
    "title": "Мой интернет-магазин",
    "description": "Лучшие товары по выгодным ценам",
    "keywords": "магазин, товары, покупки"
  }
}
```

### Создание магазина

```bash
POST /?action=createStore
Content-Type: application/json

{
  "storeName": "Новый магазин",
  "theme": "modern"
}
```

### Обновление настроек

```bash
PUT /?action=updateSettings
Content-Type: application/json

{
  "storeName": "Обновленное название",
  "colors": {
    "primary": "#ff0000"
  }
}
```

### Получение доступных тем

```bash
GET /?action=getThemes
```

**Response:**
```json
{
  "themes": [
    {
      "id": "modern",
      "name": "Современный",
      "description": "Минималистичный дизайн с акцентом на товары",
      "preview": "/themes/modern-preview.jpg",
      "features": ["Адаптивный дизайн", "Быстрая загрузка", "SEO оптимизация"]
    }
  ]
}
```

### Публикация магазина

```bash
POST /?action=publishStore
Content-Type: application/json

{
  "storeId": "store_12345"
}
```

**Response:**
```json
{
  "success": true,
  "storeId": "store_12345",
  "status": "published",
  "url": "https://mystore.sellhub.app",
  "message": "Магазин опубликован",
  "publishedAt": "2025-11-15T11:10:50.955272"
}
```

### Аналитика магазина

```bash
GET /?action=getAnalytics
```

**Response:**
```json
{
  "visitors": {
    "today": 342,
    "week": 2145,
    "month": 8934
  },
  "orders": {
    "today": 23,
    "week": 156,
    "month": 623
  },
  "revenue": {
    "today": 45670,
    "week": 312450,
    "month": 1245890
  },
  "conversion": {
    "rate": 6.7,
    "trend": "up"
  }
}
```

---

## 🌐 Поддерживаемые маркетплейсы

| Маркетплейс | ID | Статус | Особенности |
|------------|-------|--------|------------|
| Ozon | `ozon` | ✅ Активен | Требуется API Key + Client ID |
| Wildberries | `wildberries` | ✅ Активен | Требуется только API Key |
| Amazon | `amazon` | 🔄 В разработке | Требуется API Key + Client ID |
| AliExpress | `aliexpress` | 🔄 В разработке | - |
| eBay | `ebay` | 🔄 В разработке | - |
| Яндекс.Маркет | `yandex` | 🔄 В разработке | - |

---

## 🔐 Аутентификация

Для работы с API маркетплейсов необходимо:

1. **Ozon:**
   - API Key (получить в личном кабинете Ozon Seller)
   - Client ID (получить в личном кабинете Ozon Seller)

2. **Wildberries:**
   - API Key (получить в личном кабинете WB)

---

## 📝 Примеры использования

### React / TypeScript

```typescript
const connectOzon = async () => {
  const response = await fetch(
    'https://functions.poehali.dev/fd20e79f-008e-45c3-b1f3-525acbe9e95b?marketplace=ozon&action=connect',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: 'your-api-key',
        clientId: 'your-client-id'
      })
    }
  );
  
  const data = await response.json();
  console.log(data);
};

const getProducts = async () => {
  const response = await fetch(
    'https://functions.poehali.dev/fd20e79f-008e-45c3-b1f3-525acbe9e95b?marketplace=ozon&action=getProducts'
  );
  
  const data = await response.json();
  console.log(data.products);
};
```

---

## ⚠️ Важные замечания

1. Все API endpoints поддерживают CORS
2. Backend функции развернуты как Cloud Functions
3. Для production использования рекомендуется хранить API ключи в переменных окружения
4. Rate limiting: 100 запросов в минуту на функцию
5. Timeout: 30 секунд на запрос

---

## 🚀 Roadmap

- [ ] Интеграция с реальными API Ozon и Wildberries
- [ ] Добавление webhook'ов для автоматической синхронизации
- [ ] Поддержка массовых операций
- [ ] Интеграция с Amazon и eBay
- [ ] Аналитика и отчеты по маркетплейсам
