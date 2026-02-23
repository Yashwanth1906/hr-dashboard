import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { API_URL } from '../utils/utils';

interface SelectOption {
    id: string;
    name: string;
}

const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateOnBoardingStatus } = useAuth();
    const { addNotification } = useNotifications();

    const [departments, setDepartments] = useState<SelectOption[]>([]);
    const [teams, setTeams] = useState<SelectOption[]>([]);
    const [jobs, setJobs] = useState<SelectOption[]>([]);

    const [departmentId, setDepartmentId] = useState('');
    const [teamId, setTeamId] = useState('');
    const [jobRoleId, setJobRoleId] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [deptsRes, teamsRes, jobsRes] = await Promise.all([
                    axios.get(`${API_URL}/departments`, { headers }),
                    axios.get(`${API_URL}/teams`, { headers }),
                    axios.get(`${API_URL}/jobs`, { headers }),
                ]);

                setDepartments(deptsRes.data);
                setTeams(teamsRes.data);
                setJobs(jobsRes.data);

                if (deptsRes.data.length > 0) setDepartmentId(deptsRes.data[0].id);
                if (teamsRes.data.length > 0) setTeamId(teamsRes.data[0].id);
                if (jobsRes.data.length > 0) setJobRoleId(jobsRes.data[0].id);

            } catch (error) {
                addNotification('Failed to load form data', 'error');
            } finally {
                setIsFetching(false);
            }
        };

        fetchData();
    }, [addNotification]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!departmentId || !jobRoleId || !phone || !address || !joinDate) {
            addNotification('Please fill in all required fields', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/employees`,
                {
                    userId: user?.id,
                    departmentId,
                    teamId: teamId || undefined,
                    jobRoleId,
                    joinDate,
                    phone,
                    address,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            updateOnBoardingStatus();
            addNotification('Onboarding completed successfully!', 'success');
            navigate('/dashboard');
        } catch (error) {
            addNotification('Failed to complete onboarding', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-slate-600">Loading details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-10 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="w-full max-w-xl">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name}!</h1>
                        <p className="text-slate-600 mt-2">Let's complete your profile to get you started.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                                <select
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900"
                                >
                                    <option value="" disabled>Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Team */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Team (Optional)</label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900"
                                >
                                    <option value="">No Team</option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Job Role */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Job Role</label>
                                <select
                                    value={jobRoleId}
                                    onChange={(e) => setJobRoleId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900"
                                >
                                    <option value="" disabled>Select Job Role</option>
                                    {jobs.map((j) => (
                                        <option key={j.id} value={j.id}>{j.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Join Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Join Date</label>
                                <input
                                    type="date"
                                    value={joinDate}
                                    onChange={(e) => setJoinDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 234 567 890"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900"
                                />
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows={3}
                                    placeholder="123 Main St, City, Country"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-slate-900 resize-none"
                                ></textarea>
                            </div>

                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {isLoading ? 'Completing Setup...' : 'Complete Setup'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
