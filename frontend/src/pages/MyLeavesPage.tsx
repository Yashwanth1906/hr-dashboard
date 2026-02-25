import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import RequestLeaveModal from '../components/RequestLeaveModal';
import { useAuth } from '../contexts/AuthContext';

const MyLeavesPage: React.FC = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:6969/api/leaves/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLeaves(data || []);
            }
        } catch (e) {
            console.error('Failed to fetch leaves', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            case 'PENDING': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
    const approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
    const totalLeaves = leaves.length;

    return (
        <AppShell>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Leaves & WFH</h1>
                        <p className="text-slate-600 mt-2">Manage your leave applications and work from home requests</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Request Leave / WFH
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <p className="text-slate-600 text-sm font-medium">Pending Requests</p>
                        <p className="text-3xl font-bold text-amber-600 mt-2">{pendingLeaves}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <p className="text-slate-600 text-sm font-medium">Approved Requests</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">{approvedLeaves}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <p className="text-slate-600 text-sm font-medium">Total Requests</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{totalLeaves}</p>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900">Request History</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Type</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Duration</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Reason</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Applied On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leaves.map((leave) => {
                                    const start = new Date(leave.startDate);
                                    const end = new Date(leave.endDate);
                                    const applied = new Date(leave.createdAt);
                                    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                                    return (
                                        <tr key={leave.id} className="hover:bg-slate-50 transition">
                                            <td className="py-4 px-6">
                                                <span className="font-medium text-slate-900">{leave.type.replace('_', ' ')}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm">
                                                    <p className="text-slate-900 font-medium">{durationDays} Day{durationDays > 1 ? 's' : ''}</p>
                                                    <p className="text-slate-500">{start.toLocaleDateString()} - {end.toLocaleDateString()}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 max-w-xs truncate" title={leave.reason}>
                                                {leave.reason || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-sm">
                                                {applied.toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {!loading && leaves.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No requests yet</h3>
                            <p className="text-slate-500">You haven't submitted any leave or WFH requests.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Loading requests...</p>
                        </div>
                    )}
                </div>

                <RequestLeaveModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchLeaves}
                />
            </div>
        </AppShell>
    );
};

export default MyLeavesPage;
