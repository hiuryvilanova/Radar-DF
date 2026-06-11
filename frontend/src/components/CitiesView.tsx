// --- CitiesView.tsx ---
"use client";
import React, { useState } from "react";
import { Plus, Edit2, Trash2, MapPin, CheckCircle, XCircle } from "lucide-react";

interface CitiesViewProps {
  cities: any[];
  users: any[];
  currentUser: any;
  token: string;
  onRefresh: () => void;
}

export default function CitiesView({ cities, users, currentUser, token, onRefresh }: CitiesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [region, setRegion] = useState("Central");
  const [description, setDescription] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState<string>("");
  const [strategicPriority, setStrategicPriority] = useState("Média");
  const [status, setStatus] = useState(true);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUser?.role?.name === "Administrador";

  const openCreateModal = () => {
    setEditingCity(null);
    setName("");
    setRegion("Central");
    setDescription("");
    setResponsibleUserId("");
    setStrategicPriority("Média");
    setStatus(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (city: any) => {
    setEditingCity(city);
    setName(city.name);
    setRegion(city.region);
    setDescription(city.description || "");
    setResponsibleUserId(city.responsible_user_id?.toString() || "");
    setStrategicPriority(city.strategic_priority || "Média");
    setStatus(city.status);
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name,
      region,
      description,
      responsible_user_id: responsibleUserId ? parseInt(responsibleUserId) : null,
      strategic_priority: strategicPriority,
      status
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const url = editingCity 
        ? `${apiUrl}/cities/${editingCity.id}` 
        : `${apiUrl}/cities/`;
      const method = editingCity ? "PUT" : "POST";

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
        throw new Error(data.detail || "Erro ao salvar cidade");
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta cidade? Esta ação é irreversível.")) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/cities/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao excluir cidade");
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-slate-800 font-bold text-xl">Cidades / Regiões Administrativas</h2>
          <p className="text-slate-500 text-xs mt-0.5">Gerenciamento territorial do Distrito Federal</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150"
          >
            <Plus className="w-4 h-4" />
            Nova RA
          </button>
        )}
      </div>

      {/* Grid of Cities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map((city) => (
          <div 
            key={city.id} 
            className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md p-5 flex flex-col justify-between transition-all duration-150"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-slate-800 text-base">{city.name}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  city.status ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {city.status ? "Ativo" : "Inativo"}
                </span>
              </div>
              
              <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed min-h-[32px]">
                {city.description || "Sem descrição cadastrada."}
              </p>

              <div className="border-t border-slate-50 pt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Região do DF:</span>
                  <span className="font-semibold text-slate-700">{city.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Responsável Interno:</span>
                  <span className="font-semibold text-slate-700">
                    {city.responsible_user?.name || "Não atribuído"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prioridade Estratégica:</span>
                  <span className={`font-semibold ${
                    city.strategic_priority === "Alta" ? "text-red-600" : 
                    city.strategic_priority === "Média" ? "text-amber-600" : "text-blue-600"
                  }`}>{city.strategic_priority}</span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex gap-2 mt-5 border-t border-slate-50 pt-3">
                <button
                  onClick={() => openEditModal(city)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 rounded text-slate-500 text-xs font-semibold transition-all duration-150"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(city.id)}
                  className="flex items-center justify-center p-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded text-slate-400 transition-all duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingCity ? "Editar Região Administrativa" : "Nova Região Administrativa"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-semibold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1">
                  Nome da Cidade / Região Administrativa *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Ceilândia"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all duration-150"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1">
                    Região do DF *
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all duration-150"
                  >
                    <option value="Central">Central</option>
                    <option value="Oeste">Oeste</option>
                    <option value="Centro-Sul">Centro-Sul</option>
                    <option value="Norte">Norte</option>
                    <option value="Sul">Sul</option>
                    <option value="Leste">Leste</option>
                    <option value="Sudoeste">Sudoeste</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1">
                    Prioridade Estratégica
                  </label>
                  <select
                    value={strategicPriority}
                    onChange={(e) => setStrategicPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all duration-150"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1">
                  Responsável Interno
                </label>
                <select
                  value={responsibleUserId}
                  onChange={(e) => setResponsibleUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all duration-150"
                >
                  <option value="">Nenhum designado</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role?.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Informações adicionais ou notas estratégicas..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all duration-150 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="status" className="text-slate-700 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Região Ativa no Monitoramento
                </label>
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
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm shadow-sm transition-colors duration-150 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
