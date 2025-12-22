import prisma from '../config/database.js';

export const listCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        products: { where: { isActive: true }, orderBy: { name: 'asc' } },
        _count: { select: { products: true } },
      },
    });

    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, icon, image, sortOrder } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        icon,
        image,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const category = await prisma.category.update({ where: { id }, data });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return res.status(400).json({ error: `Cannot delete: ${count} products in this category` });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
