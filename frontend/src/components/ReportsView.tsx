// --- ReportsView.tsx ---
"use client";
import React, { useState } from "react";
import { FileSpreadsheet, Download, Calendar, MapPin, Tag, Search, BarChart2 } from "lucide-react";

interface ReportsViewProps {
  cities: any[];
  themes: any[];
  users: any[];
  token: string;
}

export default function ReportsView({ cities, themes, users, token }: ReportsViewProps) {
  // Filter States
  const [filterCityId, setFilterCityId] = useState("");
  const [filterThemeId, setFilterThemeId] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterResponsibleId, setFilterResponsibleId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null);

  const handleExport = async (format: "xlsx" | "csv") => {
    setExporting(format);
    try {
      const queryParams = new URLSearchParams({
        format_type: format
      });
      if (filterCityId) queryParams.append("city_id", filterCityId);
      if (filterThemeId) queryParams.append("theme_id", filterThemeId);
      if (filterPriority) queryParams.append("priority", filterPriority);
      if (filterStatus) queryParams.append("status", filterStatus);
      if (filterSource) queryParams.append("source", filterSource);
      if (filterResponsibleId) queryParams.append("responsible_user_id", filterResponsibleId);
      if (searchTerm) queryParams.append("search", searchTerm);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/reports/export?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erro ao exportar dados.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_demandas.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Erro ao realizar exportação.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-slate-800 font-bold text-xl">Relatórios e Exportações</h2>
        <p className="text-slate-500 text-xs mt-0.5">Filtros avançados e extração de dados estruturados</p>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <BarChart2 className="w-5 h-5 text-emerald-600" />
          Filtros de Exportação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1.5">Buscar por Palavra-chave</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca em títulos/descrições..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 pl-8 pr-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1.5">Cidade / RA</label>
            <select
              value={filterCityId}
              onChange={(e) => setFilterCityId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 outline-none"
            >
              <option value="">Todas as Cidades</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1.5">Tema Principal</label>
            <select
              value={filterThemeId}
              onChange={(e) => setFilterThemeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 outline-none"
            >
              <option value="">Todos os Temas</option>
              {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1.5">Prioridade</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 outline-none"
            >
              <option value="">Todas as Prioridades</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1.5">Status da Demanda</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 outline-none"
            >
              <option value="">Todos os Status</option>
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
            <label className="block text-slate-500 font-semibold mb-1.5">Origem da Informação</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 outline-none"
            >
              <option value="">Todas as Origens</option>
              <option value="Reunião">Reunião</option>
              <option value="Atendimento">Atendimento</option>
              <option value="Visita de campo">Visita de campo</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Planilha importada">Planilha importada</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1.5">Responsável Interno</label>
            <select
              value={filterResponsibleId}
              onChange={(e) => setFilterResponsibleId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 outline-none"
            >
              <option value="">Todos os Responsáveis</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
          <button
            onClick={() => handleExport("xlsx")}
            disabled={exporting !== null}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {exporting === "xlsx" ? "Exportando..." : "Exportar Planilha Excel (XLSX)"}
          </button>
          
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {exporting === "csv" ? "Exportando..." : "Exportar Planilha CSV"}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-500 text-xs leading-relaxed max-w-2xl">
        <b>Dica Estratégica:</b> Utilize os filtros acima para extrair subconjuntos específicos de dados territoriais. 
        Os relatórios exportados incluem os nomes e contatos de solicitantes (com verificação de consentimento de contato) e o score sugerido RDF, 
        sendo ideais para apresentar diagnósticos locais em audiências ou visitas de equipe.
      </div>
    </div>
  );
}
