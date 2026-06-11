// --- AttendancesView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, MapPin, Tag, User, Phone } from "lucide-react";

interface AttendancesViewProps {
  cities: any[];
  themes: any[];
  users: any[];
  token: string;
}

export default function AttendancesView({ cities, themes, users, token }: AttendancesViewProps) {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);

  // Form Fields
  const [attendanceType, setAttendanceType] = useState("Cidadão");
  const [attendanceDatetime, setAttendanceDatetime] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [personOrEntityName, setPersonOrEntityName] = useState("");
  const [contact, setContact] = useState("");
  const [mainThemeId, setMainThemeId] = useState("");
  const [description, setDescription] = useState("");
  const [statusVal, setStatusVal] = useState("Pendente");
  const [nextReturnDate, setNextReturnDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");

  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/attendances/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAttendance(null);
    setAttendanceType("Cidadão");
    setAttendanceDatetime(new Date().toISOString().slice(0, 16));
    setCityId("");
    setNeighborhood("");
    setPersonOrEntityName("");
    setContact("");
    setMainThemeId("");
    setDescription("");
    setStatusVal("Pendente");
    setNextReturnDate("");
    setInternalNotes("");
    setResponsibleUserId("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (att: any) => {
    setEditingAttendance(att);
    setAttendanceType(att.attendance_type);
    setAttendanceDatetime(att.attendance_datetime ? new Date(att.attendance_datetime).toISOString().slice(0, 16) : "");
    setCityId(att.city_id.toString());
    setNeighborhood(att.neighborhood || "");
    setPersonOrEntityName(att.person_or_entity_name);
    setContact(att.contact || "");
    setMainThemeId(att.main_theme_id.toString());
    setDescription(att.description);
    setStatusVal(att.status);
    setNextReturnDate(att.next_return_date ? new Date(att.next_return_date).toISOString().slice(0, 10) : "");
    setInternalNotes(att.internal_notes || "");
    setResponsibleUserId(att.responsible_user_id?.toString() || "");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personOrEntityName || !cityId || !mainThemeId || !description) {
      setError("Solicitante, Cidade, Tema e Descrição são campos obrigatórios.");
      return;
    }

    setError("");
    setFormLoading(true);

    const payload = {
      attendance_type: attendanceType,
      attendance_datetime: new Date(attendanceDatetime).toISOString(),
      city_id: parseInt(cityId),
      neighborhood: neighborhood || null,
      person_or_entity_name: personOrEntityName,
      contact: contact || null,
      main_theme_id: parseInt(mainThemeId),
      description,
      status: statusVal,
      next_return_date: nextReturnDate ? new Date(nextReturnDate).toISOString() : null,
      internal_notes: internalNotes || null,
      responsible_user_id: responsibleUserId ? parseInt(responsibleUserId) : null,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const url = editingAttendance 
        ? `${apiUrl}/attendances/${editingAttendance.id}` 
        : `${apiUrl}/attendances/`;
      const method = editingAttendance ? "PUT" : "POST";

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
        throw new Error(data.detail || "Erro ao salvar atendimento");
      }

      setIsModalOpen(false);
      fetchAttendances();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar atendimento.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este atendimento?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/attendances/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAttendances();
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
          <h2 className="text-slate-800 font-bold text-xl">Atendimentos ao Cidadão</h2>
          <p className="text-slate-500 text-xs mt-0.5">Gestão de acolhimento individual, lideranças e coletivos</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Registrar Atendimento
        </button>
      </div>

      {/* List of Attendances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          attendances.map((att) => (
            <div 
              key={att.id}
              className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md p-5 flex flex-col justify-between transition-all duration-150"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Atendimento — {att.attendance_type}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base mt-0.5 flex items-center gap-1.5">
                      <User className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                      {att.person_or_entity_name}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    att.status === "Concluído" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {att.status}
                  </span>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                  {att.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{new Date(att.attendance_datetime).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{att.city?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{att.theme?.name}</span>
                  </div>
                  {att.contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{att.contact}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-5 border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleOpenEdit(att)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 rounded text-slate-500 text-xs font-semibold transition-all duration-150"
                >
                  Editar / Detalhes
                </button>
                <button
                  onClick={() => handleDelete(att.id)}
                  className="flex items-center justify-center p-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded text-slate-400 transition-all duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
        {!loading && attendances.length === 0 && (
          <div className="col-span-2 text-center text-slate-450 italic py-16 text-sm">
            Nenhum atendimento registrado.
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-8">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingAttendance ? `Editar Atendimento #${editingAttendance.id}` : "Registrar Novo Atendimento"}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Nome do Solicitante / Entidade *
                  </label>
                  <input
                    type="text"
                    value={personOrEntityName}
                    onChange={(e) => setPersonOrEntityName(e.target.value)}
                    required
                    placeholder="Ex: Maria José da Silva ou Associação X"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Contato (Telefone / E-mail)
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Ex: (61) 98765-4321"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Tipo de Atendimento
                  </label>
                  <select
                    value={attendanceType}
                    onChange={(e) => setAttendanceType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="Cidadão">Cidadão</option>
                    <option value="Liderança comunitária">Liderança comunitária</option>
                    <option value="Associação">Associação</option>
                    <option value="Instituição">Instituição</option>
                    <option value="Comerciante">Comerciante</option>
                    <option value="Servidor público">Servidor público</option>
                    <option value="Grupo organizado">Grupo organizado</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Data e Hora
                  </label>
                  <input
                    type="datetime-local"
                    lang="pt-BR"
                    value={attendanceDatetime}
                    onChange={(e) => setAttendanceDatetime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
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
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
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
                    placeholder="Ex: Ceilândia Centro"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Tema Relacionado *
                  </label>
                  <select
                    value={mainThemeId}
                    onChange={(e) => setMainThemeId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="">Selecione o tema</option>
                    {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Relato do Solicitante / Dificuldade relatada *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Relato completo..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-105 pt-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Responsável Interno
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

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Data do Próximo Retorno
                  </label>
                  <input
                    type="date"
                    lang="pt-BR"
                    value={nextReturnDate}
                    onChange={(e) => setNextReturnDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Observações Internas / Encaminhamentos
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Notas estratégicas confidenciais..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all resize-none"
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
                  {formLoading ? "Salvando..." : "Salvar Atendimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
