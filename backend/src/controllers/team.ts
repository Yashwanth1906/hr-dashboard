import { Request, Response } from "express"
import { prisma } from "../lib/prisma"

export const getAllTeams = async (req: any, res: any) => {
    try {
        const teams = await (prisma.team.findMany as any)({
            include: {
                managers: { include: { user: true } },
                members: { include: { user: true } }
            }
        });
        res.json(teams);
    } catch {
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getTeamById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (id === undefined) {
            return res.status(400).json({ message: 'Team ID is required' });
        }
        const team = await prisma.team.findUnique({
            where: { id: id as string },
        });
        res.json(team);
    } catch {
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const createTeam = async (req: any, res: any) => {
    try {
        const { name, description, managerIds, productName } = req.body;
        const managersConnect = managerIds ? managerIds.map((id: string) => ({ id })) : [];
        const team = await (prisma.team.create as any)({
            data: {
                name,
                description,
                productName,
                managers: { connect: managersConnect }
            },
            include: { managers: { include: { user: true } } }
        });
        res.json(team);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const updateTeam = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { name, description, managerIds, productName } = req.body;
        const data: any = { name, description, productName };
        if (managerIds) {
            data.managers = { set: managerIds.map((mid: string) => ({ id: mid })) };
        }
        const team = await (prisma.team.update as any)({
            where: { id: id as string },
            data,
            include: {
                managers: { include: { user: true } },
                members: { include: { user: true } }
            }
        });
        res.json(team);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const deleteTeam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.team.delete({
            where: { id: id as string },
        });
        res.json({ message: 'Team deleted successfully' });
    } catch {
        res.status(500).json({ message: 'Internal server error' });
    }
}