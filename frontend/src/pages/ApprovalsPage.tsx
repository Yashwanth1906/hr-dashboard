import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/utils';
import axios from 'axios';

const ApprovalsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'tasks' | 'leaves'>('tasks');
    const [tasks, setTasks] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios(`${API_URL}/tasks/unapproved`, { validateStatus: () => true, 
                headers: { Authorization: `Bearer ${token}` }
            });
            if ((res.status >= 200 && res.status < 300)) {
                const data = res.data;
                setTasks(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios(`${API_URL}/leaves?status=PENDING`, { validateStatus: () => true, 
                headers: { Authorization: `Bearer ${token}` }
            });
            if ((res.status >= 200 && res.status < 300)) {
                const data = res.data;
                setLeaves(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            if (activeTab === 'tasks') {
                await fetchTasks();
            } else {
                await fetchLeaves();
            }
            setLoading(false);
        };
        loadData();
    }, [activeTab]);

    const approveTask = async (taskId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios(`${API_URL}/tasks/${taskId}/approve`, { validateStatus: () => true, 
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const approveLeave = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const token = localStorage.getItem('token');
            await axios(`${API_URL}/leaves/${leaveId}/status`, { validateStatus: () => true, 
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                data: JSON.stringify({ status })
            });
            fetchLeaves();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Approvals</h1>
                    <p className="text-slate-600 mt-2">Manage pending tasks and leave requests across your teams.</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'tasks'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Pending Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('leaves')}
                        className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'leaves'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        Pending Leaves
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : (
                    <div>
                        {activeTab === 'tasks' && (
                            <div className="space-y-4">
                                {tasks.length === 0 ? (
                                    <div className="p-8 text-center bg-white rounded-lg border border-slate-200 shadow-sm text-slate-500">
                                        No pending tasks require approval.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {tasks.map(task => (
                                            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-900 text-lg mb-2">{task.title}</h3>
                                                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">{task.description}</p>

                                                    <div className="text-sm text-slate-500 mb-2">
                                                        <span className="font-medium text-slate-700">Priority: </span>
                                                        <span className="uppercase text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded">{task.priority}</span>
                                                    </div>

                                                    {task.assignee && (
                                                        <div className="flex items-center gap-2 mt-4">
                                                            <span className="text-sm font-medium text-slate-700 border-r pr-2 border-slate-300">Assignee</span>
                                                            <img src={task.assignee.user?.avatar || `https://ui-avatars.com/api/?name=${task.assignee.user?.firstName}+${task.assignee.user?.lastName}&background=random`} alt="Assignee" className="w-6 h-6 rounded-full" />
                                                            <span className="text-sm text-slate-700">{task.assignee.user?.firstName}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-slate-100">
                                                    <button
                                                        onClick={() => approveTask(task.id)}
                                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                                                    >
                                                        Approve Task
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'leaves' && (
                            <div className="space-y-4">
                                {leaves.length === 0 ? (
                                    <div className="p-8 text-center bg-white rounded-lg border border-slate-200 shadow-sm text-slate-500">
                                        No pending leave requests.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {leaves.map(leave => (
                                            <div key={leave.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{leave.employee?.user?.firstName} {leave.employee?.user?.lastName}</h3>
                                                            <p className="text-xs text-slate-500">{leave.employee?.user?.email}</p>
                                                        </div>
                                                        <span className="uppercase text-xs font-bold px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                                            {leave.type}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded">
                                                        <div><span className="font-medium text-slate-800">Start:</span> {new Date(leave.startDate).toLocaleDateString()}</div>
                                                        <div><span className="font-medium text-slate-800">End:</span> {new Date(leave.endDate).toLocaleDateString()}</div>
                                                    </div>

                                                    <div className="text-sm">
                                                        <span className="font-medium text-slate-800 block mb-1">Reason:</span>
                                                        <p className="text-slate-600 italic">"{leave.reason}"</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                                                    <button
                                                        onClick={() => approveLeave(leave.id, 'APPROVED')}
                                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition text-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => approveLeave(leave.id, 'REJECTED')}
                                                        className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition text-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default ApprovalsPage;
