import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { FileText, LogOut, ShieldAlert, Upload, User } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const getRequestErrorMessage = (error, action) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
        return 'Your session could not be verified. Please log in again.';
    }

    if (!error?.response) {
        return `Unable to ${action} because of a network error. Check your connection and try again.`;
    }

    if (error.response.status === 413) {
        return 'This PDF is larger than the 10 MB upload limit.';
    }

    return `We couldn't ${action}. Please try again.`;
};

const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
};

const formatUploadDate = (dateValue) => {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime())
        ? 'Date unavailable'
        : new Intl.DateTimeFormat('en-GB').format(date);
};

const fetchDocuments = async () => {
    const { data } = await api.get('/documents');
    return Array.isArray(data.documents) ? data.documents : [];
};

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [testMessage, setTestMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [documents, setDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(true);
    const [documentsError, setDocumentsError] = useState('');
    const fileInputRef = useRef(null);

    const loadDocuments = useCallback(async () => {
        try {
            setDocuments(await fetchDocuments());
        } catch (error) {
            setDocumentsError(getRequestErrorMessage(error, 'load your documents'));
        } finally {
            setLoadingDocuments(false);
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        fetchDocuments()
            .then((loadedDocuments) => {
                if (isActive) {
                    setDocuments(loadedDocuments);
                }
            })
            .catch((error) => {
                if (isActive) {
                    setDocumentsError(getRequestErrorMessage(error, 'load your documents'));
                }
            })
            .finally(() => {
                if (isActive) {
                    setLoadingDocuments(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, []);

    const handleTestRoute = async () => {
        try {
            const { data } = await api.get('/auth/protected-test');
            setTestMessage(data.message);
        } catch {
            setTestMessage('Failed to access protected route');
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        setUploadError('');
        setUploadSuccess('');

        if (!file) {
            setSelectedFile(null);
            return;
        }

        const isPdf = file.name.toLowerCase().endsWith('.pdf')
            && (!file.type || file.type === 'application/pdf');
        if (!isPdf) {
            setSelectedFile(null);
            setUploadError('Please choose a PDF file.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setSelectedFile(null);
            setUploadError('The selected PDF is larger than the 10 MB limit.');
            event.target.value = '';
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please choose a PDF file before uploading.');
            setUploadSuccess('');
            return;
        }

        setUploading(true);
        setUploadError('');
        setUploadSuccess('');

        const formData = new FormData();
        formData.append('document', selectedFile);

        try {
            await api.post('/documents/upload', formData, {
                withCredentials: true
            });
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setUploadSuccess('Your PDF was uploaded successfully.');
            setLoadingDocuments(true);
            setDocumentsError('');
            await loadDocuments();
        } catch (error) {
            setUploadError(getRequestErrorMessage(error, 'upload this PDF'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-brand">
                    <ShieldAlert size={32} className="brand-icon" />
                    <h1>AI-Based Digital Signature Fraud Detector</h1>
                </div>
                <div className="header-actions">
                    <button onClick={logout} className="logout-button">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Welcome, {user?.name}</h2>
                        <span className={`role-badge ${user?.role === 'ADMIN' ? 'admin' : 'user'}`}>
                            {user?.role}
                        </span>
                    </div>

                    <div className="user-details">
                        <div className="detail-item">
                            <MailIcon />
                            <span>Email: {user?.email}</span>
                        </div>
                        <div className="detail-item">
                            <User />
                            <span>Authentication Status: Authenticated</span>
                        </div>
                    </div>

                    <div className="test-section">
                        <h3>Connection Test</h3>
                        <button onClick={handleTestRoute} className="test-button">Test Protected Route</button>
                        {testMessage && <p className="test-message">{testMessage}</p>}
                    </div>

                    <section className="upload-section" aria-labelledby="upload-heading">
                        <h3 id="upload-heading">Secure Document Upload</h3>
                        <div className="file-input-wrapper">
                            <input
                                ref={fileInputRef}
                                id="document-file"
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                disabled={uploading}
                                hidden
                            />
                            <button
                                type="button"
                                className="test-button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                Choose PDF
                            </button>
                            <div className="selected-file-info" aria-live="polite">
                                <p>Selected file: {selectedFile?.name || 'No file selected'}</p>
                                {selectedFile && <p>File size: {formatFileSize(selectedFile.size)}</p>}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="upload-btn test-button"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            <Upload size={18} />
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                        {uploadError && (
                            <p className="status-message error" role="alert">{uploadError}</p>
                        )}
                        {uploadSuccess && (
                            <p className="status-message success" role="status">{uploadSuccess}</p>
                        )}
                    </section>

                    <section className="upload-section" aria-labelledby="documents-heading">
                        <h3 id="documents-heading">Uploaded Documents</h3>
                        {documentsError && (
                            <p className="status-message error" role="alert">{documentsError}</p>
                        )}
                        {loadingDocuments ? (
                            <p>Loading your documents...</p>
                        ) : documents.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={28} className="empty-icon" />
                                <p>No uploaded documents yet.</p>
                            </div>
                        ) : (
                            <div className="document-list">
                                {documents.map((document) => (
                                    <article className="document-item" key={document.id}>
                                        <div className="doc-info">
                                            <span className="doc-name">{document.originalName}</span>
                                            <span className="doc-meta">
                                                <span>
                                                    {document.mimeType === 'application/pdf'
                                                        ? 'PDF'
                                                        : document.mimeType || 'Unknown file type'}
                                                    {' • '}
                                                    {formatFileSize(document.fileSize)}
                                                </span>
                                                <span>Uploaded: {formatUploadDate(document.createdAt)}</span>
                                            </span>

                                            {/* SHA-256 hash row
                                                NOTE: This is a content fingerprint only.
                                                It does NOT prove authorship, constitute a
                                                digital signature, or indicate who signed the
                                                document — those belong to later phases. */}
                                            <HashRow hash={document.sha256Hash} />
                                        </div>
                                        <span className="doc-status">
                                            Status: {document.status || 'Unknown'}
                                        </span>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

/**
 * HashRow displays a document's SHA-256 content fingerprint.
 *
 * Important scope note:
 *   - SHA-256 is a content fingerprint only.
 *   - An identical hash confirms the bytes are unchanged.
 *   - It does NOT prove who uploaded or signed the document.
 *   - It does NOT constitute a digital signature or proof of authorization.
 *   - Detecting signing-key misuse belongs to the AI phase (Phase 8+).
 */
const HashRow = ({ hash }) => {
    const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copied' | 'error'

    const handleCopy = async () => {
        if (!hash) return;
        try {
            await navigator.clipboard.writeText(hash);
            setCopyStatus('copied');
        } catch {
            setCopyStatus('error');
        } finally {
            setTimeout(() => setCopyStatus('idle'), 2000);
        }
    };

    if (!hash) {
        return (
            <span className="hash-row hash-unavailable">
                SHA-256: Hash unavailable — upload again to calculate it.
            </span>
        );
    }

    return (
        <span className="hash-row">
            <span className="hash-label">SHA-256:</span>
            {/* Show first 16 + … + last 8 chars for readability; full hash in title tooltip */}
            <code className="hash-value" title={hash}>
                {hash.slice(0, 16)}…{hash.slice(-8)}
            </code>
            <button
                type="button"
                className="copy-hash-btn"
                onClick={handleCopy}
                aria-label="Copy full SHA-256 hash"
                title="Copy full hash to clipboard"
            >
                {copyStatus === 'copied' ? '✓ Copied' : copyStatus === 'error' ? '✗ Failed' : 'Copy'}
            </button>
        </span>
    );
};

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);

export default Dashboard;





