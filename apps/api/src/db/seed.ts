import { db, poolConnection } from './index';
import { expertiseTags, industries, industryAdjacency, users } from './schema';
import bcrypt from 'bcrypt';

const initialIndustries = [
  { name: 'Teknologi Informasi (IT)', slug: 'it-software' },
  { name: 'Pendidikan & EdTech', slug: 'education-edtech' },
  { name: 'Pemasaran & Sales', slug: 'marketing-sales' },
  { name: 'E-Commerce & Retail', slug: 'ecommerce-retail' },
  { name: 'Kreatif & Desain', slug: 'creative-design' },
  { name: 'Keuangan & Akuntansi', slug: 'finance-accounting' },
  { name: 'Konsultasi Bisnis', slug: 'business-consulting' },
  { name: 'Kesehatan & HealthTech', slug: 'health-healthtech' },
  { name: 'Hukum & Legal', slug: 'legal-law' },
  { name: 'Logistik & Rantai Pasok', slug: 'logistics-supply-chain' },
  { name: 'HR & Rekrutmen', slug: 'hr-recruitment' },
  { name: 'Media & Jurnalisme', slug: 'media-journalism' },
  { name: 'Properti & Real Estate', slug: 'property-realestate' },
  { name: 'Travel & Pariwisata', slug: 'travel-tourism' },
  { name: 'Agritech & Pertanian', slug: 'agritech-agriculture' },
];

const initialTags = [
  // IT & Software
  { name: 'Web Development', slug: 'web-development', category: 'Teknologi Informasi (IT)' },
  { name: 'Mobile App Development', slug: 'mobile-app-development', category: 'Teknologi Informasi (IT)' },
  { name: 'Cloud Infrastructure (AWS/GCP)', slug: 'cloud-infrastructure', category: 'Teknologi Informasi (IT)' },
  { name: 'Cybersecurity', slug: 'cybersecurity', category: 'Teknologi Informasi (IT)' },
  { name: 'DevOps & CI/CD', slug: 'devops', category: 'Teknologi Informasi (IT)' },
  { name: 'Data Engineering', slug: 'data-engineering', category: 'Teknologi Informasi (IT)' },
  { name: 'AI & Machine Learning', slug: 'ai-ml', category: 'Teknologi Informasi (IT)' },
  { name: 'Backend Development', slug: 'backend-development', category: 'Teknologi Informasi (IT)' },
  { name: 'Frontend Development', slug: 'frontend-development', category: 'Teknologi Informasi (IT)' },
  { name: 'Database Administration', slug: 'database-admin', category: 'Teknologi Informasi (IT)' },

  // Creative & Design
  { name: 'UI/UX Design', slug: 'ui-ux-design', category: 'Kreatif & Desain' },
  { name: 'Graphic Design', slug: 'graphic-design', category: 'Kreatif & Desain' },
  { name: 'Video Production & Editing', slug: 'video-production', category: 'Kreatif & Desain' },
  { name: 'Brand Identity', slug: 'brand-identity', category: 'Kreatif & Desain' },
  { name: 'Copywriting', slug: 'copywriting', category: 'Kreatif & Desain' },
  { name: 'Motion Graphics', slug: 'motion-graphics', category: 'Kreatif & Desain' },
  { name: 'Photography', slug: 'photography', category: 'Kreatif & Desain' },
  { name: 'Ilustrasi Digital', slug: 'digital-illustration', category: 'Kreatif & Desain' },

  // Marketing & Sales
  { name: 'SEO Optimization', slug: 'seo', category: 'Pemasaran & Sales' },
  { name: 'Digital Advertising (Meta/Google Ads)', slug: 'digital-ads', category: 'Pemasaran & Sales' },
  { name: 'Social Media Management', slug: 'social-media-management', category: 'Pemasaran & Sales' },
  { name: 'Content Marketing', slug: 'content-marketing', category: 'Pemasaran & Sales' },
  { name: 'Lead Generation', slug: 'lead-generation', category: 'Pemasaran & Sales' },
  { name: 'Growth Hacking', slug: 'growth-hacking', category: 'Pemasaran & Sales' },
  { name: 'Public Relations (PR)', slug: 'pr', category: 'Pemasaran & Sales' },
  { name: 'Email Marketing', slug: 'email-marketing', category: 'Pemasaran & Sales' },
  { name: 'Influencer Marketing', slug: 'influencer-marketing', category: 'Pemasaran & Sales' },

  // Finance & Accounting
  { name: 'Financial Planning', slug: 'financial-planning', category: 'Keuangan & Akuntansi' },
  { name: 'Tax Consulting', slug: 'tax-consulting', category: 'Keuangan & Akuntansi' },
  { name: 'Bookkeeping & Accounting', slug: 'bookkeeping', category: 'Keuangan & Akuntansi' },
  { name: 'Fundraising & VC Advisory', slug: 'fundraising-vc', category: 'Keuangan & Akuntansi' },
  { name: 'Corporate Valuation', slug: 'valuation', category: 'Keuangan & Akuntansi' },
  { name: 'Financial Modelling', slug: 'financial-modelling', category: 'Keuangan & Akuntansi' },

  // Business Consulting
  { name: 'Business Strategy', slug: 'business-strategy', category: 'Konsultasi Bisnis' },
  { name: 'Operations Management', slug: 'operations', category: 'Konsultasi Bisnis' },
  { name: 'Market Research', slug: 'market-research', category: 'Konsultasi Bisnis' },
  { name: 'Product Management', slug: 'product-management', category: 'Konsultasi Bisnis' },
  { name: 'Agile & Scrum Coaching', slug: 'agile-scrum', category: 'Konsultasi Bisnis' },
  { name: 'Business Development', slug: 'business-development', category: 'Konsultasi Bisnis' },
  { name: 'Partnership & Alliances', slug: 'partnerships', category: 'Konsultasi Bisnis' },

  // Legal
  { name: 'Legal Drafting & Contracts', slug: 'legal-drafting', category: 'Hukum & Legal' },
  { name: 'Intellectual Property (IP)', slug: 'intellectual-property', category: 'Hukum & Legal' },
  { name: 'Corporate Compliance', slug: 'compliance', category: 'Hukum & Legal' },
  { name: 'Startup Legal Setup', slug: 'startup-legal', category: 'Hukum & Legal' },

  // HR & Recruitment
  { name: 'Talent Acquisition', slug: 'talent-acquisition', category: 'HR & Rekrutmen' },
  { name: 'HR Strategy & Organizational Design', slug: 'hr-strategy', category: 'HR & Rekrutmen' },
  { name: 'Training & Development', slug: 'training-development', category: 'HR & Rekrutmen' },

  // Logistics & Supply Chain
  { name: 'Supply Chain Management', slug: 'supply-chain', category: 'Logistik & Rantai Pasok' },
  { name: 'Procurement & Vendor Management', slug: 'procurement', category: 'Logistik & Rantai Pasok' },
  { name: 'Warehouse & Fulfillment', slug: 'warehouse-fulfillment', category: 'Logistik & Rantai Pasok' },

  // EdTech
  { name: 'Curriculum Design', slug: 'curriculum-design', category: 'Pendidikan & EdTech' },
  { name: 'E-Learning Development', slug: 'elearning', category: 'Pendidikan & EdTech' },
  { name: 'Coaching & Mentoring', slug: 'coaching-mentoring', category: 'Pendidikan & EdTech' },

  // Health
  { name: 'Health Data & Analytics', slug: 'health-data', category: 'Kesehatan & HealthTech' },
  { name: 'Telemedicine & Digital Health', slug: 'telemedicine', category: 'Kesehatan & HealthTech' },
];

