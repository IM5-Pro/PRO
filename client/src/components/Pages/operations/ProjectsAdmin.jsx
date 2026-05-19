import React, { useCallback, useEffect, useState } from 'react';
import { FiFolder, FiPlus, FiRefreshCw } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import {
  createProjectRecord,
  fetchProjectsList,
  toErrorMessage,
  updateProjectRecord,
} from '../../../services/operationsModulesApi';

const ProjectsAdmin = () => {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', toolsText: '', isActive: true });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await fetchProjectsList(true));
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parseTools = (text) =>
    String(text || '')
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createProjectRecord({
        name: form.name,
        code: form.code,
        requiredTools: parseTools(form.toolsText),
        isActive: form.isActive,
      });
      setForm({ name: '', code: '', toolsText: '', isActive: true });
      setBanner({ type: 'success', text: 'Project created.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      await updateProjectRecord(p._id, { isActive: !p.isActive });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    }
  };

  return (
    <ModulePageLayout
      title="Projects"
      subtitle="Manage projects and required tools for onboarding"
      icon={FiFolder}
      actions={
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      {banner.text ? (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${banner.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {banner.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FiPlus /> New project
          </h2>
          <input
            required
            placeholder="Project name"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder="Code (optional)"
            className="w-full border rounded-lg px-3 py-2 text-sm uppercase"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
          />
          <textarea
            placeholder="Required tools (comma or newline separated)"
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.toolsText}
            onChange={(e) => setForm((p) => ({ ...p, toolsText: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active
          </label>
          <button type="submit" disabled={busy} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-60">
            {busy ? 'Saving…' : 'Create project'}
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Tools</th>
                <th className="text-right px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.code || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(p.requiredTools || []).map((t) => t.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => toggleActive(p)} className="text-blue-600 text-xs font-medium">
                      {p.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && projects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No projects
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModulePageLayout>
  );
};

export default ProjectsAdmin;
