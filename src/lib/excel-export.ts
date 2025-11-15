import * as XLSX from 'xlsx';

export interface ExportData {
  sheetName: string;
  data: any[];
  columns?: string[];
}

export const exportToExcel = (sheets: ExportData[], filename: string = 'report.xlsx') => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data, columns }) => {
    let worksheet;
    
    if (columns && columns.length > 0) {
      const formattedData = data.map(row => {
        const formattedRow: any = {};
        columns.forEach(col => {
          formattedRow[col] = row[col] !== undefined ? row[col] : '';
        });
        return formattedRow;
      });
      worksheet = XLSX.utils.json_to_sheet(formattedData);
    } else {
      worksheet = XLSX.utils.json_to_sheet(data);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, filename);
};

export const exportProductsToExcel = (products: any[]) => {
  const formattedData = products.map(p => ({
    'ID': p.id,
    'Название': p.name,
    'Описание': p.description || '',
    'Категория': p.category,
    'Цена (₽)': p.price,
    'Остаток': p.stock,
  }));

  exportToExcel([{ sheetName: 'Товары', data: formattedData }], 'products_export.xlsx');
};

export const exportOrdersToExcel = (orders: any[]) => {
  const formattedData = orders.map(o => ({
    'Номер заказа': o.id,
    'Клиент': o.customerName || '',
    'Email': o.customerEmail || '',
    'Маркетплейс': o.marketplace || 'Прямой',
    'Дата': o.date,
    'Статус': o.status === 'delivered' ? 'Доставлен' : o.status === 'processing' ? 'В обработке' : 'Отправлен',
    'Товаров': o.items,
    'Сумма (₽)': o.total,
  }));

  exportToExcel([{ sheetName: 'Заказы', data: formattedData }], 'orders_export.xlsx');
};

export const exportCustomersToExcel = (customers: any[]) => {
  const formattedData = customers.map(c => ({
    'ID': c.id,
    'Имя': c.name,
    'Email': c.email || '',
    'Телефон': c.phone || '',
    'Статус': c.status === 'premium' ? 'Премиум' : 'Активный',
    'Всего заказов': c.totalOrders,
    'Всего потрачено (₽)': c.totalSpent,
    'Дата регистрации': c.joinedDate,
  }));

  exportToExcel([{ sheetName: 'Клиенты', data: formattedData }], 'customers_export.xlsx');
};

export const exportFullReport = (products: any[], orders: any[], customers: any[], analytics: any) => {
  const sheets: ExportData[] = [
    {
      sheetName: 'Сводка',
      data: [
        { 'Показатель': 'Выручка (₽)', 'Значение': analytics.revenue },
        { 'Показатель': 'Заказов', 'Значение': analytics.orders },
        { 'Показатель': 'Товаров', 'Значение': analytics.products },
        { 'Показатель': 'Клиентов', 'Значение': analytics.customers },
      ]
    },
    {
      sheetName: 'Товары',
      data: products.map(p => ({
        'ID': p.id,
        'Название': p.name,
        'Категория': p.category,
        'Цена (₽)': p.price,
        'Остаток': p.stock,
      }))
    },
    {
      sheetName: 'Заказы',
      data: orders.map(o => ({
        'Номер': o.id,
        'Клиент': o.customerName || '',
        'Дата': o.date,
        'Статус': o.status,
        'Сумма (₽)': o.total,
      }))
    },
    {
      sheetName: 'Клиенты',
      data: customers.map(c => ({
        'Имя': c.name,
        'Email': c.email || '',
        'Заказов': c.totalOrders,
        'Потрачено (₽)': c.totalSpent,
      }))
    }
  ];

  const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
  exportToExcel(sheets, `full_report_${date}.xlsx`);
};
