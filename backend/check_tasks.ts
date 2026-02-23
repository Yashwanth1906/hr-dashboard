import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const task = await prisma.task.findFirst({
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

    console.log(JSON.stringify(task?.team, null, 2));
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
