import express from 'express';
import { uploadDocument, getUserDocuments } from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Error handling wrapper for multer to return proper JSON response instead of HTML error
const handleUploadError = (req, res, next) => {
    const uploadSingle = upload.single('document');
    uploadSingle(req, res, (err) => {
        if (err) {
            let status = 400;
            if (err.message === 'File too large') status = 413;
            return res.status(status).json({ message: err.message });
        }
        next();
    });
};

router.post('/upload', protect, handleUploadError, uploadDocument);
router.get('/', protect, getUserDocuments);

export default router;
