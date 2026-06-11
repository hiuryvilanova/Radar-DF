// --- DashboardView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from "recharts";
import { 
  FileText, AlertTriangle, Clock, CheckCircle2, MapPin, 
  Users, PhoneCall, CheckSquare, Calendar, ChevronRight, RefreshCw
} from "lucide-react";

interface DashboardViewProps {
  metrics: any;
  loading: boolean;
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ metrics, loading, onNavigate }: DashboardViewProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const token = localStorage.getItem("rdf_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/dashboard/activities`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Erro ao carregar feed de atividades:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const kpis = metrics?.kpis || {
    total_demands: 0,
    urgent_demands: 0,
    pending_demands: 0,
    completed_demands: 0,
    cities_monitored: 0,
    meetings_held: 0,
    attendances_registered: 0,
    actions_pending: 0,
    actions_completed: 0,
    actions_overdue: 0
  };

  const charts = metrics?.charts || {
    demands_by_city: [],
    demands_by_theme: [],
    demands_by_priority: [],
    demands_by_status: [],
    meetings_by_city: [],
    attendances_by_city: [],
    actions_by_status: [],
    weekly_evolution: []
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

  const cardData = [
    { 
      title: "Total de Demandas", 
      value: kpis.total_demands, 
      icon: FileText, 
      color: "text-blue-600 bg-blue-50 border-blue-100",
      tab: "demandas"
    },
    { 
      title: "Criticas / Urgentes", 
      value: kpis.urgent_demands, 
      icon: AlertTriangle, 
      color: "text-red-600 bg-red-50 border-red-100",
      tab: "demandas"
    },
    { 
      title: "Demandas Pendentes", 
      value: kpis.pending_demands, 
      icon: Clock, 
      color: "text-amber-600 bg-amber-50 border-amber-100",
      tab: "demandas"
    },
    { 
      title: "Demandas Concluídas", 
      value: kpis.completed_demands, 
      icon: CheckCircle2, 
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      tab: "demandas"
    },
    { 
      title: "Cidades Monitoradas", 
      value: kpis.cities_monitored, 
      icon: MapPin, 
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      tab: "cidades"
    },
    { 
      title: "Reuniões Realizadas", 
      value: kpis.meetings_held, 
      icon: Users, 
      color: "text-teal-600 bg-teal-50 border-teal-100",
      tab: "reunioes"
    },
    { 
      title: "Atendimentos", 
      value: kpis.attendances_registered, 
      icon: PhoneCall, 
      color: "text-cyan-600 bg-cyan-50 border-cyan-100",
      tab: "atendimentos"
    },
    { 
      title: "Encaminhamentos Pendentes", 
      value: kpis.actions_pending, 
      icon: CheckSquare, 
      color: "text-purple-600 bg-purple-50 border-purple-100",
      tab: "acoes"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((c, i) => (
          <div
            key={i}
            onClick={() => onNavigate(c.tab)}
            className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group"
          >
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                {c.title}
              </span>
              <div className="text-3xl font-bold text-slate-800 tracking-tight">
                {c.value}
              </div>
            </div>
            <div className={`p-3 rounded-lg border transition-all duration-200 group-hover:scale-110 ${c.color}`}>
              <c.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Red Alert Card for Overdue Actions */}
      {kpis.actions_overdue > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl text-red-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Ações em Atraso Identificadas</h4>
              <p className="text-xs text-red-700 mt-0.5">
                Existem {kpis.actions_overdue} ações/encaminhamentos com prazos vencidos.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate("acoes")}
            className="flex items-center gap-1 text-xs font-bold bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg transition-colors duration-150"
          >
            Visualizar
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demands by City */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-slate-800 font-bold text-base mb-6">
            Volume de Demandas por Região Administrativa (RA)
          </h3>
          <div className="h-80">
            {charts.demands_by_city.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.demands_by_city} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="city" angle={-30} textAnchor="end" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Nenhuma demanda registrada.
              </div>
            )}
          </div>
        </div>

        {/* Demands by Theme */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-slate-800 font-bold text-base mb-6">
            Demandas por Tema Principal
          </h3>
          <div className="h-80 flex flex-col md:flex-row items-center">
            {charts.demands_by_theme.length > 0 ? (
              <>
                <div className="w-full md:w-3/5 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.demands_by_theme}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="theme"
                      >
                        {charts.demands_by_theme.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-2/5 max-h-full overflow-y-auto space-y-2 mt-4 md:mt-0 text-xs">
                  {charts.demands_by_theme.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }} 
                        />
                        <span className="text-slate-600 font-medium truncate max-w-[120px]">{entry.theme}</span>
                      </div>
                      <span className="text-slate-800 font-bold">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">
                Nenhum tema registrado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Evolution */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-slate-800 font-bold text-base mb-6">
            Evolução Semanal de Novas Demandas (Últimas 8 Semanas)
          </h3>
          <div className="h-72">
            {charts.weekly_evolution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.weekly_evolution}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Sem dados de histórico.
              </div>
            )}
          </div>
        </div>

        {/* Actions Status / Situation */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-slate-800 font-bold text-base mb-6">
            Situação das Ações e Encaminhamentos
          </h3>
          <div className="h-72 flex flex-col justify-center items-center">
            {kpis.actions_pending + kpis.actions_completed > 0 ? (
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={charts.actions_by_status}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="count"
                      nameKey="status"
                    >
                      <Cell fill="#10b981" /> {/* Concluídas */}
                      <Cell fill="#f59e0b" /> {/* Pendentes */}
                      <Cell fill="#ef4444" /> {/* Atrasadas */}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Nenhuma ação/encaminhamento cadastrado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Activity Feed */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-3 flex flex-col max-h-[380px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-slate-800 font-bold text-base">
                Feed de Atividades em Tempo Real (Logs de Auditoria)
              </h3>
            </div>
            <button 
              onClick={fetchActivities}
              disabled={activitiesLoading}
              className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activitiesLoading ? 'animate-spin' : ''}`} />
              Atualizar Feed
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[280px] custom-scrollbar">
            {activitiesLoading && activities.length === 0 ? (
              <div className="flex justify-center items-center h-32 text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mr-2" />
                Carregando atividades...
              </div>
            ) : activities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {activities.map((act) => {
                  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                  if (act.action === "create") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  if (act.action === "update") badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                  if (act.action === "delete") badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                  
                  return (
                    <div key={act.id} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-start">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-800 font-bold text-xs">{act.user}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                            {act.action_text}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">
                            {act.entity_text} #{act.entity_id}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-auto font-medium">
                            {new Date(act.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-normal mt-0.5">
                          {act.details ? (
                            <>Alterou o {act.details}</>
                          ) : (
                            <>{act.action_text} o registro correspondente no sistema</>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                Nenhuma atividade recente registrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
