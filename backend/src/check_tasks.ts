import { prisma } from './lib/prisma';

async function run() {
    const tasks = await prisma.task.findMany({
        where: { status: 'TODO' },
        take: 1,
        include: {
            team: {
                include: {
                    members: {
                        include: { user: true }
                    },
                    managers: {
                        include: { user: true }
                    }
                }
            }
        }
    });

    console.log(JSON.stringify(tasks, null, 2));
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
