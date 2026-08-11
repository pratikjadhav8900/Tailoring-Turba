"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Loader2, 
  X, 
  FileText,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
  Download,
  Calendar,
  User
} from "lucide-react";
import toast from "react-hot-toast";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salaryRange: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  createdAt: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  quantity: number;
  requirements: string;
  createdAt: string;
}

export default function AdminJobsPage() {
  const [activeTab, setActiveTab] = useState<"listings" | "applications">("listings");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    salaryRange: "",
    description: "",
    requirementsText: "",
    responsibilitiesText: ""
  });

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/admin/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
      toast.error("Failed to load jobs.");
    } finally {
      if (activeTab === "listings") setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch("/api/admin/jobs/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
      toast.error("Failed to load applications.");
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    } else {
      fetchJobs();
    }
  }, [activeTab]);

  // Helper to parse application requirements string
  const parseApplicationDetails = (requirements: string) => {
    const lines = requirements.split("\n");
    let position = "N/A";
    let resumeName = "resume.pdf";
    let resumeUrl = "";
    let coverLetter = "";

    lines.forEach(line => {
      if (line.startsWith("Applied Position: ")) {
        position = line.substring("Applied Position: ".length);
      } else if (line.startsWith("Resume File Name: ")) {
        resumeName = line.substring("Resume File Name: ".length);
      } else if (line.startsWith("Resume Link: ")) {
        resumeUrl = line.substring("Resume Link: ".length);
      } else if (line.startsWith("Cover Letter: ")) {
        coverLetter = line.substring("Cover Letter: ".length);
      } else if (coverLetter) {
        coverLetter += "\n" + line;
      }
    });

    return { position, resumeName, resumeUrl, coverLetter };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const openCreateModal = () => {
    setEditingJob(null);
    setForm({
      title: "",
      department: "",
      location: "",
      type: "Full-time",
      salaryRange: "",
      description: "",
      requirementsText: "",
      responsibilitiesText: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      salaryRange: job.salaryRange || "",
      description: job.description,
      requirementsText: (job.requirements || []).join("\n"),
      responsibilitiesText: (job.responsibilities || []).join("\n")
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Job posting deleted.");
        setJobs(jobs.filter(job => job.id !== id));
      } else {
        toast.error("Failed to delete job.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.department || !form.location || !form.description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    const payload = {
      title: form.title,
      department: form.department,
      location: form.location,
      type: form.type,
      salaryRange: form.salaryRange,
      description: form.description,
      requirements: form.requirementsText.split("\n").filter(line => line.trim() !== ""),
      responsibilities: form.responsibilitiesText.split("\n").filter(line => line.trim() !== "")
    };

    try {
      const url = editingJob ? `/api/admin/jobs/${editingJob.id}` : "/api/admin/jobs";
      const method = editingJob ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingJob ? "Job updated successfully!" : "Job posting created!");
        setIsModalOpen(false);
        fetchJobs();
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Submission failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "clamp(16px, 5vw, 40px)" }} className="bg-slate-50 min-h-screen text-[#0f172a]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#0f172a] flex items-center gap-2.5">
            <Briefcase className="w-8 h-8 text-[#6b7d60]" /> Careers & Jobs
          </h1>
          <p className="text-gray-500 mt-1.5 font-light">
            {activeTab === "listings"
              ? "Manage and update active job listings for the Careers page."
              : "Review and track candidate job applications and resume files."}
          </p>
        </div>
        {activeTab === "listings" && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#6b7d60] hover:bg-[#4a5c3f] text-white px-5 py-3 rounded-lg font-semibold shadow-sm transition-all duration-200 self-start sm:self-auto cursor-pointer"
          >
            <Plus size={18} /> Add Job Posting
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab("listings")}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "listings"
              ? "border-[#6b7d60] text-[#6b7d60]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Job Postings ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "applications"
              ? "border-[#6b7d60] text-[#6b7d60]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Job Applications ({applications.length})
        </button>
      </div>

      {/* Listings Tab */}
      {activeTab === "listings" && (
        loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#6b7d60]" />
            <p className="text-sm text-gray-500 font-light">Loading job listings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">No Job Postings Found</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto font-light">
              You don&apos;t have any active careers listed. Click &quot;Add Job Posting&quot; to create your first opening.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-4 px-6">Job Title</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Location</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Salary Range</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#0f172a]">{job.title}</td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6b7d60]/10 text-[#6b7d60]">
                          {job.department}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 flex items-center gap-1.5 mt-1">
                        <MapPin size={14} className="text-gray-400" /> {job.location}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" /> {job.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium">{job.salaryRange || "—"}</td>
                      <td className="py-4 px-6 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(job)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-[#6b7d60] hover:bg-[#6b7d60]/5 hover:border-[#6b7d60]/30 transition-all cursor-pointer"
                          title="Edit Job"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
                          title="Delete Job"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Applications Tab */}
      {activeTab === "applications" && (
        loadingApps ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#6b7d60]" />
            <p className="text-sm text-gray-500 font-light">Loading job applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">No Applications Found</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto font-light">
              There are no job applications submitted yet. Active listings are published on the Careers portal.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-4 px-6">Candidate Details</th>
                    <th className="py-4 px-6">Applied Position</th>
                    <th className="py-4 px-6">Applied Date</th>
                    <th className="py-4 px-6">Resume Attachment</th>
                    <th className="py-4 px-6">Cover Letter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {applications.map((app) => {
                    const { position, resumeName, resumeUrl, coverLetter } = parseApplicationDetails(app.requirements);
                    return (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-[#0f172a]">{app.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                            <Mail size={12} className="text-gray-400" />
                            <a href={`mailto:${app.email}`} className="text-[#6b7d60] hover:underline font-medium">{app.email}</a>
                          </div>
                          {app.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                              <Phone size={12} className="text-gray-400" />
                              <a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6b7d60]/10 text-[#6b7d60]">
                            {position}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            {new Date(app.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {resumeUrl && resumeUrl.startsWith("http") ? (
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#c49d32] hover:text-[#a37e22] font-semibold text-xs hover:underline cursor-pointer"
                            >
                              <FileText size={14} /> Download Resume
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Attached in Email</span>
                          )}
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <p className="text-gray-600 line-clamp-3 text-xs font-light" title={coverLetter}>
                            {coverLetter || "No cover letter provided."}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold font-serif text-[#0f172a]">
                {editingJob ? `Edit Job: ${editingJob.title}` : "Add New Job Posting"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Lead Apparel Designer"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Department *</label>
                  <input
                    type="text"
                    name="department"
                    required
                    value={form.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Design & Development"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Location *</label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Pune / Hybrid"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Job Type *</label>
                  <select
                    name="type"
                    required
                    value={form.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Salary Range</label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={form.salaryRange}
                    onChange={handleInputChange}
                    placeholder="e.g. ₹6,00,000 - ₹9,00,000 / year"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Role Overview *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Describe the primary goal and impact of this role..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Responsibilities (One per line)</label>
                <textarea
                  name="responsibilitiesText"
                  rows={4}
                  value={form.responsibilitiesText}
                  onChange={handleInputChange}
                  placeholder="e.g. Translate designer sketches into tech packs&#10;Stitch fits samples..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Requirements (One per line)</label>
                <textarea
                  name="requirementsText"
                  rows={4}
                  value={form.requirementsText}
                  onChange={handleInputChange}
                  placeholder="e.g. 3+ years experience in fashion design&#10;Proficient in Adobe Illustrator..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm font-light"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 bg-[#6b7d60] hover:bg-[#4a5c3f] text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Job Posting"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
