// ============================================================
//  Person B seed: passwords for existing users, admin, coordinator,
//  a sample club and event. Safe to run multiple times.
//  Run AFTER Person C's seed:  npm run db:seed  →  npm run db:seed:b
// ============================================================
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma'); // same shared client as seed.js

const PASSWORD = 'password123'; // every seeded account uses this (testing only)

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 1. Let Person C's seeded users (who have no password yet) log in
  const fixed = await prisma.user.updateMany({
    where: { passwordHash: null },
    data: { passwordHash },
  });
  console.log(`Gave a password to ${fixed.count} existing user(s)`);

  // 2. Admin and coordinator
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { role: 'ADMIN', passwordHash },
    create: { name: 'Admin User', email: 'admin@test.com', passwordHash, role: 'ADMIN', department: 'Administration' },
  });
  const coordinator = await prisma.user.upsert({
    where: { email: 'coord@test.com' },
    update: { role: 'COORDINATOR', passwordHash },
    create: {
      name: 'Coordinator One', email: 'coord@test.com', passwordHash,
      role: 'COORDINATOR', department: 'CSE', year: 3, skills: ['react', 'node.js'],
    },
  });

  // Profile details for Person C's sample students (only fills empty fields)
  const profiles = {
    'aarav@test.com': { department: 'CSE', year: 3, bio: 'Mobile dev, loves hackathons.' },
    'diya@test.com': { department: 'AI&DS', year: 4, bio: 'ML enthusiast.' },
    'rahul@test.com': { department: 'CSE', year: 3, bio: 'Backend developer.' },
    'sneha@test.com': { department: 'IT', year: 2, bio: 'UI/UX designer.' },
  };
  for (const [email, data] of Object.entries(profiles)) {
    await prisma.user.updateMany({ where: { email, department: null }, data });
  }

  // 3. A sample club run by the coordinator
  const club = await prisma.club.upsert({
    where: { name: 'Sample Coding Club' },
    update: {},
    create: {
      name: 'Sample Coding Club',
      description: 'Weekly coding sessions, hackathons and workshops',
      category: 'Technical',
      coordinatorId: coordinator.id,
    },
  });

  // Members: the coordinator plus Person C's sample students
  const students = await prisma.user.findMany({
    where: { email: { in: Object.keys(profiles) } },
    select: { id: true },
  });
  for (const userId of [coordinator.id, ...students.map((s) => s.id)]) {
    await prisma.clubMember.upsert({
      where: { clubId_userId: { clubId: club.id, userId } },
      update: {},
      create: { clubId: club.id, userId },
    });
  }

  // 4. A sample event, one week from now (created only once)
  const existingEvent = await prisma.event.findFirst({
    where: { clubId: club.id, title: 'Intro to Web Dev Workshop' },
  });
  if (!existingEvent) {
    await prisma.event.create({
      data: {
        clubId: club.id,
        createdById: coordinator.id,
        title: 'Intro to Web Dev Workshop',
        description: 'A beginner-friendly hands-on workshop on HTML, CSS and JavaScript.',
        venue: 'Seminar Hall',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        capacity: 50,
      },
    });
  }

  console.log('✅ Person B seed complete.');
  console.log(`Logins (password for all: ${PASSWORD}):`);
  console.log('  admin@test.com   (ADMIN)');
  console.log('  coord@test.com   (COORDINATOR)');
  console.log('  aarav@test.com, diya@test.com, rahul@test.com, sneha@test.com   (STUDENT)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());