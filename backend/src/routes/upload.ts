import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { uploadToS3, getPublicS3Url } from '../lib/s3';

const router = Router();

// Configure multer to store file in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

router.post('/', authenticate, upload.single('file'), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.file;
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        await uploadToS3(file.buffer, fileName, file.mimetype);

        const url = getPublicS3Url(fileName);

        res.json({ url, fileName });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Failed to upload file' });
    }
});

export default router;
