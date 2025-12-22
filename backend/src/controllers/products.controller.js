import prisma from '../config/database.js';

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
