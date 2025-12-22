import prisma from '../config/database.js';

export const listCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { _count: { select: { orders: true, quotes: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        quotes: { take: 10, orderBy: { createdAt: 'desc' } },
        invoices: { take: 10, orderBy: { createdAt: 'desc' } },
        notes: { take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } },
        followUps: { where: { isCompleted: false }, orderBy: { dueDate: 'asc' } },
        _count: { select: { orders: true, quotes: true, invoices: true } },
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const {
      email, phone, firstName, lastName, company, vatNumber,
      addressLine1, addressLine2, city, province, postalCode, country,
      tags, source, creditLimit, paymentTerms,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        email,
        phone,
        firstName,
        lastName,
        company,
        vatNumber,
        addressLine1,
        addressLine2,
        city,
        province,
        postalCode,
        country: country || 'South Africa',
        tags: tags || [],
        source,
        creditLimit,
        paymentTerms: paymentTerms || 0,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const customer = await prisma.customer.update({ where: { id }, data });
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({ where: { id } });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, company: true, email: true, phone: true },
      take: 10,
    });

    res.json(customers);
  } catch (error) {
    next(error);
  }
};

export const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, isPinned } = req.body;

    const note = await prisma.note.create({
      data: {
        customerId: id,
        userId: req.user.id,
        content,
        isPinned: isPinned || false,
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const addFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, dueDate, notes } = req.body;

    const followUp = await prisma.followUp.create({
      data: {
        customerId: id,
        type,
        dueDate: new Date(dueDate),
        notes,
      },
    });

    res.status(201).json(followUp);
  } catch (error) {
    next(error);
  }
};
