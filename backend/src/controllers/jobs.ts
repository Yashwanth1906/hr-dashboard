import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAllJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.jobRole.findMany();
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getJobById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (id === undefined) {
            return res.status(400).json({ message: 'Job ID is required' });
        }
        const job = await prisma.jobRole.findUnique({
            where: { id },
        });
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createJob = async (req: Request, res: Response) => {
    try {
        const { name, salary } = req.body;
        const job = await prisma.jobRole.create({
            data: { name, salary },
        });
        res.json(job);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, salary } = req.body;
        if (id === undefined) {
            return res.status(400).json({ message: 'Job ID is required' });
        }
        const job = await prisma.jobRole.update({
            where: { id },
            data: { name, salary },
        });
        res.json(job);
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (id === undefined) {
            return res.status(400).json({ message: 'Job ID is required' });
        }
        await prisma.jobRole.delete({
            where: { id },
        });
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};