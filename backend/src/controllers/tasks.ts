import { prisma } from '../lib/prisma';

export const getAllTasks = async (req: any, res: any) => {
    try {
        const { status, priority, assigneeId, search, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assigneeId) where.assigneeId = assigneeId as string;
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        // If employee, only show their tasks or unassigned tasks
        if (req.user?.role === 'EMPLOYEE') {
            const employee = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            if (employee) {
                where.OR = [
                    { assigneeId: employee.id },
                    { assigneeId: null }
                ];
            }
        }

        const [tasks, total] = await Promise.all([
            (prisma.task.findMany as any)({
                where: {
                    ...where,
                    isApproved: true
                },
                include: {
                    assignee: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                            }
                        }
                    },
                    createdBy: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                            }
                        }
                    },
                    team: {
                        include: {
                            members: {
                                include: {
                                    user: {
                                        select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, isOnBoarded: true }
                                    }
                                }
                            },
                            managers: {
                                include: {
                                    user: {
                                        select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, isOnBoarded: true }
                                    }
                                }
                            }
                        }
                    },
                    reviewer: {
                        include: {
                            user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true } }
                        }
                    },
                    tester: {
                        include: {
                            user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true } }
                        }
                    },
                    tags: true
                },
                orderBy: [
                    { priority: 'desc' },
                    { dueDate: 'asc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limitNum
            }),
            prisma.task.count({ where })
        ]);

        res.json({
            tasks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Failed to fetch tasks' });
    }
};

export const getTaskById = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignee: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Failed to fetch task' });
    }
};

export const createTask = async (req: any, res: any) => {
    try {
        const { title, description, priority, assigneeId, dueDate, teamId, tags } = req.body;

        if (!title || !teamId) {
            return res.status(400).json({ message: 'Title and Team ID are required' });
        }

        const task = await (prisma.task.create as any)({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                team: {
                    connect: { id: teamId }
                },
                createdBy: {
                    connect: { userId: req.user!.id } // Must link via Employee model relation? No, createdBy is Employee. Let's find Employee first!
                },
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'TODO',
                tags: tags && tags.length > 0 ? {
                    // Try to connect existing, but simple apps might just create. Since name isn't @unique in schema, we'll just create them. 
                    // Let's create new tags or perhaps we shouldn't insert tags as strings directly. 
                    create: tags.map((t: string) => ({ name: t }))
                } : undefined
            },
            include: {
                assignee: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });

        // Create notification for assignee
        if (assigneeId) {
            const assignee = await prisma.employee.findUnique({
                where: { id: assigneeId },
                include: { user: true }
            });

            if (assignee) {
                try {
                    if ((prisma as any).notification) {
                        await (prisma as any).notification.create({
                            data: {
                                userId: assignee.userId,
                                title: 'New Task Assigned',
                                message: `You have been assigned a new task: ${title}`,
                                type: 'TASK'
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Could not create notification');
                }
            }
        }

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Failed to create task' });
    }
};

export const updateTask = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, assigneeId, dueDate, githubUrl, commitId, feedback, reviewerId, testerId } = req.body;

        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: { assignee: true }
        });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check permissions
        const isAdmin = ['ADMIN', 'HR', 'MANAGER'].includes(req.user!.role);
        const isAssignee = existingTask.assignee?.userId === req.user!.id;

        if (!isAdmin && !isAssignee) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        // Employees can only update status
        const updateData: any = {};
        if (isAdmin) {
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (priority !== undefined) updateData.priority = priority;
            if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
            if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        }

        if (status !== undefined) {
            updateData.status = status;
            if (status === 'COMPLETED') {
                updateData.completedAt = new Date();
            } else {
                updateData.completedAt = null;
            }
        }

        if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
        if (commitId !== undefined) updateData.commitId = commitId;
        if (feedback !== undefined) updateData.feedback = feedback;

        if (reviewerId !== undefined) {
            const reviewerEmployee = await prisma.employee.findUnique({ where: { userId: reviewerId } });
            if (reviewerEmployee) {
                updateData.reviewerId = reviewerEmployee.id;
            }
        }

        if (testerId !== undefined) {
            const testerEmployee = await prisma.employee.findUnique({ where: { userId: testerId } });
            if (testerEmployee) {
                updateData.testerId = testerEmployee.id;
            }
        }
        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                assignee: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });

        // Notify assignee of changes
        if (assigneeId && assigneeId !== existingTask.assigneeId) {
            const assignee = await prisma.employee.findUnique({
                where: { id: assigneeId },
                include: { user: true }
            });

            if (assignee) {
                try {
                    if ((prisma as any).notification) {
                        await (prisma as any).notification.create({
                            data: {
                                userId: assignee.userId,
                                title: 'Task Assigned to You',
                                message: `You have been assigned to task: ${task.title}`,
                                type: 'TASK'
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Could not create notification');
                }
            }
        }

        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Failed to update task' });
    }
};

export const deleteTask = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const existingTask = await prisma.task.findUnique({
            where: { id }
        });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await prisma.task.delete({
            where: { id }
        });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Failed to delete task' });
    }
};

