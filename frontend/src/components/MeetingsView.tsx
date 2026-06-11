// --- MeetingsView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, CheckCircle, Clock } from "lucide-react";

interface MeetingsViewProps {
  cities: any[];
  users: any[];
  token: string;
}

export default function MeetingsView({ cities, users, token }: MeetingsViewProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [meetingDatetime, setMeetingDatetime] = useState("");
  const [location, setLocation] = useState("");
  const [meetingType, setMeetingType] = useState("Comunidade");
  const [summary, setSummary] = useState("");
  const [discussedThemes, setDiscussedThemes] = useState("");
  const [identifiedDemands, setIdentifiedDemands] = useState("");
  const [forwardings, setForwardings] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [statusVal, setStatusVal] = useState("Realizada");

  // Participants form state
  const [participants, setParticipants] = useState<any[]>([]);
  const [pName, setPName] = useState("");
  const [pContact, setPContact] = useState("");
  const [pRole, setPRole] = useState("");

  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/meetings/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setTitle("");
    setCityId("");
    setNeighborhood("");
    setMeetingDatetime("");
    setLocation("");
    setMeetingType("Comunidade");
    setSummary("");
    setDiscussedThemes("");
    setIdentifiedDemands("");
    setForwardings("");
    setResponsibleUserId("");
    setReturnDate("");
    setStatusVal("Realizada");
    setParticipants([]);
    setPName("");
    setPContact("");
    setPRole("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (meet: any) => {
    setEditingMeeting(meet);
    setTitle(meet.title);
    setCityId(meet.city_id.toString());
    setNeighborhood(meet.neighborhood || "");
    // Format ISO string to datetime-local format (YYYY-MM-DDThh:mm)
    const formattedDate = meet.meeting_datetime ? new Date(meet.meeting_datetime).toISOString().slice(0, 16) : "";
    setMeetingDatetime(formattedDate);
    setLocation(meet.location || "");
    setMeetingType(meet.meeting_type);
    setSummary(meet.summary || "");
    setDiscussedThemes(meet.discussed_themes || "");
    setIdentifiedDemands(meet.identified_demands || "");
    setForwardings(meet.forwardings || "");
    setResponsibleUserId(meet.responsible_user_id?.toString() || "");
    setReturnDate(meet.return_date ? new Date(meet.return_date).toISOString().slice(0, 10) : "");
    setStatusVal(meet.status);
    setParticipants(meet.participants || []);
    setPName("");
    setPContact("");
    setPRole("");
    setError("");
    setIsModalOpen(true);
  };

  const handleAddParticipant = () => {
    if (!pName.trim()) return;
    setParticipants([...participants, { name: pName, contact: pContact, entity_role: pRole }]);
    setPName("");
    setPContact("");
    setPRole("");
  };

  const handleRemoveParticipant = (idx: number) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !cityId || !meetingDatetime) {
      setError("Título, Cidade e Data são campos obrigatórios.");
      return;
    }

    setError("");
    setFormLoading(true);

    const payload = {
      title,
      city_id: parseInt(cityId),
      neighborhood: neighborhood || null,
      meeting_datetime: new Date(meetingDatetime).toISOString(),
      location: location || null,
      meeting_type: meetingType,
      summary: summary || null,
      discussed_themes: discussedThemes || null,
      identified_demands: identifiedDemands || null,
      forwardings: forwardings || null,
      responsible_user_id: responsibleUserId ? parseInt(responsibleUserId) : null,
      return_date: returnDate ? new Date(returnDate).toISOString() : null,
      status: statusVal,
      participants: participants.map(p => ({
        name: p.name,
        contact: p.contact || null,
        entity_role: p.entity_role || null
      }))
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const url = editingMeeting 
        ? `${apiUrl}/meetings/${editingMeeting.id}` 
        : `${apiUrl}/meetings/`;
      const method = editingMeeting ? "PUT" : "POST";

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
        throw new Error(data.detail || "Erro ao salvar reunião");
      }

      setIsModalOpen(false);
      fetchMeetings();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar reunião.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta reunião?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/meetings/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMeetings();
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao excluir");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-slate-800 font-bold text-xl">Reuniões e Agendas</h2>
          <p className="text-slate-500 text-xs mt-0.5">Gestão de debates, lideranças e pactos territoriais</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Registrar Reunião
        </button>
      </div>

      {/* List of Meetings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          meetings.map((meet) => (
            <div 
              key={meet.id}
              className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md p-5 flex flex-col justify-between transition-all duration-150"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {meet.meeting_type}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base mt-0.5 line-clamp-1">
                      {meet.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    meet.status === "Realizada" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {meet.status}
                  </span>
                </div>

                {meet.summary && (
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {meet.summary}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-650 bg-slate-50 p-3.5 rounded-lg border border-slate-150">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{new Date(meet.meeting_datetime).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{meet.city?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 border-t border-slate-200/60 pt-2 mt-1">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{meet.participants?.length || 0} Participantes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-5 border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleOpenEdit(meet)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 rounded text-slate-500 text-xs font-semibold transition-all duration-150"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar / Ver Detalhes
                </button>
                <button
                  onClick={() => handleDelete(meet.id)}
                  className="flex items-center justify-center p-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded text-slate-400 transition-all duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
        {!loading && meetings.length === 0 && (
          <div className="col-span-2 text-center text-slate-450 italic py-16 text-sm">
            Nenhuma reunião registrada.
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingMeeting ? `Editar Reunião #${editingMeeting.id}` : "Registrar Nova Reunião"}
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Título da Reunião *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Reunião de Lideranças Comunitárias para Saneamento Básicos"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Cidade / RA *
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
                    Bairro / Localidade
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Setor O"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Data e Hora *
                  </label>
                  <input
                    type="datetime-local"
                    lang="pt-BR"
                    value={meetingDatetime}
                    onChange={(e) => setMeetingDatetime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Local Físico / Endereço
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Auditório da RA ou Quadra 10"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Tipo de Reunião
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="Comunidade">Comunidade</option>
                    <option value="Lideranças">Lideranças</option>
                    <option value="Associação">Associação</option>
                    <option value="Equipe interna">Equipe interna</option>
                    <option value="Institucional">Institucional</option>
                    <option value="Visita técnica">Visita técnica</option>
                    <option value="Agenda pública">Agenda pública</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Situação/Status
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="Realizada">Realizada</option>
                    <option value="Pendente de encaminhamento">Pendente de encaminhamento</option>
                    <option value="Com retorno agendado">Com retorno agendado</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Resumo da Reunião (Pauta/Ata)
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder="Notas gerais da pauta discutida..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Temas Discutidos
                  </label>
                  <input
                    type="text"
                    value={discussedThemes}
                    onChange={(e) => setDiscussedThemes(e.target.value)}
                    placeholder="Ex: Saúde, Segurança (separados por vírgula)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Demandas Identificadas
                  </label>
                  <input
                    type="text"
                    value={identifiedDemands}
                    onChange={(e) => setIdentifiedDemands(e.target.value)}
                    placeholder="Ex: Falta de UBS, Iluminação da passarela"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Participants Subform */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-emerald-600" />
                  Gerenciar Participantes Presentes
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="block text-slate-600 text-[9px] font-bold uppercase tracking-wider">Nome</label>
                    <input
                      type="text"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-3 text-xs outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[9px] font-bold uppercase tracking-wider">Contato</label>
                    <input
                      type="text"
                      value={pContact}
                      onChange={(e) => setPContact(e.target.value)}
                      placeholder="(61) 98888-8888"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-3 text-xs outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-slate-600 text-[9px] font-bold uppercase tracking-wider">Entidade/Cargo</label>
                      <input
                        type="text"
                        value={pRole}
                        onChange={(e) => setPRole(e.target.value)}
                        placeholder="Ex: Liderança Local"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1.5 px-3 text-xs outline-none transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 h-[32px] self-end"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* List of active participants */}
                <div className="max-h-24 overflow-y-auto space-y-1.5 border border-slate-100 p-2.5 rounded-lg bg-slate-50 text-xs">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 p-1.5 rounded shadow-sm">
                      <span className="font-semibold text-slate-700">
                        {p.name} {p.contact ? `(${p.contact})` : ""} {p.entity_role ? `— ${p.entity_role}` : ""}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveParticipant(idx)} 
                        className="text-red-500 hover:text-red-700 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div className="text-slate-400 italic text-[11px] text-center">Nenhum participante adicionado.</div>
                  )}
                </div>
              </div>

              {/* Responsible user & forwardings */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Encaminhamentos / Pactos Prometidos
                  </label>
                  <input
                    type="text"
                    value={forwardings}
                    onChange={(e) => setForwardings(e.target.value)}
                    placeholder="Ex: Enviar ofício para a Novacap em 5 dias"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Data Prevista Retorno
                  </label>
                  <input
                    type="date"
                    lang="pt-BR"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
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
                  {formLoading ? "Salvando..." : "Salvar Reunião"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
