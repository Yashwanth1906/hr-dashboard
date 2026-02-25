import React, { useState } from 'react';

interface CertificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employees: any[];
}

const CertificationModal: React.FC<CertificationModalProps> = ({ isOpen, onClose, onSuccess, employees }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
    });
    const [file, setFile] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            let url = '';

            // 1. Upload file if exists
            if (file) {
                const uploadData = new FormData();
                uploadData.append('file', file);

                const uploadRes = await fetch('http://localhost:6969/api/upload', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: uploadData
                });

                if (uploadRes.ok) {
                    const uploadJson = await uploadRes.json();
                    url = uploadJson.url;
                } else {
                    throw new Error('Failed to upload file');
                }
            }

            // 2. Create Certification
            const certRes = await fetch('http://localhost:6969/api/certifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    url
                })
            });

            if (!certRes.ok) {
                throw new Error('Failed to create certification');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error saving certification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Add Certification</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                        <select
                            className="w-full border border-slate-300 rounded p-2"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            required
                        >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.user?.firstName} {emp.user?.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Certification Name</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded p-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Issuer</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-slate-300 rounded p-2"
                            value={formData.issuer}
                            onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-slate-300 rounded p-2 text-sm"
                                value={formData.issueDate}
                                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                            <input
                                type="date"
                                className="w-full border border-slate-300 rounded p-2 text-sm"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload File (PDF/Image)</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full border border-slate-300 rounded p-2 text-sm"
                            accept=".pdf,.png,.jpg,.jpeg"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Certification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CertificationModal;
