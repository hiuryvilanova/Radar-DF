// --- LogsView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { History, User, Clock, ShieldAlert } from "lucide-react";

interface LogsViewProps {
  currentUser: any;
  token: string;
}

export default function LogsView({ currentUser, token }: LogsViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role?.name === "Administrador";

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/audit/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 italic text-sm">
        Acesso Negado. Apenas administradores do sistema podem visualizar a trilha de auditoria global.
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-slate-800 font-bold text-xl">Logs de Auditoria</h2>
        <p className="text-slate-500 text-xs mt-0.5">Trilha completa de histórico de dados e alterações em tempo real</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider font-sans">
                  <th className="p-4 w-40">Data e Hora</th>
                  <th className="p-4">Operador</th>
                  <th className="p-4">Módulo</th>
                  <th className="p-4 w-24">Ação</th>
                  <th className="p-4">Campo Modificado</th>
                  <th className="p-4">Valor Anterior</th>
                  <th className="p-4">Novo Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.user?.name || "Sistema / Seed"}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                      {log.entity_type === "demand" ? "Demanda" : 
                       log.entity_type === "meeting" ? "Reunião" : 
                       log.entity_type === "city" ? "Cidade/RA" : log.entity_type}
                    </td>
                    <td className="p-4">
                      <span className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                        log.action === "create" ? "bg-emerald-100 text-emerald-800" :
                        log.action === "delete" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {log.action === "create" ? "Criar" : 
                         log.action === "delete" ? "Excluir" : "Alterar"}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600 font-mono text-[10px]">{log.field_name || "—"}</td>
                    <td className="p-4 max-w-xs truncate text-slate-400" title={log.old_value}>{log.old_value || "—"}</td>
                    <td className="p-4 max-w-xs truncate font-semibold text-slate-800" title={log.new_value}>{log.new_value || "—"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-450 italic">
                      Nenhum log de auditoria disponível no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