export const getAllUnapprovedTasks = async (req: any, res: any) => {
    try {
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'HR';
        let whereClause: any = { isApproved: false };

        if (!isAdmin) {
            const employee = await prisma.employee.findUnique({
                where: { userId: req.user.id },
                include: { managedTeams: true }
            });

            if (employee) {
                const teamIds = employee.managedTeams.map((t: any) => t.id);
                if (employee.teamId && !teamIds.includes(employee.teamId)) {
                    teamIds.push(employee.teamId);
                }
                whereClause.teamId = { in: teamIds };
            }
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignee: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
                    }
                },
                createdBy: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
                    }
                }
            },
            orderBy: [{ createdAt: 'desc' }]
        });
        res.json(tasks);
    } catch (error) {
        console.error('Get unapproved tasks error:', error);
        res.status(500).json({ message: 'Failed to fetch unapproved tasks' });
    }
};

export const approveTask = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.update({
            where: { id },
            data: { isApproved: true },
        });
        res.json(task);
    } catch (error) {
        console.error('Approve task error:', error);
        res.status(500).json({ message: 'Failed to approve task' });
    }
};

export const assignTask = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { assigneeUserId, assigneeId: fallbackAssigneeId } = req.body;

        let assigneeId = fallbackAssigneeId;
        let assigneeUserRecord = null;

        if (assigneeUserId) {
            const employee = await prisma.employee.findUnique({
                where: { userId: assigneeUserId },
                include: { user: true }
            });

            if (!employee) {
                return res.status(404).json({ message: 'Employee profile not found for this user' });
            }
            assigneeId = employee.id;
            assigneeUserRecord = employee;
        } else if (assigneeId) {
            assigneeUserRecord = await prisma.employee.findUnique({
                where: { id: assigneeId },
                include: { user: true }
            });
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                assigneeId,
                status: 'ASSIGNED'
            },
            include: {
                assignee: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                }
            }
        });

        if (assigneeUserRecord) {
            try {
                if ((prisma as any).notification) {
                    await (prisma as any).notification.create({
                        data: {
                            userId: assigneeUserRecord.userId,
                            title: 'New Task Assigned',
                            message: `You have been assigned a new task: ${task.title}`,
                            type: 'TASK'
                        }
                    });
                }
            } catch (e) {
                console.warn('Could not create notification');
            }
        }
        res.json(task);
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ message: 'Failed to assign task' });
    }
};

export const getAssignedTasks = async (req: any, res: any) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user!.id }
        });

        console.log(employee?.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const tasks = await (prisma.task.findMany as any)({
            where: {
                OR: [
                    { assigneeId: employee.id },
                    { assigneeId: null }
                ]
            },
            include: {
                assignee: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
                    }
                },
                createdBy: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }
                    }
                },
                team: {
                    include: {
                        members: {
                            include: {
                                user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, isOnBoarded: true } }
                            }
                        },
                        managers: {
                            include: {
                                user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, isOnBoarded: true } }
                            }
                        }
                    }
                },
                reviewer: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true } }
                    }
                },
                tester: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true } }
                    }
                },
                tags: true
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ]
        });
        res.json(tasks);
    } catch (error) {
        console.error('Get assigned tasks error:', error);
        res.status(500).json({ message: 'Failed to get assigned tasks' });
    }
}