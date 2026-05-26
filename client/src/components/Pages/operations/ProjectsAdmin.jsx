import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiEdit2, FiFolder, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';
import ModulePageLayout from './ModulePageLayout';
import {
  createProjectRecord,
  fetchProjectsList,
  toErrorMessage,
  updateProjectRecord,
} from '../../../services/operationsModulesApi';

const emptyForm = () => ({ name: '', code: '', toolsText: '', isActive: true });

const parseTools = (text) =>
  String(text || '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (match) {
        return { name: match[1].trim(), notes: match[2].trim() };
      }
      return { name: line };
    });

const toolsToText = (tools = []) =>
  (tools || [])
    .map((t) => {
      const name = String(t?.name || '').trim();
      const notes = String(t?.notes || '').trim();
      return notes ? `${name} (${notes})` : name;
    })
    .filter(Boolean)
    .join('\n');

const ProjectsAdmin = () => {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editForm, setEditForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await fetchProjectsList(false));
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (project) => {
    setEditingId(project._id);
    setEditForm({
      name: project.name || '',
      code: project.code || '',
      toolsText: toolsToText(project.requiredTools),
      isActive: project.isActive !== false,
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

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
      setForm(emptyForm());
      setBanner({ type: 'success', text: 'Project created.' });
      await load();
    } catch (err) {
      setBanner({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingId || !editForm) return;
    setBusy(true);
    try {
      await updateProjectRecord(editingId, {
        name: editForm.name,
        code: editForm.code,
        requiredTools: parseTools(editForm.toolsText),
        isActive: editForm.isActive,
      });
      setBanner({ type: 'success', text: 'Project and tools updated.' });
      closeEdit();
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
            placeholder="Required tools (one per line or comma-separated)"
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.toolsText}
            onChange={(e) => setForm((p) => ({ ...p, toolsText: e.target.value }))}
          />
          <p className="text-xs text-slate-500">
            Example: Laptop, VPN, Jira. Use edit on an existing project to change tools later.
          </p>
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
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    {p.name}
                    {p.isActive === false ? (
                      <span className="ml-2 text-xs font-normal text-slate-400">(inactive)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{p.code || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(p.requiredTools || []).map((t) => t.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center gap-1 text-slate-700 text-xs font-medium hover:text-blue-600"
                    >
                      <FiEdit2 /> Edit
                    </button>
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

      {editForm && editingId
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-project-title"
              onClick={closeEdit}
            >
              <form
                className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSaveEdit}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 id="edit-project-title" className="text-lg font-semibold text-gray-900">
                      Edit project &amp; tools
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Updates apply to new provisioning tickets. Existing tickets keep their snapshot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    required
                    placeholder="Project name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    placeholder="Code (optional)"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
                    value={editForm.code}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Required tools</label>
                    <textarea
                      placeholder="One tool per line or comma-separated"
                      rows={5}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      value={editForm.toolsText}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, toolsText: e.target.value }))
                      }
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Add, remove, or rename tools. Clear the field to remove all tools.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                    />
                    Active project
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {busy ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}
    </ModulePageLayout>
  );
};

export default ProjectsAdmin;
