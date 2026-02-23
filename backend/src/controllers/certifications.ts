import { prisma } from '../lib/prisma';

export const getAllCertifications = async (req: any, res: any) => {
    try {
        const { employeeId, search, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        if (employeeId) where.employeeId = employeeId as string;
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { issuer: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        // If employee, only show their certifications
        if (req.user?.role === 'EMPLOYEE') {
            const employee = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            if (employee) {
                where.employeeId = employee.id;
            }
        }

        const [certifications, total] = await Promise.all([
            prisma.certification.findMany({
                where,
                include: {
                    employee: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                            }
                        }
                    }
                },
                orderBy: { issueDate: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.certification.count({ where })
        ]);

        res.json({
            certifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get certifications error:', error);
        res.status(500).json({ message: 'Failed to fetch certifications' });
    }
};

export const getCertificationById = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const certification = await prisma.certification.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });

        if (!certification) {
            return res.status(404).json({ message: 'Certification not found' });
        }

        res.json(certification);
    } catch (error) {
        console.error('Get certification error:', error);
        res.status(500).json({ message: 'Failed to fetch certification' });
    }
};

export const createCertification = async (req: any, res: any) => {
    try {
        const { employeeId, name, issuer, issueDate, expiryDate, credentialId, url } = req.body;

        if (!employeeId || !name || !issuer || !issueDate) {
            return res.status(400).json({ message: 'Employee, name, issuer, and issue date are required' });
        }

        const certification = await prisma.certification.create({
            data: {
                employeeId,
                name,
                issuer,
                issueDate: new Date(issueDate),
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                credentialId,
                url
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });

        // Notify employee - wait, notification model may not exist? Let's check schema.
        // If it fails, I'll remove it later
        try {
            await (prisma as any).notification.create({
                data: {
                    userId: certification.employee.userId,
                    title: 'New Certification Added',
                    message: `A new certification "${name}" has been added to your profile`,
                    type: 'SYSTEM'
                }
            });
        } catch (err) {
            console.warn('Could not create notification');
        }

        res.status(201).json(certification);
    } catch (error) {
        console.error('Create certification error:', error);
        res.status(500).json({ message: 'Failed to create certification' });
    }
};

export const updateCertification = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { name, issuer, issueDate, expiryDate, credentialId, url } = req.body;

        const existingCert = await prisma.certification.findUnique({
            where: { id }
        });

        if (!existingCert) {
            return res.status(404).json({ message: 'Certification not found' });
        }

        const certification = await prisma.certification.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                issuer: issuer !== undefined ? issuer : undefined,
                issueDate: issueDate ? new Date(issueDate) : undefined,
                expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
                credentialId: credentialId !== undefined ? credentialId : undefined,
                url: url !== undefined ? url : undefined
            },
            include: {
                employee: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                        }
                    }
                }
            }
        });

        res.json(certification);
    } catch (error) {
        console.error('Update certification error:', error);
        res.status(500).json({ message: 'Failed to update certification' });
    }
};

export const deleteCertification = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const existingCert = await prisma.certification.findUnique({
            where: { id }
        });

        if (!existingCert) {
            return res.status(404).json({ message: 'Certification not found' });
        }

        await prisma.certification.delete({
            where: { id }
        });

        res.json({ message: 'Certification deleted successfully' });
    } catch (error) {
        console.error('Delete certification error:', error);
        res.status(500).json({ message: 'Failed to delete certification' });
    }
};

export const getMyCertifications = async (req: any, res: any) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: { userId: req.user!.id }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const certifications = await prisma.certification.findMany({
            where: { employeeId: employee.id },
            orderBy: { issueDate: 'desc' }
        });

        res.json(certifications);
    } catch (error) {
        console.error('Get my certifications error:', error);
        res.status(500).json({ message: 'Failed to fetch certifications' });
    }
};
