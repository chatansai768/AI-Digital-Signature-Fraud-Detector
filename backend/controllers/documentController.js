import crypto from 'crypto';
import fs from 'fs';

import Document from '../models/Document.js';

// ---------------------------------------------------------------------------
// SHA-256 HASHING NOTE
// SHA-256 creates a deterministic content fingerprint of the file bytes.
// Two identical files will produce the same hash; any byte change produces
// a completely different hash.  This hash does NOT:
//   • prove who uploaded or signed the document,
//   • constitute a digital signature,
//   • provide authenticity or authorization proof.
// Those capabilities belong to later phases (RSA signing, verification, AI).
// ---------------------------------------------------------------------------

/**
 * Calculate the SHA-256 hex digest of a file on disk using a read stream.
 * Using a stream avoids loading the entire file into memory at once, which
 * is better practice even though the upload limit is 10 MB.
 *
 * @param {string} filePath - Absolute or relative path to the file.
 * @returns {Promise<string>} 64-character lowercase hex digest.
 */
const computeSHA256 = (filePath) =>
    new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('error', reject);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });

/**
 * Safely delete a file, logging a warning if the deletion fails.
 * Used to clean up orphaned uploads when the database write fails.
 */
const safeUnlink = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            // Log the error server-side only; never expose the path to the client.
            console.warn(`[documentController] Could not remove orphaned file: ${err.message}`);
        }
    });
};

// @desc    Upload a new document, compute its SHA-256 hash, and persist metadata
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or invalid file format.' });
    }

    let sha256Hash = null;

    try {
        // Compute the SHA-256 hash from the actual bytes stored on disk.
        // This produces a 64-character hexadecimal content fingerprint.
        sha256Hash = await computeSHA256(req.file.path);
    } catch (hashError) {
        // Hashing failed — clean up the uploaded file and return an error.
        // Do NOT create a document record without a valid hash.
        console.error('[documentController] SHA-256 hashing failed:', hashError.message);
        safeUnlink(req.file.path);
        return res.status(500).json({ message: 'Failed to compute document hash. The upload has been cancelled.' });
    }

    try {
        const newDoc = new Document({
            originalName: req.file.originalname,
            storedName: req.file.filename,
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user._id,
            sha256Hash,
            status: 'HASHED'  // document has been hashed; ready for Phase 5 signing
        });

        const createdDoc = await newDoc.save();

        return res.status(201).json({
            message: 'Document uploaded and hashed successfully.',
            document: {
                id: createdDoc._id,
                originalName: createdDoc.originalName,
                mimeType: createdDoc.mimeType,
                fileSize: createdDoc.fileSize,
                sha256Hash: createdDoc.sha256Hash,
                status: createdDoc.status,
                createdAt: createdDoc.createdAt
            }
        });
    } catch (dbError) {
        // MongoDB write failed — clean up the uploaded file to avoid orphans.
        console.error('[documentController] Database write failed:', dbError.message);
        safeUnlink(req.file.path);
        return res.status(500).json({ message: 'Failed to save document record. The upload has been cancelled.' });
    }
};

// @desc    Get all documents belonging to the authenticated user
// @route   GET /api/documents
// @access  Private
export const getUserDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });

        // Map to a safe response shape — never expose absolute file paths to the client.
        const safeDocs = documents.map((doc) => ({
            id: doc._id,
            originalName: doc.originalName,
            mimeType: doc.mimeType,
            fileSize: doc.fileSize,
            // sha256Hash may be null for documents created before Phase 4.
            // The frontend must handle null gracefully.
            sha256Hash: doc.sha256Hash ?? null,
            status: doc.status,
            createdAt: doc.createdAt
        }));

        return res.json({ documents: safeDocs });
    } catch (error) {
        console.error('[documentController] getUserDocuments error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve documents.' });
    }
};
