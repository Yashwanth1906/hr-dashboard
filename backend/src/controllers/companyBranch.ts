import { Request, Response } from "express";
import { prisma } from "../lib/prisma"

export const getAllCompanyBranches = async (req: Request, res: Response) => {
    try {
        const companyBranches = await prisma.companyBranch.findMany({
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true
            }
        });
        res.json(companyBranches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch company branches' });
    }
};

export const createCompanyBranch = async (req: Request, res: Response) => {
    try {
        const { name, latitude, longitude } = req.body;

        if (!name || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
        }

        const companyBranch = await prisma.companyBranch.create({
            data: {
                name,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            }
        });

        res.status(201).json(companyBranch);
    } catch (error) {
        console.error('Create company branch error:', error);
        res.status(500).json({ error: 'Failed to create company branch' });
    }
};