// --- ActionsView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, MapPin, Tag, User, AlertTriangle, CheckCircle } from "lucide-react";

interface ActionsViewProps {
  cities: any[];
  themes: any[];
  users: any[];
  token: string;
}

export default function ActionsView({ cities, themes, users, token }: ActionsViewProps) {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<any>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cityId, setCityId] = useState("");
  const [themeId, setThemeId] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Média");
  const [statusVal, setStatusVal] = useState("Pendente");
  const [expectedResult, setExpectedResult] = useState("");
  const [obtainedResult, setObtainedResult] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/actions/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAction(null);
    setTitle("");
    setDescription("");
    setCityId("");
    setThemeId("");
    setResponsibleUserId("");
    setDeadline("");
    setPriority("Média");
    setStatusVal("Pendente");
    setExpectedResult("");
    setObtainedResult("");
    setNotes("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: any) => {
    setEditingAction(act);
    setTitle(act.title);
    setDescription(act.description);
    setCityId(act.city_id.toString());
    setThemeId(act.theme_id.toString());
    setResponsibleUserId(act.responsible_user_id.toString());
    setDeadline(act.deadline ? new Date(act.deadline).toISOString().slice(0, 16) : "");
    setPriority(act.priority);
    setStatusVal(act.status);
    setExpectedResult(act.expected_result || "");
    setObtainedResult(act.obtained_result || "");
    setNotes(act.notes || "");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !cityId || !themeId || !responsibleUserId || !deadline) {
      setError("Título, Descrição, Cidade, Tema, Responsável e Prazo são obrigatórios.");
      return;
    }

    setError("");
    setFormLoading(true);

    const payload = {
      title,
      description,
      city_id: parseInt(cityId),
      theme_id: parseInt(themeId),
      responsible_user_id: parseInt(responsibleUserId),
      deadline: new Date(deadline).toISOString(),
      priority,
      status: statusVal,
      expected_result: expectedResult || null,
      obtained_result: obtainedResult || null,
      notes: notes || null,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const url = editingAction 
        ? `${apiUrl}/actions/${editingAction.id}` 
        : `${apiUrl}/actions/`;
      const method = editingAction ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Erro ao salvar ação");
      }

      setIsModalOpen(false);
      fetchActions();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar encaminhamento.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este encaminhamento?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/actions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchActions();
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao excluir");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isOverdue = (act: any) => {
    if (act.status === "Concluída" || act.status === "Cancelada") return false;
    return new Date(act.deadline) < new Date();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-slate-800 font-bold text-xl">Ações e Encaminhamentos</h2>
          <p className="text-slate-500 text-xs mt-0.5">Controle de tarefas, resoluções e prazos territoriais</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Nova Ação
        </button>
      </div>

      {/* List of Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          actions.map((act) => {
            const overdue = isOverdue(act);
            return (
              <div 
                key={act.id}
                className={`bg-white border rounded-xl shadow-sm hover:shadow-md p-5 flex flex-col justify-between transition-all duration-150 ${
                  overdue ? "border-red-200" : "border-slate-100"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          act.priority === "Alta" ? "bg-red-50 text-red-700 border border-red-100" :
                          act.priority === "Média" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          Prioridade {act.priority}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base mt-1.5 line-clamp-1">
                        {act.title}
                      </h3>
                    </div>
                    
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      act.status === "Concluída" ? "bg-emerald-100 text-emerald-800" :
                      overdue ? "bg-red-100 text-red-800 animate-pulse" : "bg-slate-100 text-slate-700"
                    }`}>
                      {overdue ? "Atrasada" : act.status}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {act.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className={overdue ? "text-red-650 font-bold" : ""}>
                        Prazo: {new Date(act.deadline).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{act.city?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{act.theme?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{act.responsible_user?.name || "Não designado"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-5 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleOpenEdit(act)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 rounded text-slate-500 text-xs font-semibold transition-all duration-150"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar / Detalhes
                  </button>
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="flex items-center justify-center p-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded text-slate-400 transition-all duration-150"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        {!loading && actions.length === 0 && (
          <div className="col-span-2 text-center text-slate-450 italic py-16 text-sm">
            Nenhuma ação cadastrada.
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingAction ? `Editar Ação #${editingAction.id}` : "Registrar Novo Encaminhamento"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-semibold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Título da Ação *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ex: Oficiar Novacap para manutenção asfáltica"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Descrição do que será feito *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={2}
                  placeholder="Descreva as etapas técnicas do encaminhamento..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Região Administrativa *
                  </label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="">Selecione a cidade</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Tema da Ação *
                  </label>
                  <select
                    value={themeId}
                    onChange={(e) => setThemeId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="">Selecione o tema</option>
                    {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Responsável Interno *
                  </label>
                  <select
                    value={responsibleUserId}
                    onChange={(e) => setResponsibleUserId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="">Selecione o responsável</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Prazo Limite *
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Prioridade da Tarefa
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-105 pt-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Situação/Status
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Aguardando terceiro">Aguardando terceiro</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Resultado Esperado
                  </label>
                  <input
                    type="text"
                    value={expectedResult}
                    onChange={(e) => setExpectedResult(e.target.value)}
                    placeholder="Ex: Buraco tapado e via sinalizada"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Resultado Obtido
                </label>
                <textarea
                  value={obtainedResult}
                  onChange={(e) => setObtainedResult(e.target.value)}
                  rows={2}
                  placeholder="Relatório final após conclusão..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Notas Internas
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações complementares..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm transition-colors duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm shadow-sm transition-colors duration-150 disabled:opacity-50"
                >
                  {formLoading ? "Salvando..." : "Salvar Ação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
