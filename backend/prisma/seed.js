import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@2026!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@batlokoainnovpro.co.za' },
    update: { password: adminPassword },
    create: {
      email: 'admin@batlokoainnovpro.co.za',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin user created:', admin.email);

  // Create staff user
  const staffPassword = await bcrypt.hash('Staff@123!', 12);

  const staff = await prisma.user.upsert({
    where: { email: 'staff@batlokoa.co.za' },
    update: {},
    create: {
      email: 'staff@batlokoa.co.za',
      password: staffPassword,
      firstName: 'Staff',
      lastName: 'User',
      role: 'STAFF',
      isActive: true,
    },
  });
  console.log('Staff user created:', staff.email);

  // Create categories
  const categories = [
    {
      name: 'Fasteners',
      slug: 'fasteners',
      description: 'Bolts, nuts, screws, washers and other fastening hardware',
      sortOrder: 1,
    },
    {
      name: 'Bearings',
      slug: 'bearings',
      description: 'Ball bearings, roller bearings, and bearing accessories',
      sortOrder: 2,
    },
    {
      name: 'Power Transmission',
      slug: 'power-transmission',
      description: 'Belts, chains, pulleys, sprockets and couplings',
      sortOrder: 3,
    },
    {
      name: 'Hydraulics',
      slug: 'hydraulics',
      description: 'Hydraulic cylinders, pumps, valves and fittings',
      sortOrder: 4,
    },
    {
      name: 'Pneumatics',
      slug: 'pneumatics',
      description: 'Air cylinders, valves, fittings and tubing',
      sortOrder: 5,
    },
    {
      name: 'Tools',
      slug: 'tools',
      description: 'Hand tools, power tools, and measuring instruments',
      sortOrder: 6,
    },
    {
      name: 'Safety Equipment',
      slug: 'safety-equipment',
      description: 'PPE, safety barriers, and industrial safety products',
      sortOrder: 7,
    },
    {
      name: 'Electrical',
      slug: 'electrical',
      description: 'Motors, switches, cables and electrical components',
      sortOrder: 8,
    },
  ];

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log('Category created:', created.name);
  }

  // Create sample products
  const fasteners = await prisma.category.findUnique({ where: { slug: 'fasteners' } });
  const bearings = await prisma.category.findUnique({ where: { slug: 'bearings' } });
  const tools = await prisma.category.findUnique({ where: { slug: 'tools' } });

  const products = [
    {
      name: 'Hex Bolt M10 x 50mm Grade 8.8',
      slug: 'hex-bolt-m10x50-grade88',
      sku: 'FB-HB-M10-50-88',
      description: 'High tensile hex bolt, zinc plated. Grade 8.8 for heavy-duty applications.',
      price: 5.95,
      costPrice: 2.50,
      categoryId: fasteners?.id,
      stockQty: 500,
      lowStockThreshold: 100,
      unit: 'piece',
    },
    {
      name: 'Hex Nut M10 Grade 8',
      slug: 'hex-nut-m10-grade8',
      sku: 'FB-HN-M10-8',
      description: 'High tensile hex nut, zinc plated. Grade 8 for heavy-duty applications.',
      price: 1.95,
      costPrice: 0.80,
      categoryId: fasteners?.id,
      stockQty: 1000,
      lowStockThreshold: 200,
      unit: 'piece',
    },
    {
      name: '6205-2RS Deep Groove Ball Bearing',
      slug: '6205-2rs-bearing',
      sku: 'BR-6205-2RS',
      description: 'Double sealed deep groove ball bearing. 25mm bore, 52mm OD, 15mm width.',
      price: 89.95,
      costPrice: 35.00,
      categoryId: bearings?.id,
      stockQty: 50,
      lowStockThreshold: 10,
      unit: 'piece',
    },
    {
      name: '6206-2RS Deep Groove Ball Bearing',
      slug: '6206-2rs-bearing',
      sku: 'BR-6206-2RS',
      description: 'Double sealed deep groove ball bearing. 30mm bore, 62mm OD, 16mm width.',
      price: 105.95,
      costPrice: 42.00,
      categoryId: bearings?.id,
      stockQty: 40,
      lowStockThreshold: 10,
      unit: 'piece',
    },
    {
      name: 'Digital Vernier Caliper 150mm',
      slug: 'digital-vernier-caliper-150mm',
      sku: 'TL-DVC-150',
      description: 'Stainless steel digital caliper with LCD display. 0-150mm range, 0.01mm resolution.',
      price: 395.00,
      costPrice: 180.00,
      categoryId: tools?.id,
      stockQty: 25,
      lowStockThreshold: 5,
      unit: 'piece',
    },
  ];

  for (const product of products) {
    if (product.categoryId) {
      const created = await prisma.product.upsert({
        where: { slug: product.slug },
        update: product,
        create: product,
      });
      console.log('Product created:', created.name);
    }
  }

  // Create sample customer
  const customer = await prisma.customer.upsert({
    where: { email: 'demo@engineering.co.za' },
    update: {},
    create: {
      email: 'demo@engineering.co.za',
      phone: '011 123 4567',
      firstName: 'John',
      lastName: 'Smith',
      company: 'Demo Engineering (Pty) Ltd',
      vatNumber: '4123456789',
      addressLine1: '123 Industrial Road',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      country: 'South Africa',
      source: 'Referral',
      paymentTerms: 30,
      creditLimit: 50000,
    },
  });
  console.log('Customer created:', customer.company || `${customer.firstName} ${customer.lastName}`);

  console.log('\\nSeeding completed!');
  console.log('\\n--- Login Credentials ---');
  console.log('Admin: admin@batlokoainnovpro.co.za / Admin@2026!');
  console.log('Staff: staff@batlokoa.co.za / Staff@123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
