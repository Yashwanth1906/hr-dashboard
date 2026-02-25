import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export const uploadToS3 = async (
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucketName: string = process.env.AWS_S3_BUCKET_NAME || ''
): Promise<string> => {
    if (!bucketName) {
        throw new Error('S3 bucket name is not configured.');
    }

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);
    return fileName;
};

export const getSignedS3Url = async (
    fileName: string,
    bucketName: string = process.env.AWS_S3_BUCKET_NAME || '',
    expiresInSeconds: number = 3600
): Promise<string> => {
    if (!bucketName) {
        throw new Error('S3 bucket name is not configured.');
    }

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

export const getPublicS3Url = (fileName: string, bucketName: string = process.env.AWS_S3_BUCKET_NAME || '', region: string = process.env.AWS_REGION || 'us-east-1') => {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
};
