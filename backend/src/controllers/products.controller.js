import prisma from '../config/database.js';
import { checkAndSendLowStockAlert } from '../services/email.service.js';

export const listProducts = async (req, res, next) => {
  try {
    const { categoryId, search, inStock, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = { isActive: true };

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (inStock === 'true') where.stockQty = { gt: 0 };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }, { sku: id }] },
      include: { category: true },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name, slug, sku, description, categoryId,
      price, costPrice, bulkPrice, bulkMinQty,
      stockQty, lowStockThreshold, unit, specifications, images,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        sku,
        description,
        categoryId,
        price,
        costPrice,
        bulkPrice,
        bulkMinQty,
        stockQty: stockQty || 0,
        lowStockThreshold: lowStockThreshold || 10,
        unit: unit || 'unit',
        specifications,
        images: images || [],
      },
      include: { category: true },
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (req, res, next) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."isActive" = true AND p."stockQty" <= p."lowStockThreshold"
      ORDER BY p."stockQty" ASC
    `;
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body; // type: 'set', 'add', 'subtract'

    let data;
    if (type === 'set') data = { stockQty: quantity };
    else if (type === 'add') data = { stockQty: { increment: quantity } };
    else if (type === 'subtract') data = { stockQty: { decrement: quantity } };

    const product = await prisma.product.update({
      where: { id },
      data,
      select: { id: true, name: true, sku: true, stockQty: true },
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Export all products as CSV
export const exportProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    const headers = ['sku', 'name', 'description', 'price', 'costPrice', 'stockQty', 'lowStockThreshold', 'category', 'unit'];
    const rows = products.map(p => [
      p.sku || '',
      (p.name || '').replace(/,/g, ';'),
      (p.description || '').replace(/,/g, ';').replace(/\n/g, ' '),
      p.price || 0,
      p.costPrice || 0,
      p.stockQty || 0,
      p.lowStockThreshold || 10,
      p.category?.name || '',
      p.unit || 'piece',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Bulk import products from CSV
export const bulkImportProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return res.status(400).json({ error: 'File is empty or has no data rows' });
    }

    // Parse header
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const skuIndex = headers.indexOf('sku');
    const nameIndex = headers.indexOf('name');
    const descIndex = headers.indexOf('description');
    const priceIndex = headers.indexOf('price');
    const costPriceIndex = headers.indexOf('costprice');
    const stockIndex = headers.indexOf('stockqty');
    const thresholdIndex = headers.indexOf('lowstockthreshold');
    const categoryIndex = headers.indexOf('category');
    const unitIndex = headers.indexOf('unit');

    if (skuIndex === -1) {
      return res.status(400).json({ error: 'SKU column is required' });
    }

    // Get all categories for lookup
    const categories = await prisma.category.findMany();
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.name.toLowerCase()] = c.id;
    });

    let created = 0;
    let updated = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const sku = values[skuIndex];

        if (!sku) {
          errors.push(`Row ${i + 1}: SKU is required`);
          continue;
        }

        const name = nameIndex !== -1 ? values[nameIndex] : null;
        const description = descIndex !== -1 ? values[descIndex] : null;
        const price = priceIndex !== -1 ? parseFloat(values[priceIndex]) || 0 : 0;
        const costPrice = costPriceIndex !== -1 ? parseFloat(values[costPriceIndex]) || 0 : 0;
        const stockQty = stockIndex !== -1 ? parseInt(values[stockIndex]) || 0 : 0;
        const lowStockThreshold = thresholdIndex !== -1 ? parseInt(values[thresholdIndex]) || 10 : 10;
        const categoryName = categoryIndex !== -1 ? values[categoryIndex] : null;
        const unit = unitIndex !== -1 ? values[unitIndex] || 'piece' : 'piece';

        // Look up category
        let categoryId = null;
        if (categoryName && categoryMap[categoryName.toLowerCase()]) {
          categoryId = categoryMap[categoryName.toLowerCase()];
        }

        // Check if product exists
        const existing = await prisma.product.findFirst({ where: { sku } });

        if (existing) {
          // Update existing product
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name: name || existing.name,
              description: description || existing.description,
              price: price || existing.price,
              costPrice: costPrice || existing.costPrice,
              stockQty: stockQty,
              lowStockThreshold: lowStockThreshold,
              categoryId: categoryId || existing.categoryId,
              unit: unit || existing.unit,
            },
          });
          updated++;
        } else {
          // Create new product
          if (!name) {
            errors.push(`Row ${i + 1}: Name is required for new product`);
            continue;
          }
          await prisma.product.create({
            data: {
              sku,
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              description: description || '',
              price,
              costPrice,
              stockQty,
              lowStockThreshold,
              categoryId,
              unit,
            },
          });
          created++;
        }
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      created,
      updated,
      errors: errors.slice(0, 20), // Limit errors returned
    });
  } catch (error) {
    next(error);
  }
};

// Trigger low stock email alert
export const sendLowStockAlert = async (req, res, next) => {
  try {
    const result = await checkAndSendLowStockAlert();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
