import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
    {
        originalName: {
            type: String,
            required: true
        },
        storedName: {
            type: String,
            required: true,
            unique: true
        },
        filePath: {
            type: String,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        // SHA-256 produces a content fingerprint (64-character hex digest) used to
        // verify that the file bytes have not changed. It does NOT prove who uploaded
        // the document, does NOT constitute a digital signature, and does NOT provide
        // authenticity or proof of authorization — those belong to later phases.
        sha256Hash: {
            type: String,
            default: null,
            index: true
        },
        status: {
            type: String,
            default: 'UPLOADED',
            enum: ['UPLOADED', 'HASHED', 'SIGNED']
        }
    },
    {
        timestamps: true
    }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;
