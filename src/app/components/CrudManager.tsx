import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

type CrudValue = string | number;
export type CrudRecord = Record<string, CrudValue> & { id: string };

interface CrudManagerProps {
  title: string;
  description: string;
  entityName: string;
  initialRecords: CrudRecord[];
}

export default function CrudManager({ title, description, entityName, initialRecords }: CrudManagerProps) {
  const [records, setRecords] = useState<CrudRecord[]>(initialRecords);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CrudRecord | null>(null);

  const fields = useMemo(() => {
    const sample = records[0] || initialRecords[0] || { id: "" };
    return Object.keys(sample).filter((key) => key !== "id");
  }, [initialRecords, records]);

  const startCreate = () => {
    const blank = fields.reduce<CrudRecord>((acc, field) => {
      acc[field] = "";
      return acc;
    }, { id: `${entityName.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-5)}` });
    setDraft(blank);
    setEditingId("new");
  };

  const startEdit = (record: CrudRecord) => {
    setDraft({ ...record });
    setEditingId(record.id);
  };

  const cancel = () => {
    setDraft(null);
    setEditingId(null);
  };

  const save = () => {
    if (!draft) return;
    if (editingId === "new") {
      setRecords((current) => [draft, ...current]);
    } else {
      setRecords((current) => current.map((record) => record.id === draft.id ? draft : record));
    }
    cancel();
  };

  const remove = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
    if (editingId === id) cancel();
  };

  return (
    <div className="bg-white rounded-xl border border-brand-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-serif text-xl text-brand-900">{title}</h3>
          <div className="text-xs text-brand-600 mt-0.5">{description}</div>
        </div>
        <button onClick={startCreate} className="px-3 py-2 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add {entityName}
        </button>
      </div>

      {editingId && draft && (
        <div className="mb-4 p-4 rounded-lg bg-brand-50 border border-brand-100">
          <div className="text-xs uppercase tracking-wider text-brand-600 mb-3">{editingId === "new" ? "Create" : "Update"} {entityName}</div>
          <div className="grid md:grid-cols-3 gap-3">
            {fields.map((field) => (
              <label key={field} className="text-xs text-brand-700 capitalize">
                {field.replace(/([A-Z])/g, " $1")}
                <input
                  value={draft[field] ?? ""}
                  onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-brand-200 rounded-md bg-white text-sm focus:outline-none focus:border-brand-500"
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={cancel} className="px-3 py-1.5 border border-brand-200 rounded-md text-xs hover:bg-white flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
            <button onClick={save} className="px-3 py-1.5 bg-brand-800 text-cream-50 rounded-md text-xs hover:bg-brand-900 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-brand-600 uppercase tracking-wider border-b border-brand-100">
              <th className="text-left pb-2 font-medium">ID</th>
              {fields.map((field) => <th key={field} className="text-left pb-2 font-medium capitalize">{field.replace(/([A-Z])/g, " $1")}</th>)}
              <th className="text-right pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-brand-50/40">
                <td className="py-3 pr-4 font-mono text-xs text-brand-700">{record.id}</td>
                {fields.map((field) => <td key={field} className="py-3 pr-4 text-brand-800 whitespace-nowrap">{record[field]}</td>)}
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(record)} className="p-1.5 rounded hover:bg-brand-100 text-brand-600" aria-label={`Edit ${entityName}`}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(record.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label={`Delete ${entityName}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={fields.length + 2} className="py-8 text-center text-sm text-brand-500">No {entityName.toLowerCase()} records yet. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}