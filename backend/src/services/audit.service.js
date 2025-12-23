import prisma from '../config/database.js';

// Action types
export const AuditActions = {
  // Orders
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  ORDER_DELETED: 'ORDER_DELETED',
  ORDER_DISPATCHED: 'ORDER_DISPATCHED',
  POP_UPLOADED: 'POP_UPLOADED',
  POP_APPROVED: 'POP_APPROVED',
  POP_REJECTED: 'POP_REJECTED',

  // Products
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  STOCK_ADJUSTED: 'STOCK_ADJUSTED',

  // Customers
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED',

  // Quotes
  QUOTE_CREATED: 'QUOTE_CREATED',
  QUOTE_UPDATED: 'QUOTE_UPDATED',
  QUOTE_SENT: 'QUOTE_SENT',
  QUOTE_CONVERTED: 'QUOTE_CONVERTED',
  QUOTE_DELETED: 'QUOTE_DELETED',

  // Invoices
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_SENT: 'INVOICE_SENT',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',

  // Auth
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  // Categories
  CATEGORY_CREATED: 'CATEGORY_CREATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  CATEGORY_DELETED: 'CATEGORY_DELETED',

  // Settings
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
};

// Log an audit event
export const logAudit = async ({
  userId,
  action,
  entityType,
  entityId,
  description,
  metadata = {},
  ipAddress,
}) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        userId,
        type: action,
        entityType,
        entityId,
        description,
        metadata: {
          ...metadata,
          ipAddress,
          timestamp: new Date().toISOString(),
        },
      },
    });
    return activity;
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging shouldn't break the main operation
    return null;
  }
};

// Get audit logs with filtering
export const getAuditLogs = async ({
  page = 1,
  limit = 50,
  userId,
  entityType,
  entityId,
  action,
  startDate,
  endDate,
  search,
}) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.type = action;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { type: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    logs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  };
};

// Get activity summary for dashboard
export const getActivitySummary = async (days = 7) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [byType, byUser, recent] = await Promise.all([
    prisma.activity.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: 10,
    }),
    prisma.activity.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since }, userId: { not: null } },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 5,
    }),
    prisma.activity.findMany({
      where: { createdAt: { gte: since } },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return { byType, byUser, recent };
};