// All adjacency pairs (bidirectional is handled in the loop below)
const adjacencyPairs = [
  // IT adjacencies
  { aSlug: 'it-software', bSlug: 'education-edtech', weight: 4 },
  { aSlug: 'it-software', bSlug: 'ecommerce-retail', weight: 4 },
  { aSlug: 'it-software', bSlug: 'health-healthtech', weight: 5 },
  { aSlug: 'it-software', bSlug: 'logistics-supply-chain', weight: 3 },
  { aSlug: 'it-software', bSlug: 'hr-recruitment', weight: 3 },
  { aSlug: 'it-software', bSlug: 'finance-accounting', weight: 3 },
  { aSlug: 'it-software', bSlug: 'agritech-agriculture', weight: 3 },

  // Marketing adjacencies
  { aSlug: 'marketing-sales', bSlug: 'ecommerce-retail', weight: 5 },
  { aSlug: 'marketing-sales', bSlug: 'business-consulting', weight: 4 },
  { aSlug: 'marketing-sales', bSlug: 'media-journalism', weight: 5 },
  { aSlug: 'marketing-sales', bSlug: 'creative-design', weight: 4 },
  { aSlug: 'marketing-sales', bSlug: 'travel-tourism', weight: 3 },

  // Finance adjacencies
  { aSlug: 'finance-accounting', bSlug: 'business-consulting', weight: 4 },
  { aSlug: 'finance-accounting', bSlug: 'legal-law', weight: 3 },
  { aSlug: 'finance-accounting', bSlug: 'property-realestate', weight: 3 },

  // Creative adjacencies
  { aSlug: 'creative-design', bSlug: 'it-software', weight: 4 },
  { aSlug: 'creative-design', bSlug: 'marketing-sales', weight: 5 },
  { aSlug: 'creative-design', bSlug: 'media-journalism', weight: 4 },
  { aSlug: 'creative-design', bSlug: 'education-edtech', weight: 3 },

  // Business Consulting adjacencies
  { aSlug: 'business-consulting', bSlug: 'hr-recruitment', weight: 3 },
  { aSlug: 'business-consulting', bSlug: 'legal-law', weight: 3 },
  { aSlug: 'business-consulting', bSlug: 'ecommerce-retail', weight: 3 },

  // EdTech adjacencies
  { aSlug: 'education-edtech', bSlug: 'hr-recruitment', weight: 3 },
  { aSlug: 'education-edtech', bSlug: 'health-healthtech', weight: 2 },

  // Logistics adjacencies
  { aSlug: 'logistics-supply-chain', bSlug: 'ecommerce-retail', weight: 5 },
  { aSlug: 'logistics-supply-chain', bSlug: 'agritech-agriculture', weight: 3 },

  // Media adjacencies
  { aSlug: 'media-journalism', bSlug: 'education-edtech', weight: 3 },
  { aSlug: 'media-journalism', bSlug: 'travel-tourism', weight: 3 },

  // Property adjacencies
  { aSlug: 'property-realestate', bSlug: 'business-consulting', weight: 2 },
  { aSlug: 'property-realestate', bSlug: 'legal-law', weight: 3 },

  // Agritech adjacencies
  { aSlug: 'agritech-agriculture', bSlug: 'logistics-supply-chain', weight: 3 },
  { aSlug: 'agritech-agriculture', bSlug: 'health-healthtech', weight: 2 },
];

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Industries
    console.log('📍 Inserting industries...');
    for (const ind of initialIndustries) {
      await db.insert(industries).values(ind).onDuplicateKeyUpdate({ set: { name: ind.name } });
    }
    console.log(`   ✅ ${initialIndustries.length} industries seeded`);

    // 2. Seed Expertise Tags
    console.log('🏷️  Inserting expertise tags...');
    for (const tag of initialTags) {
      await db.insert(expertiseTags).values(tag).onDuplicateKeyUpdate({ set: { name: tag.name, category: tag.category } });
    }
    console.log(`   ✅ ${initialTags.length} expertise tags seeded`);

    // 3. Fetch all inserted industries to resolve slugs → ids
    const dbInds = await db.select().from(industries);
    const indMap = new Map(dbInds.map(i => [i.slug, i.id]));

    const getIndId = (slug: string) => {
      const id = indMap.get(slug);
      if (!id) throw new Error(`Industry slug "${slug}" not found in seeded list`);
      return id;
    };

    // 4. Seed Industry Adjacency (bidirectional)
    console.log('🔗 Inserting industry adjacency weights...');
    for (const adj of adjacencyPairs) {
      const idA = getIndId(adj.aSlug);
      const idB = getIndId(adj.bSlug);

      await db.insert(industryAdjacency).values({
        industryAId: idA, industryBId: idB, weight: adj.weight
      }).onDuplicateKeyUpdate({ set: { weight: adj.weight } });

      await db.insert(industryAdjacency).values({
        industryAId: idB, industryBId: idA, weight: adj.weight
      }).onDuplicateKeyUpdate({ set: { weight: adj.weight } });
    }
    console.log(`   ✅ ${adjacencyPairs.length * 2} adjacency pairs seeded`);

    // 5. Seed first admin user (only if no admin exists)
    const existingAdmins = await db.select().from(users).limit(1);
    if (existingAdmins.length === 0) {
      console.log('👤 Creating initial admin user...');
      const adminPasscode = 'ADMIN01';
      const passcodeHash = await bcrypt.hash(adminPasscode, 10);
      await db.insert(users).values({
        username: 'admin',
        email: 'admin@bizlink.id',
        passcodeHash,
        role: 'admin',
        fullName: 'Platform Admin',
        hasCompletedProfile: true,
        profileCompleteness: 100,
        accountStatus: 'active',
        isOpenToRemote: false
      });
      console.log('   ✅ Admin user created');
      console.log('   📋 Username: admin | Passcode: ADMIN01');
      console.log('   ⚠️  Change this passcode immediately after first login!');
    } else {
      console.log('   ⏭️  Admin user already exists, skipping');
    }

    console.log('\n✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await poolConnection.end();
  }
}

seed().catch((err) => {
  console.error('❌ Top level seeding error:', err);
  process.exit(1);
});
