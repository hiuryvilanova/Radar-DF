// --- DossierView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { FileDown, Calendar, MapPin, ShieldAlert, Award, FileText } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface DossierViewProps {
  initialCityId?: number | null;
  cities: any[];
  token: string;
}

export default function DossierView({ initialCityId, cities, token }: DossierViewProps) {
  const [selectedCityId, setSelectedCityId] = useState<string>(initialCityId?.toString() || "");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12); // Default last 12 months for comprehensive reports
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(false);
  const [dossierData, setDossierData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (selectedCityId) {
      fetchDossierPreview();
    }
  }, [selectedCityId, startDate, endDate]);

  const fetchDossierPreview = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        city_id: selectedCityId,
        start_date: startDate,
        end_date: endDate
      });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/dashboard/?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDossierData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedCityId) return;
    setDownloading(true);
    try {
      const queryParams = new URLSearchParams({
        city_id: selectedCityId,
        start_date: startDate,
        end_date: endDate
      });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/reports/dossier?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Erro ao gerar PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const city = cities.find(c => c.id.toString() === selectedCityId);
      const cityName = city ? city.name.replace(" ", "_").toLowerCase() : "cidade";
      a.download = `dossie_${cityName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Erro ao baixar dossiê.");
    } finally {
      setDownloading(false);
    }
  };

  const kpis = dossierData?.kpis || {
    total_demands: 0,
    urgent_demands: 0,
    pending_demands: 0,
    completed_demands: 0,
    meetings_held: 0,
    attendances_registered: 0,
    actions_pending: 0,
    actions_overdue: 0
  };

  const themesData = dossierData?.charts?.demands_by_theme || [];
  const COLORS = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-slate-800 font-bold text-xl">Dossiê da Cidade</h2>
        <p className="text-slate-500 text-xs mt-0.5">Diagnóstico territorial e relatório estratégico em PDF</p>
      </div>

      {/* Selectors Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-slate-500 font-semibold text-xs mb-1.5 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Selecione a Região Administrativa
          </label>
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 text-sm outline-none transition-all"
          >
            <option value="">Selecione uma cidade...</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-slate-500 font-semibold text-xs mb-1.5 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Período Inicial
          </label>
          <input
            type="date"
            lang="pt-BR"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 text-sm outline-none transition-all"
          />
        </div>

        <div className="w-full md:w-48">
          <label className="block text-slate-500 font-semibold text-xs mb-1.5 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Período Final
          </label>
          <input
            type="date"
            lang="pt-BR"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 text-sm outline-none transition-all"
          />
        </div>

        {selectedCityId && (
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150 shrink-0 disabled:opacity-50"
          >
            <FileDown className="w-4.5 h-4.5" />
            {downloading ? "Gerando PDF..." : "Exportar PDF"}
          </button>
        )}
      </div>

      {/* Preview Section */}
      {selectedCityId ? (
        loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* KPI grids & Theme summaries */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Métricas Territoriais da Região
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center space-y-1">
                    <div className="text-slate-550 text-xs font-semibold">Demandas Totais</div>
                    <div className="text-2xl font-bold text-slate-800">{kpis.total_demands}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center space-y-1">
                    <div className="text-red-750 text-xs font-semibold">Críticas / Urgentes</div>
                    <div className="text-2xl font-bold text-red-750">{kpis.urgent_demands}</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center space-y-1">
                    <div className="text-amber-750 text-xs font-semibold">Pendências Ativas</div>
                    <div className="text-2xl font-bold text-amber-750">{kpis.pending_demands}</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg text-center space-y-1">
                    <div className="text-emerald-750 text-xs font-semibold">Encaminhamentos Concluídos</div>
                    <div className="text-2xl font-bold text-emerald-750">{kpis.actions_completed}</div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg text-center space-y-1">
                    <div className="text-indigo-750 text-xs font-semibold">Reuniões Realizadas</div>
                    <div className="text-2xl font-bold text-indigo-750">{kpis.meetings_held}</div>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg text-center space-y-1">
                    <div className="text-rose-750 text-xs font-semibold">Ações Atrasadas</div>
                    <div className="text-2xl font-bold text-rose-750">{kpis.actions_overdue}</div>
                  </div>
                </div>
              </div>

              {/* Strategic Context summary */}
              <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-50 pb-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Diretrizes de Escuta
                </h3>
                <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    Com base no levantamento territorial de demandas, a Região Administrativa selecionada necessita de intervenções estratégicas nas seguintes frentes:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-550">
                    <li>Priorização e suporte das <b>{kpis.urgent_demands} demandas urgentes/críticas</b> identificadas em visitas e audiências.</li>
                    <li>Saneamento dos <b>{kpis.actions_overdue} encaminhamentos que constam como atrasados</b> por parte dos responsáveis.</li>
                    <li>Foco no tema de maior incidência territorial no período (ver distribuição lateral).</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Theme distribution Pie */}
            <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2 mb-4">
                  Distribuição por Temas
                </h3>
                {themesData.length > 0 ? (
                  <div className="h-48 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={themesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="count"
                          nameKey="theme"
                        >
                          {themesData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-12">Nenhum tema classificado.</div>
                )}
              </div>

              <div className="space-y-1.5 text-[11px] max-h-40 overflow-y-auto mt-4 pr-1">
                {themesData.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color || COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-650 truncate max-w-[120px] font-medium">{t.theme}</span>
                    </div>
                    <span className="font-bold text-slate-800">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-100 shadow-sm text-center text-slate-450 italic text-sm">
          Selecione uma Região Administrativa no painel acima para gerar a pré-visualização do diagnóstico territorial.
        </div>
      )}
    </div>
  );
}
