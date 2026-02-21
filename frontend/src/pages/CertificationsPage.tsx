import React from 'react';
import AppShell from '../components/AppShell';
import { mockCertifications, mockEmployees } from '../lib/mock-data';

const CertificationsPage: React.FC = () => {
  const getEmployeeById = (id: string) => mockEmployees.find((e) => e.id === id);

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
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Certifications</h1>
          <p className="text-slate-600 mt-2">Manage employee certifications and credentials</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Total Certifications</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{mockCertifications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Certified Employees</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {new Set(mockCertifications.map((c) => c.employeeId)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Expiring Soon</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {mockCertifications.filter((c) => {
                const days = daysUntilExpiry(c.expiryDate);
                return days && days <= 90 && days > 0;
              }).length}
            </p>
          </div>
        </div>

        {/* Certifications List */}
        <div className="space-y-4">
          {mockCertifications.map((cert) => {
            const employee = getEmployeeById(cert.employeeId);
            const expired = isExpired(cert.expiryDate);
            const daysLeft = daysUntilExpiry(cert.expiryDate);

            return (
              <div
                key={cert.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition ${
                  expired ? 'border-red-600' : daysLeft && daysLeft <= 90 ? 'border-amber-600' : 'border-green-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={employee?.avatar}
                        alt={employee?.name}
                        className="w-10 h-10 rounded-full bg-slate-300"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{employee?.name}</p>
                        <p className="text-sm text-slate-500">{employee?.position}</p>
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
                        <p className="text-slate-900 font-medium mt-1">{cert.issueDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Expiry Date</p>
                        <p className="text-slate-900 font-medium mt-1">{cert.expiryDate || 'No expiry'}</p>
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
                      className="ml-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default CertificationsPage;
