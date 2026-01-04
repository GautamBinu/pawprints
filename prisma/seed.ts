import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/client/client';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding ...');

  // 1. Create Tags
  const tags = ['Housing', 'Dining', 'Campus Life', 'Facilities', 'Academics', 'Technology', 'Transportation', 'Sustainability'];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag },
      update: {},
      create: { name: tag },
    });
  }
  console.log('Tags created.');

  // 2. Create Mock Users
  const users = [
    { email: 'student@rit.edu', name: 'RIT Student', id: 'user-student-1', displayName: 'RIT Student' },
    { email: 'admin@rit.edu', name: 'SG Admin', id: 'user-admin-1', displayName: 'Admin' },
    { email: 'faculty@rit.edu', name: 'Professor X', id: 'user-faculty-1', displayName: 'Prof X' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        displayName: u.displayName,
        notificationSettings: {
          create: {
            update: true,
            response: true,
            reported: false,
            threshold: false
          }
        }
      },
    });
  }
  console.log('Users created.');

  // 2.5 Create Global Alert
  await prisma.globalAlert.create({
    data: {
      content: "Welcome to the new PawPrints! Please review the updated community guidelines.",
      active: true,
    }
  });

  const studentUser = users[0];
  const adminUser = users[1];

  // 3. Create Petitions

  // Case A: Published, Popular, Active
  await prisma.petition.create({
    data: {
      title: '24/7 Library Access During Finals',
      description: '<p>Students need a safe and quiet place to study late at night during finals week. We propose keeping the library open 24/7.</p>',
      authorId: studentUser.id,
      status: 1, // Published
      signatures: 185, // Close to 200 goal
      expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks left
      tags: { connect: { name: 'Academics' } },
    },
  });

  // Case B: Published, Has Response (Completed/Closed)
  const tacoResponse = await prisma.response.create({
    data: {
      description: '<p>We hear you! The Taco Bar will return next semester with new options including vegan chorizo.</p>',
      author: 'Dining Services',
    }
  });

  await prisma.petition.create({
    data: {
      title: 'Bring Back the Taco Bar',
      description: '<p>The taco bar at the Commons was a staple of student diet. Please bring it back!</p>',
      authorId: studentUser.id,
      status: 1, // Published
      signatures: 250, // Met goal
      expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      hasResponse: true,
      responseId: tacoResponse.id,
      tags: { connect: { name: 'Dining' } },
    },
  });

  // Case C: In Progress with Updates
  await prisma.petition.create({
    data: {
      title: 'Improve WiFi in Dorms',
      description: '<p>The internet connection in the dorms is unstable and slow, affecting our ability to do homework.</p>',
      authorId: studentUser.id,
      status: 1, // Published
      signatures: 300,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      inProgress: true,
      updates: {
        create: [
          {
            description: '<p>We have met with ITS and they are investigating the access points in Sol Heumann Hall.</p>',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          },
          {
            description: '<p>ITS has agreed to upgrade the firmware on all routers next Tuesday.</p>',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          }
        ]
      },
      tags: { connect: [{ name: 'Technology' }, { name: 'Housing' }] },
    },
  });

  // Case D: Expired Petition
  await prisma.petition.create({
    data: {
      title: 'More Parking for Freshmen',
      description: '<p>Freshmen should be allowed to park in J lot.</p>',
      authorId: studentUser.id,
      status: 1, // Published
      signatures: 12, // Failed to get traction
      expires: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired 10 days ago
      tags: { connect: { name: 'Transportation' } },
    },
  });

  // Case E: Needs Review (Pending)
  await prisma.petition.create({
    data: {
      title: 'Ban Homework on Weekends',
      description: '<p>Mental health is important. Weekends should be strictly for rest.</p>',
      authorId: studentUser.id,
      status: 3, // NeedsReview
      signatures: 0,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: { connect: { name: 'Academics' } },
    },
  });

  // Case F: Rejected/Removed
  await prisma.petition.create({
    data: {
      title: 'Free Pizza Fridays',
      description: '<p>The university should provide free pizza every Friday.</p>',
      authorId: studentUser.id,
      status: 2, // Removed
      signatures: 5,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: { connect: { name: 'Dining' } },
    },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
