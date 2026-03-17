import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user with password "admin123"
  const passwordHash = await hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketbrain.dev' },
    update: {},
    create: {
      email: 'admin@marketbrain.dev',
      name: 'Admin',
      role: 'admin',
      notificationPreferences: { passwordHash },
    },
  });
  console.log('Seeded admin user:', admin.email);

  // Seed organization
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'MarketBrain Dev',
      plan: 'pro',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      organizationId: org.id,
      role: 'admin',
    },
  });

  // Seed instruments
  const instruments = [
    { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', assetType: 'stock', sector: 'Technology', country: 'US' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', assetType: 'stock', sector: 'Technology', country: 'US' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', assetType: 'stock', sector: 'Technology', country: 'US' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', assetType: 'stock', sector: 'Consumer Cyclical', country: 'US' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', assetType: 'stock', sector: 'Technology', country: 'US' },
    { ticker: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', assetType: 'stock', sector: 'Consumer Cyclical', country: 'US' },
    { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'ARCA', assetType: 'etf', country: 'US' },
    { ticker: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', assetType: 'etf', country: 'US' },
  ];

  for (const inst of instruments) {
    await prisma.instrument.upsert({
      where: { ticker_exchange: { ticker: inst.ticker, exchange: inst.exchange } },
      update: {},
      create: inst,
    });
  }
  console.log(`Seeded ${instruments.length} instruments`);

  // Seed themes
  const themes = [
    { slug: 'ai-infrastructure', name: 'AI Infrastructure', description: 'Companies building AI compute, training, and inference infrastructure' },
    { slug: 'ev-battery', name: 'EV & Battery', description: 'Electric vehicle and battery technology supply chain' },
    { slug: 'fed-policy', name: 'Fed Policy', description: 'Federal Reserve monetary policy and interest rate decisions' },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { slug: theme.slug },
      update: {},
      create: theme,
    });
  }
  console.log(`Seeded ${themes.length} themes`);

  // Seed a watchlist for admin
  const watchlist = await prisma.watchlist.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      userId: admin.id,
      name: 'Tech Giants',
      description: 'Top technology companies',
    },
  });

  const topInstruments = await prisma.instrument.findMany({
    where: { ticker: { in: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'] } },
  });

  for (let i = 0; i < topInstruments.length; i++) {
    const inst = topInstruments[i]!;
    await prisma.watchlistItem.upsert({
      where: {
        watchlistId_instrumentId: {
          watchlistId: watchlist.id,
          instrumentId: inst.id,
        },
      },
      update: {},
      create: {
        watchlistId: watchlist.id,
        instrumentId: inst.id,
        rank: i + 1,
      },
    });
  }
  console.log('Seeded watchlist with instruments');

  // Seed a data source
  await prisma.source.upsert({
    where: { id: '00000000-0000-0000-0000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000020',
      type: 'rss',
      name: 'Example Financial News',
      baseUrl: 'https://example.com/feed',
      trustLevel: 70,
      enabled: true,
    },
  });
  console.log('Seeded data source');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
