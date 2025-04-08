import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';

// Create upload directories if they don't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const filesDir = path.join(uploadsDir, 'files');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    cb(null, isImage ? imagesDir : filesDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, Office documents, and text files are allowed.'));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Process uploaded image (resize, optimize)
export const processImage = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  
  if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml' && file.mimetype !== 'image/gif') {
    try {
      const processedFilePath = path.join(imagesDir, `processed_${path.basename(file.path)}`);
      
      await sharp(file.path)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(processedFilePath);
      
      // Replace original file path with processed file path
      fs.unlinkSync(file.path);
      req.file.path = processedFilePath;
      req.file.filename = path.basename(processedFilePath);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }
  
  next();
};

// Generate URL for uploaded file
export const getFileUrl = (req: Request, filename: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename.startsWith('processed_') ? 'images' : 'files'}/${filename}`;
};