// --- DemandsView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { 
  Search, Plus, Edit2, Trash2, Copy, MessageSquare, History, 
  MapPin, AlertCircle, User, Check, X, Calendar, CheckSquare 
} from "lucide-react";

interface DemandsViewProps {
  initialCityId?: number | null;
  cities: any[];
  themes: any[];
  users: any[];
  currentUser: any;
  token: string;
}

export default function DemandsView({ initialCityId, cities, themes, users, currentUser, token }: DemandsViewProps) {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filterCityId, setFilterCityId] = useState<string>(initialCityId?.toString() || "");
  const [filterThemeId, setFilterThemeId] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterResponsibleId, setFilterResponsibleId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<any>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [themeId, setThemeId] = useState("");
  const [subthemeId, setSubthemeId] = useState("");
  const [source, setSource] = useState("WhatsApp");
  const [priority, setPriority] = useState("Média");
  const [statusVal, setStatusVal] = useState("Nova");
  
  // Requestor fields (LGPD compliant)
  const [requesterName, setRequesterName] = useState("");
  const [requesterContact, setRequesterContact] = useState("");
  const [entityName, setEntityName] = useState("");
  const [approximateAddress, setApproximateAddress] = useState("");
  const [consentContact, setConsentContact] = useState(false);
  const [strategicNote, setStrategicNote] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [parentDemandId, setParentDemandId] = useState("");
  const [suggestedSecretariat, setSuggestedSecretariat] = useState("");
  
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Comments State
  const [activeCommentsDemand, setActiveCommentsDemand] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  
  // History State
  const [activeHistoryDemand, setActiveHistoryDemand] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const isAdmin = currentUser?.role?.name === "Administrador";

  useEffect(() => {
    fetchDemands();
  }, [filterCityId, filterThemeId, filterPriority, filterStatus, filterSource, filterResponsibleId, searchTerm]);

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterCityId) queryParams.append("city_id", filterCityId);
      if (filterThemeId) queryParams.append("theme_id", filterThemeId);
      if (filterPriority) queryParams.append("priority", filterPriority);
      if (filterStatus) queryParams.append("status", filterStatus);
      if (filterSource) queryParams.append("source", filterSource);
      if (filterResponsibleId) queryParams.append("responsible_user_id", filterResponsibleId);
      if (searchTerm) queryParams.append("search", searchTerm);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demands/?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDemands(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDemand(null);
    setTitle("");
    setDescription("");
    setCityId("");
    setNeighborhood("");
    setThemeId("");
    setSubthemeId("");
    setSource("WhatsApp");
    setPriority("Média");
    setStatusVal("Nova");
    setRequesterName("");
    setRequesterContact("");
    setEntityName("");
    setApproximateAddress("");
    setConsentContact(false);
    setStrategicNote("");
    setResponsibleUserId("");
    setParentDemandId("");
    setSuggestedSecretariat("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (demand: any) => {
    setEditingDemand(demand);
    setTitle(demand.title);
    setDescription(demand.description);
    setCityId(demand.city_id.toString());
    setNeighborhood(demand.neighborhood || "");
    setThemeId(demand.theme_id.toString());
    setSubthemeId(demand.subtheme_id?.toString() || "");
    setSource(demand.source);
    setPriority(demand.priority);
    setStatusVal(demand.status);
    setRequesterName(demand.requester_name || "");
    setRequesterContact(demand.requester_contact || "");
    setEntityName(demand.entity_name || "");
    setApproximateAddress(demand.approximate_address || "");
    setConsentContact(demand.consent_contact || false);
    setStrategicNote(demand.strategic_note || "");
    setResponsibleUserId(demand.responsible_user_id?.toString() || "");
    setParentDemandId(demand.parent_demand_id?.toString() || "");
    setSuggestedSecretariat(demand.suggested_secretariat || "");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId || !themeId) {
      setError("Cidade e Tema são obrigatórios.");
      return;
    }

    setError("");
    setFormLoading(true);

    const payload = {
      title,
      description,
      city_id: parseInt(cityId),
      neighborhood: neighborhood || null,
      theme_id: parseInt(themeId),
      subtheme_id: subthemeId ? parseInt(subthemeId) : null,
      source,
      priority,
      status: statusVal,
      requester_name: requesterName || null,
      requester_contact: requesterContact || null,
      entity_name: entityName || null,
      approximate_address: approximateAddress || null,
      consent_contact: consentContact,
      strategic_note: strategicNote || null,
      responsible_user_id: responsibleUserId ? parseInt(responsibleUserId) : null,
      parent_demand_id: parentDemandId ? parseInt(parentDemandId) : null,
      suggested_secretariat: suggestedSecretariat || null,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const url = editingDemand 
        ? `${apiUrl}/demands/${editingDemand.id}` 
        : `${apiUrl}/demands/`;
      const method = editingDemand ? "PUT" : "POST";

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
        throw new Error(data.detail || "Erro ao salvar demanda");
      }

      setIsModalOpen(false);
      fetchDemands();
    } catch (err: any) {
      setError(err.message || "Erro ao enviar formulário.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente arquivar/excluir esta demanda?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demands/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDemands();
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao excluir");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDuplicate = async (demand: any) => {
    if (!window.confirm(`Deseja duplicar a demanda "${demand.title}"?`)) return;
    try {
      const payload = {
        title: `${demand.title} (Cópia)`,
        description: demand.description,
        city_id: demand.city_id,
        neighborhood: demand.neighborhood,
        theme_id: demand.theme_id,
        subtheme_id: demand.subtheme_id,
        source: demand.source,
        priority: demand.priority,
        status: "Nova",
        requester_name: demand.requester_name,
        requester_contact: demand.requester_contact,
        entity_name: demand.entity_name,
        approximate_address: demand.approximate_address,
        consent_contact: demand.consent_contact,
        strategic_note: demand.strategic_note,
        responsible_user_id: demand.responsible_user_id
      };
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demands/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchDemands();
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao duplicar");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Comments handling
  const fetchComments = async (demandId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demands/${demandId}/comments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeCommentsDemand) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demands/${activeCommentsDemand.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment })
      });
      if (res.ok) {
        setNewComment("");
        fetchComments(activeCommentsDemand.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Audit History handling
  const fetchHistory = async (demandId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demands/${demandId}/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get active subthemes for selected theme in form
  const activeSubthemes = themes.find(t => t.id.toString() === themeId)?.subthemes || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-slate-800 font-bold text-xl">Demandas Públicas</h2>
          <p className="text-slate-500 text-xs mt-0.5">Central de inteligência, organização e triagem</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Demanda
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 font-semibold mb-1">Buscar termo</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 pl-7 pr-2 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Cidade/RA</label>
          <select
            value={filterCityId}
            onChange={(e) => setFilterCityId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2 outline-none"
          >
            <option value="">Todas</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Tema</label>
          <select
            value={filterThemeId}
            onChange={(e) => setFilterThemeId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2 outline-none"
          >
            <option value="">Todos</option>
            {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Prioridade</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2 outline-none"
          >
            <option value="">Todas</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
            <option value="Crítica">Crítica</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2 outline-none"
          >
            <option value="">Todos</option>
            <option value="Nova">Nova</option>
            <option value="Em análise">Em análise</option>
            <option value="Encaminhada">Encaminhada</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando retorno">Aguardando retorno</option>
            <option value="Respondida">Respondida</option>
            <option value="Concluída">Concluída</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Origem</label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2 outline-none"
          >
            <option value="">Todas</option>
            <option value="Reunião">Reunião</option>
            <option value="Atendimento">Atendimento</option>
            <option value="Visita de campo">Visita de campo</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Planilha importada">Planilha importada</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Responsável</label>
          <select
            value={filterResponsibleId}
            onChange={(e) => setFilterResponsibleId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-2 outline-none"
          >
            <option value="">Todos</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Demands Table / Card List */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-4 w-12">ID</th>
                  <th className="p-4">Demanda</th>
                  <th className="p-4">Região / Cidade</th>
                  <th className="p-4">Tema / Subtema</th>
                  <th className="p-4">Prioridade</th>
                  <th className="p-4">Score RDF</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {demands.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="p-4 font-bold text-slate-400">#{d.id}</td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                        {d.title}
                        {d.parent_demand_id && (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded" title={`Duplicada da demanda #${d.parent_demand_id}`}>
                            Duplicada
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 mt-0.5 line-clamp-1">{d.description}</div>
                      {d.suggested_secretariat && (
                        <div className="text-emerald-700 text-[10px] mt-1 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          {d.suggested_secretariat}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{d.city?.name}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{d.neighborhood || "Todo território"}</div>
                    </td>
                    <td className="p-4">
                      <span 
                        className="inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: d.theme?.color || "#cbd5e1" }}
                      >
                        {d.theme?.name}
                      </span>
                      {d.subtheme && (
                        <div className="text-slate-500 text-[10px] mt-1">{d.subtheme?.name}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded ${
                        d.priority === "Crítica" || d.priority === "Urgente" ? "bg-red-100 text-red-800" :
                        d.priority === "Alta" ? "bg-orange-100 text-orange-800" :
                        d.priority === "Média" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {d.priority}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${
                          d.suggested_priority_score > 75 ? "text-red-600" : 
                          d.suggested_priority_score > 50 ? "text-orange-600" : "text-slate-600"
                        }`}>{d.suggested_priority_score}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${
                        d.status === "Concluída" ? "text-emerald-600" :
                        d.status === "Nova" ? "text-blue-600" :
                        d.status === "Em andamento" ? "text-purple-600" : "text-slate-600"
                      }`}>{d.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 rounded text-slate-500 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(d)}
                          className="p-1.5 border border-slate-200 hover:border-blue-600 hover:text-blue-600 rounded text-slate-500 transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveCommentsDemand(d);
                            setComments([]);
                            fetchComments(d.id);
                          }}
                          className="p-1.5 border border-slate-200 hover:border-purple-650 hover:text-purple-650 rounded text-slate-500 transition-colors relative"
                          title="Comentários"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveHistoryDemand(d);
                            setHistoryLogs([]);
                            fetchHistory(d.id);
                          }}
                          className="p-1.5 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 rounded text-slate-500 transition-colors"
                          title="Histórico de alterações"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded text-slate-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {demands.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-450 italic">
                      Nenhuma demanda encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE/EDIT DEMAND MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingDemand ? `Editar Demanda #${editingDemand.id}` : "Registrar Nova Demanda"}
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

              {/* Title & Description */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Título da Demanda *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Buraco profundo no asfalto da via principal"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Descrição Detalhada *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Descreva a dificuldade relatada pela população de forma detalhada..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* City & Neighborhood */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Cidade / Região Administrativa *
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
                    Bairro / Quadra / Localidade
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Setor O, QNO 15"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Theme & Subtheme */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Tema Principal *
                  </label>
                  <select
                    value={themeId}
                    onChange={(e) => {
                      setThemeId(e.target.value);
                      setSubthemeId(""); // Reset subtheme
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="">Selecione o tema</option>
                    {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Subtema
                  </label>
                  <select
                    value={subthemeId}
                    onChange={(e) => setSubthemeId(e.target.value)}
                    disabled={!themeId}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Selecione o subtema</option>
                    {activeSubthemes.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Priority, Status, Source, Responsible */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="Nova">Nova</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Encaminhada">Encaminhada</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Aguardando retorno">Aguardando retorno</option>
                    <option value="Respondida">Respondida</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Arquivada">Arquivada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Origem
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Atendimento">Atendimento</option>
                    <option value="Visita de campo">Visita de campo</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Rede social">Rede social</option>
                    <option value="Planilha importada">Planilha importada</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Responsável
                  </label>
                  <select
                    value={responsibleUserId}
                    onChange={(e) => setResponsibleUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="">Não designado</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Roteamento e Agrupamento */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Inteligência Territorial</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Secretaria Responsável (Sugestão IA)
                    </label>
                    <input
                      type="text"
                      value={suggestedSecretariat}
                      onChange={(e) => setSuggestedSecretariat(e.target.value)}
                      placeholder="Sugerida automaticamente pelo sistema"
                      className="w-full bg-emerald-50/50 border border-emerald-250 text-emerald-800 font-semibold rounded-lg py-2 px-3 text-xs outline-none"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Calculada automaticamente com base no tema e descrição.</p>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Agrupamento (Demanda Pai)
                    </label>
                    <select
                      value={parentDemandId}
                      onChange={(e) => setParentDemandId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-xs outline-none"
                    >
                      <option value="">Nenhuma (Demanda Principal)</option>
                      {demands
                        .filter(d => !editingDemand || d.id !== editingDemand.id)
                        .map(d => (
                          <option key={d.id} value={d.id}>
                            #{d.id}: {d.title.substring(0, 45)}...
                          </option>
                        ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1">Selecione para agrupar esta demanda sob uma demanda principal já existente.</p>
                  </div>
                </div>
              </div>

              {/* Soliciting Citizen & LGPD Consent */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Dados do Solicitante (LGPD)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Nome do Cidadão
                    </label>
                    <input
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Contato (Telefone / WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={requesterContact}
                      onChange={(e) => setRequesterContact(e.target.value)}
                      placeholder="(61) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Associação / Liderança Comunitária
                    </label>
                    <input
                      type="text"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder="Ex: Associação de Moradores"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Endereço Aproximado
                    </label>
                    <input
                      type="text"
                      value={approximateAddress}
                      onChange={(e) => setApproximateAddress(e.target.value)}
                      placeholder="Ex: Próximo à Escola Classe 04"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Observação Estratégica Interna
                    </label>
                    <input
                      type="text"
                      value={strategicNote}
                      onChange={(e) => setStrategicNote(e.target.value)}
                      placeholder="Notas que não serão compartilhadas publicamente"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentContact}
                    onChange={(e) => setConsentContact(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                  />
                  <label htmlFor="consent" className="text-slate-600 text-xs font-medium cursor-pointer leading-relaxed">
                    O cidadão expressou <b>consentimento formal</b> para contato posterior e acompanhamento de seu relato, 
                    em inteira conformidade com as diretrizes da Lei Geral de Proteção de Dados (LGPD).
                  </label>
                </div>
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
                  {formLoading ? "Salvando..." : "Salvar Demanda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMENTS DRAWER / SIDE OVERLAY */}
      {activeCommentsDemand && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm font-sans">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-100 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Comentários Internos</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[250px]">
                  Demanda #{activeCommentsDemand.id}: {activeCommentsDemand.title}
                </p>
              </div>
              <button 
                onClick={() => setActiveCommentsDemand(null)} 
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
              {comments.map((comm) => {
                const isMe = comm.user_id === currentUser?.id;
                const initials = comm.user?.name
                  ? comm.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                  : "U";
                
                return (
                  <div 
                    key={comm.id} 
                    className={`flex items-start gap-2.5 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {/* Initials Avatar */}
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm ${
                      isMe ? "bg-emerald-600 text-white" : "bg-slate-350 text-slate-700 border border-slate-200"
                    }`}>
                      {initials}
                    </div>

                    {/* Message Bubble */}
                    <div className={`p-3 rounded-2xl shadow-sm border ${
                      isMe 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-900 rounded-tr-none" 
                        : "bg-white border-slate-150 text-slate-800 rounded-tl-none"
                    }`}>
                      <div className="flex justify-between items-baseline gap-4 mb-1 border-b border-slate-100/50 pb-0.5">
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                          {isMe ? "Você" : comm.user?.name}
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">
                          {new Date(comm.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed font-normal whitespace-pre-wrap">
                        {comm.comment}
                      </p>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <div className="text-center text-slate-450 italic py-12 text-xs">
                  Nenhum comentário cadastrado para esta demanda.
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                required
                className="flex-1 bg-white border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-xs outline-none transition-all"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 rounded-lg text-xs transition-all"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT HISTORY DRAWER */}
      {activeHistoryDemand && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm font-sans">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Histórico de Alterações</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 truncate max-w-[250px]">
                  Demanda #{activeHistoryDemand.id}: {activeHistoryDemand.title}
                </p>
              </div>
              <button 
                onClick={() => setActiveHistoryDemand(null)} 
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Changelog list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {historyLogs.map((log) => (
                <div key={log.id} className="border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs bg-white">
                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100 pb-1.5 mb-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {log.user?.name || "Sistema"}
                    </span>
                    <span className="text-slate-400">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  
                  {log.action === "create" && (
                    <div className="text-emerald-600 font-semibold">✓ Demanda criada no sistema.</div>
                  )}
                  {log.action === "delete" && (
                    <div className="text-red-600 font-semibold">✗ Demanda arquivada/excluída.</div>
                  )}
                  {log.action === "update" && (
                    <div className="space-y-1.5">
                      <div className="font-semibold text-slate-700 uppercase text-[9px] tracking-wider">
                        Campo modificado: <span className="text-indigo-600">{log.field_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="space-y-0.5">
                          <div className="text-slate-400 uppercase font-bold text-[8px]">Anterior</div>
                          <div className="text-slate-600 break-all">{log.old_value || "—"}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-emerald-600 uppercase font-bold text-[8px]">Novo</div>
                          <div className="text-slate-800 font-semibold break-all">{log.new_value || "—"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {historyLogs.length === 0 && (
                <div className="text-center text-slate-450 italic py-12 text-xs">
                  Nenhum registro de auditoria encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
