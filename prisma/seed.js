// Fills the database with sample data for testing/demos:  npm run db:seed
// Safe to run more than once (it skips if sample posts already exist).
const prisma = require('../src/lib/prisma');
const teams = require('../src/modules/teams/teams.service');

const people = [
  { email: 'aarav@test.com', name: 'Aarav', skills: ['react native', 'node.js', 'ui design'] },
  { email: 'diya@test.com', name: 'Diya', skills: ['python', 'machine learning', 'data analysis'] },
  { email: 'rahul@test.com', name: 'Rahul', skills: ['node.js', 'postgresql', 'react'] },
  { email: 'sneha@test.com', name: 'Sneha', skills: ['figma', 'ui design', 'public speaking'] },
];

async function main() {
  const users = {};
  for (const p of people) {
    users[p.name] = await prisma.user.upsert({ where: { email: p.email }, create: p, update: {} });
  }

  if (await prisma.post.count()) {
    console.log('Sample data already exists — skipping. (Users are ready.)');
    return;
  }

  const { Aarav, Diya, Rahul, Sneha } = users;

  await prisma.post.createMany({
    data: [
      { authorId: Aarav.id, category: 'EVENTS', content: 'Hackathon registrations open this Friday! Who is in? 🚀' },
      { authorId: Diya.id, category: 'ACADEMIC', content: 'Sharing my DBMS unit 3 notes, ping me if you want them.' },
      { authorId: Rahul.id, category: 'OPPORTUNITIES', content: 'Summer internship applications at a Hyderabad startup close next week.' },
      { authorId: Sneha.id, category: 'QUESTIONS', isAnonymous: true, content: 'Is it normal to feel lost in third year? How do you pick a domain?' },
      { authorId: Diya.id, category: 'LOST_AND_FOUND', content: 'Found a blue water bottle in the library, 2nd floor.' },
    ],
  });

  await prisma.listing.createMany({
    data: [
      { sellerId: Rahul.id, title: 'Operating Systems – Galvin (9th ed.)', description: 'Few highlights, otherwise clean.', price: 350, category: 'BOOKS', condition: 'GOOD' },
      { sellerId: Sneha.id, title: 'Scientific calculator fx-991ES', description: 'Works perfectly, with cover.', price: 600, category: 'ELECTRONICS', condition: 'LIKE_NEW' },
      { sellerId: Aarav.id, title: 'Lab coat (size M)', description: 'Used for one semester.', price: 150, category: 'LAB_EQUIPMENT', condition: 'FAIR' },
    ],
  });

  // Created through the service so each team also gets its group chat.
  await teams.createTeam(Aarav.id, {
    title: 'Team for Smart India Hackathon',
    description: 'Building an app for campus waste tracking. Need backend + ML folks.',
    eventName: 'Smart India Hackathon 2026',
    skillsNeeded: ['node.js', 'machine learning', 'postgresql'],
    maxMembers: 4,
  });
  await teams.createTeam(Sneha.id, {
    title: 'Design sprint crew',
    description: 'UI/UX challenge next month, looking for one more designer and a dev.',
    eventName: 'GNITS Design Week',
    skillsNeeded: ['figma', 'react'],
    maxMembers: 3,
  });

  console.log('✅ Sample data added: 4 users, 5 posts, 3 listings, 2 teams.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
