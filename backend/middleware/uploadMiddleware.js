import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

// Multer storage configuration
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Temporarily store in uploads/
    },
    filename(req, file, cb) {
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const storedName = `document-${uniqueId}${ext}`;
        cb(null, storedName);
    }
});

// File validation
const fileFilter = (req, file, cb) => {
    // Only accept PDFs
    if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});

export default upload;
