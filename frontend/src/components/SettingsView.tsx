// --- SettingsView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle } from "lucide-react";

interface SettingsViewProps {
  currentUser: any;
  token: string;
}

export default function SettingsView({ currentUser, token }: SettingsViewProps) {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const isAdmin = currentUser?.role?.name === "Administrador";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/settings/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (id: number, key: string, value: string, description: string) => {
    if (!isAdmin) return;
    setSavingId(id);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/settings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key, value, description })
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar configuração");
      }

      fetchSettings();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar.");
    } finally {
      setSavingId(null);
    }
  };

  const handleValueChange = (id: number, val: string) => {
    setSettings(settings.map(s => s.id === id ? { ...s, value: val } : s));
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-slate-800 font-bold text-xl">Configurações do Sistema</h2>
        <p className="text-slate-500 text-xs mt-0.5">Customização de parâmetros e regras de comportamento</p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 max-w-2xl">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-2xl space-y-6">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          Variáveis de Configuração
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {settings.map((s) => (
              <div key={s.id} className="space-y-2 border-b border-slate-100/60 pb-5 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">{s.key}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.description || "Sem descrição cadastrada."}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleUpdateSetting(s.id, s.key, s.value, s.description)}
                      disabled={savingId === s.id}
                      className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-750 text-white px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      {savingId === s.id ? "Salvando..." : "Salvar"}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={s.value || ""}
                  onChange={(e) => handleValueChange(s.id, e.target.value)}
                  disabled={!isAdmin || savingId === s.id}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-3 text-slate-800 text-xs outline-none transition-all disabled:opacity-70 disabled:bg-slate-100"
                />
              </div>
            ))}
            {settings.length === 0 && (
              <div className="text-center text-slate-400 text-xs py-4">Nenhuma configuração registrada.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
