import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import CertificationModal from '../components/CertificationModal';

const CertificationsPage: React.FC = () => {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:6969/api/certifications?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCertifications(data.certifications);
      }
    } catch (e) {
      console.error('Failed to fetch certifications', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:6969/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || data);
      }
    } catch (e) {
      console.error('Failed to fetch employees', e);
    }
  };

  useEffect(() => {
    fetchCertifications();
    fetchEmployees();
  }, []);

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const daysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Certifications</h1>
            <p className="text-slate-600 mt-2">Manage employee certifications and credentials</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
          >
            + Add Certification
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium">Total Certifications</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{certifications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium">Certified Employees</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {new Set(certifications.map((c) => c.employeeId)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium">Expiring Soon</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {certifications.filter((c) => {
                const days = daysUntilExpiry(c.expiryDate);
                return days && days <= 90 && days > 0;
              }).length}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading...</p>
          ) : certifications.length === 0 ? (
            <p className="text-slate-500 text-center py-8 bg-white border border-slate-200 rounded-lg">No certifications found.</p>
          ) : (
            certifications.map((cert) => {
              const employee = cert.employee?.user;
              const expired = isExpired(cert.expiryDate);
              const daysLeft = daysUntilExpiry(cert.expiryDate);

              return (
                <div
                  key={cert.id}
                  className={`bg-white rounded-lg shadow-sm p-6 border-l-4 border-y border-r border-y-slate-200 border-r-slate-200 transition ${expired ? 'border-l-red-600' : daysLeft && daysLeft <= 90 ? 'border-l-amber-600' : 'border-l-green-600'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={employee?.avatar || `https://ui-avatars.com/api/?name=${employee?.firstName}+${employee?.lastName}`}
                          alt={employee?.firstName}
                          className="w-10 h-10 rounded-full bg-slate-200"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{employee?.firstName} {employee?.lastName}</p>
                          <p className="text-sm text-slate-500">{cert.employee?.jobRole?.title || 'Employee'}</p>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{cert.name}</h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Issuer</p>
                          <p className="text-slate-900 font-medium mt-1">{cert.issuer}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Issue Date</p>
                          <p className="text-slate-900 font-medium mt-1">{new Date(cert.issueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Expiry Date</p>
                          <p className="text-slate-900 font-medium mt-1">{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'No expiry'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Status</p>
                          {expired ? (
                            <p className="text-red-600 font-medium mt-1">Expired</p>
                          ) : daysLeft && daysLeft <= 90 ? (
                            <p className="text-amber-600 font-medium mt-1">Expires in {daysLeft} days</p>
                          ) : (
                            <p className="text-green-600 font-medium mt-1">Valid</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {cert.url && (
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition"
                      >
                        View File
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CertificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        onSuccess={() => fetchCertifications()}
      />
    </AppShell>
  );
};

export default CertificationsPage;
