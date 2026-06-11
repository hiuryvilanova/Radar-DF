// --- MapView.tsx ---
"use client";
import React, { useState, useMemo, useEffect } from "react";
import { 
  MapPin, AlertTriangle, FileText, ChevronRight, Search, TrendingUp, 
  User, Activity, Clock, ShieldAlert, ArrowLeft, Loader2, Sparkles, RefreshCw 
} from "lucide-react";

interface MapViewProps {
  metrics: any;
  cities: any[];
  onNavigate: (tab: string, cityId?: number) => void;
}

// Stylized coordinate mappings for DF RAs
const MAP_REGIONS = [
  // Central
  { name: "Brasília", x: 260, y: 190, r: 24, id: 1, zone: "Central" },
  { name: "Cruzeiro", x: 225, y: 185, r: 10, id: 25, zone: "Central" },
  { name: "Sudoeste/Octogonal", x: 215, y: 200, r: 12, id: 26, zone: "Central" },
  { name: "Lago Norte", x: 295, y: 145, r: 16, id: 23, zone: "Central" },
  { name: "Lago Sul", x: 310, y: 245, r: 18, id: 24, zone: "Central" },
  { name: "Varjão", x: 290, y: 170, r: 8, id: 29, zone: "Central" },
  
  // Oeste
  { name: "Ceilândia", x: 90, y: 220, r: 26, id: 2, zone: "Oeste" },
  { name: "Taguatinga", x: 140, y: 210, r: 22, id: 3, zone: "Oeste" },
  { name: "Samambaia", x: 105, y: 265, r: 24, id: 4, zone: "Oeste" },
  { name: "Brazlândia", x: 80, y: 90, r: 22, id: 12, zone: "Oeste" },
  { name: "Vicente Pires", x: 170, y: 195, r: 14, id: 17, zone: "Oeste" },
  { name: "Águas Claras", x: 160, y: 230, r: 16, id: 18, zone: "Oeste" },
  { name: "Sol Nascente/Pôr do Sol", x: 65, y: 235, r: 14, id: 19, zone: "Oeste" },
  { name: "Riacho Fundo II", x: 120, y: 300, r: 16, id: 16, zone: "Oeste" },
  { name: "Arniqueira", x: 180, y: 250, r: 14, id: 32, zone: "Oeste" },

  // Centro-Sul
  { name: "Guará", x: 200, y: 225, r: 18, id: 13, zone: "Centro-Sul" },
  { name: "Núcleo Bandeirante", x: 210, y: 260, r: 12, id: 14, zone: "Centro-Sul" },
  { name: "Riacho Fundo", x: 170, y: 280, r: 14, id: 15, zone: "Centro-Sul" },
  { name: "Estrutural", x: 190, y: 180, r: 10, id: 20, zone: "Centro-Sul" },
  { name: "Park Way", x: 220, y: 295, r: 16, id: 27, zone: "Centro-Sul" },
  { name: "Candangolândia", x: 225, y: 250, r: 10, id: 30, zone: "Centro-Sul" },
  { name: "SCIA", x: 175, y: 170, r: 8, id: 31, zone: "Centro-Sul" },

  // Norte
  { name: "Planaltina", x: 410, y: 65, r: 28, id: 5, zone: "Norte" },
  { name: "Sobradinho", x: 300, y: 95, r: 20, id: 9, zone: "Norte" },
  { name: "Fercal", x: 280, y: 55, r: 14, id: 28, zone: "Norte" },
  { name: "Arapoanga", x: 390, y: 95, r: 16, id: 33, zone: "Norte" },

  // Sul
  { name: "Gama", x: 150, y: 390, r: 24, id: 6, zone: "Sul" },
  { name: "Santa Maria", x: 215, y: 380, r: 22, id: 7, zone: "Sul" },

  // Sudoeste
  { name: "Recanto das Emas", x: 110, y: 340, r: 20, id: 8, zone: "Sudoeste" },

  // Leste
  { name: "São Sebastião", x: 370, y: 290, r: 22, id: 10, zone: "Leste" },
  { name: "Paranoá", x: 380, y: 190, r: 20, id: 11, zone: "Leste" },
  { name: "Itapoã", x: 350, y: 170, r: 14, id: 21, zone: "Leste" },
  { name: "Jardim Botânico", x: 340, y: 270, r: 16, id: 22, zone: "Leste" },
];

const ZONES = ["Todas", "Central", "Oeste", "Centro-Sul", "Norte", "Sul", "Sudoeste", "Leste"];

export default function MapView({ metrics, cities, onNavigate }: MapViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState("Todas");
  
  // HUD mode: count, sla, resolution, priority
  const [mapMode, setMapMode] = useState<"count" | "sla" | "resolution" | "priority">("count");
  const [territorialMetrics, setTerritorialMetrics] = useState<any[]>([]);
  const [territorialLoading, setTerritorialLoading] = useState(false);
  
  // Detailed city metrics fetched on-demand
  const [cityMetrics, setCityMetrics] = useState<any>(null);
  const [cityMetricsLoading, setCityMetricsLoading] = useState(false);

  const fetchTerritorialMetrics = async () => {
    setTerritorialLoading(true);
    try {
      const token = localStorage.getItem("rdf_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/dashboard/territorial`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTerritorialMetrics(data);
      }
    } catch (err) {
      console.error("Erro ao buscar métricas territoriais:", err);
    } finally {
      setTerritorialLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritorialMetrics();
  }, []);

  const mappedRegionsData = useMemo(() => {
    const dataMap: Record<string, any> = {};
    territorialMetrics.forEach((item: any) => {
      dataMap[item.city_name.toLowerCase().trim()] = item;
    });
    return dataMap;
  }, [territorialMetrics]);

  const getRegionMetrics = (name: string) => {
    const key = name.toLowerCase().trim();
    return mappedRegionsData[key] || {
      demand_count: 0,
      avg_sla_days: 0.0,
      resolution_rate: 0.0,
      avg_priority_score: 0.0
    };
  };

  const getRegionLevel = (name: string) => {
    const data = getRegionMetrics(name);
    
    if (mapMode === "count") {
      const val = data.demand_count;
      if (val === 0) return "empty";
      const maxCount = Math.max(...territorialMetrics.map(m => m.demand_count), 1);
      const pct = val / maxCount;
      if (pct < 0.3) return "low";
      if (pct < 0.75) return "medium";
      return "critical";
    }
    
    if (mapMode === "sla") {
      const val = data.avg_sla_days;
      if (val === 0) return "empty";
      if (val < 7.0) return "low";       // green
      if (val < 20.0) return "medium";    // yellow
      return "critical";                 // red
    }
    
    if (mapMode === "resolution") {
      const val = data.resolution_rate;
      const total = data.demand_count;
      if (total === 0) return "empty";
      if (val >= 75.0) return "low";      // green (good resolutivity)
      if (val >= 40.0) return "medium";   // yellow (average)
      return "critical";                 // red (bad resolutivity)
    }
    
    if (mapMode === "priority") {
      const val = data.avg_priority_score;
      if (val === 0) return "empty";
      if (val < 40.0) return "low";       // green
      if (val < 70.0) return "medium";    // yellow
      return "critical";                 // red
    }
    
    return "empty";
  };

  const getRegionCount = (name: string) => {
    return getRegionMetrics(name).demand_count;
  };

  // Fetch individual city details when a node is clicked
  useEffect(() => {
    if (!selectedRegion) {
      setCityMetrics(null);
      return;
    }

    const loadCityMetrics = async () => {
      setCityMetricsLoading(true);
      try {
        const token = localStorage.getItem("rdf_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${apiUrl}/dashboard/?city_id=${selectedRegion.dbId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCityMetrics(data);
        }
      } catch (err) {
        console.error("Erro ao carregar inteligência da Região Administrativa:", err);
      } finally {
        setCityMetricsLoading(false);
      }
    };

    loadCityMetrics();
  }, [selectedRegion]);

  // Find database info for the selected city
  const dbCityInfo = useMemo(() => {
    if (!selectedRegion) return null;
    return cities.find(c => c.id === selectedRegion.dbId);
  }, [selectedRegion, cities]);

  // Filtered and sorted RAs list
  const rankedCities = useMemo(() => {
    return MAP_REGIONS.map(reg => {
      const dbCity = cities.find(c => c.name.toLowerCase().trim() === reg.name.toLowerCase().trim());
      const rMetrics = getRegionMetrics(reg.name);
      return {
        ...reg,
        dbId: dbCity?.id || reg.id,
        count: rMetrics.demand_count,
        avg_sla_days: rMetrics.avg_sla_days,
        resolution_rate: rMetrics.resolution_rate,
        avg_priority_score: rMetrics.avg_priority_score
      };
    })
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesZone = selectedZone === "Todas" || c.zone === selectedZone;
      return matchesSearch && matchesZone;
    })
    .sort((a, b) => b.count - a.count);
  }, [cities, searchTerm, selectedZone, mappedRegionsData]);

  // Highlighted RA with maximum demands
  const busiestCity = useMemo(() => {
    if (!metrics?.charts?.demands_by_city || metrics.charts.demands_by_city.length === 0) return "Nenhuma";
    return metrics.charts.demands_by_city[0].city;
  }, [metrics]);

  const resolutionRate = useMemo(() => {
    if (!metrics?.kpis?.total_demands) return 0;
    return Math.round((metrics.kpis.completed_demands / metrics.kpis.total_demands) * 100);
  }, [metrics]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top High-Tech KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-205">
          <div className="absolute top-[-20%] right-[-10%] w-16 h-16 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demandas Ativas</p>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{metrics?.kpis?.total_demands || 0}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4 relative overflow-hidden group hover:border-rose-500/50 transition-all duration-205">
          <div className="absolute top-[-20%] right-[-10%] w-16 h-16 rounded-full bg-rose-500/5 blur-xl pointer-events-none" />
          <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Críticas & Urgentes</p>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{metrics?.kpis?.urgent_demands || 0}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4 relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-205">
          <div className="absolute top-[-20%] right-[-10%] w-16 h-16 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Taxa de Resolução</p>
            <h3 className="text-xl font-extrabold text-white mt-0.5">{resolutionRate}%</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center gap-4 relative overflow-hidden group hover:border-amber-500/50 transition-all duration-205">
          <div className="absolute top-[-20%] right-[-10%] w-16 h-16 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Foco de Atenção</p>
            <h3 className="text-sm font-extrabold text-white truncate mt-1 w-36" title={busiestCity}>
              {busiestCity}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Console Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Console: Map Frame */}
        <div className="lg:col-span-3 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[550px] relative overflow-hidden text-white">
          {/* Subtle Grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          
          {/* Header Panel */}
          <div className="absolute top-6 left-6 z-10 space-y-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-slate-100 font-bold text-sm tracking-widest uppercase">Radar DF — Monitoramento Territorial</h2>
              </div>
              <p className="text-slate-500 text-[10px] mt-0.5 tracking-wide uppercase">Console tático de demandas do Distrito Federal</p>
            </div>
            
            {/* Map Mode Selector Panel */}
            <div className="flex gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 backdrop-blur">
              <button
                onClick={() => setMapMode("count")}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all ${
                  mapMode === "count" ? "bg-emerald-650 text-white shadow shadow-emerald-950/20" : "text-slate-400 hover:text-white"
                }`}
              >
                Volume (Demandas)
              </button>
              <button
                onClick={() => setMapMode("sla")}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all ${
                  mapMode === "sla" ? "bg-emerald-650 text-white shadow shadow-emerald-950/20" : "text-slate-400 hover:text-white"
                }`}
              >
                SLA Médio
              </button>
              <button
                onClick={() => setMapMode("resolution")}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all ${
                  mapMode === "resolution" ? "bg-emerald-650 text-white shadow shadow-emerald-950/20" : "text-slate-400 hover:text-white"
                }`}
              >
                Taxa de Resolução
              </button>
              <button
                onClick={() => setMapMode("priority")}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all ${
                  mapMode === "priority" ? "bg-emerald-650 text-white shadow shadow-emerald-950/20" : "text-slate-400 hover:text-white"
                }`}
              >
                Score Prioridade
              </button>
            </div>
          </div>

          {/* Zone Selector Header */}
          <div className="absolute top-6 right-6 z-10 flex flex-wrap gap-1 max-w-[320px] justify-end">
            {ZONES.map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all duration-150 ${
                  selectedZone === z 
                    ? "bg-emerald-600 border-emerald-500 text-white shadow animate-pulse" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Interactive SVG Radar Screen */}
          <div className="w-full max-w-[850px] xl:max-w-[980px] aspect-[4/3] mt-6 relative select-none">
            <svg viewBox="0 0 500 450" className="w-full h-full">
              {/* Radar gradients & filters defs */}
              <defs>
                <linearGradient id="radar-sweep-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>

                <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-rose" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                <radialGradient id="grad-empty" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                <radialGradient id="grad-low" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#047857" />
                </radialGradient>
                <radialGradient id="grad-med" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
                <radialGradient id="grad-high" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#be123c" />
                </radialGradient>
              </defs>

              {/* Radar Outer Scope boundary */}
              <circle cx="250" cy="225" r="218" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1.5" />
              <circle cx="250" cy="225" r="222" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="0.5" />
              
              {/* Concentric radar range marks */}
              <circle cx="250" cy="225" r="75" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="250" cy="225" r="145" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Crosshair Lines */}
              <line x1="250" y1="6" x2="250" y2="444" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="31" y1="225" x2="469" y2="225" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="4 4" />

              {/* Sweeping Radar beam with animated rotation */}
              <path d="M250,225 L250,15 A210,210 0 0,1 304.3,22.2 Z" fill="url(#radar-sweep-grad)">
                <animateTransform 
                  attributeName="transform" 
                  type="rotate" 
                  from="0 250 225" 
                  to="360 250 225" 
                  dur="15s" 
                  repeatCount="indefinite" 
                />
              </path>

              {/* Mapped RA Nodes */}
              <g>
                {MAP_REGIONS.map((reg, idx) => {
                  const count = getRegionCount(reg.name);
                  const level = getRegionLevel(reg.name);
                  const isSelected = selectedRegion?.name === reg.name;
                  
                  // Zone Filter Dimming
                  const isInSelectedZone = selectedZone === "Todas" || reg.zone === selectedZone;
                  const filterOpacity = isInSelectedZone ? "opacity-100" : "opacity-10 pointer-events-none";

                  // Define rendering properties based on demand levels
                  let nodeFill = "url(#grad-empty)";
                  let nodeStroke = "#475569";
                  let nodeFilter = undefined;
                  let showOuterPulse = false;

                  if (level === "low") {
                    nodeFill = "url(#grad-low)";
                    nodeStroke = "#10b981";
                    nodeFilter = "url(#glow-emerald)";
                  } else if (level === "medium") {
                    nodeFill = "url(#grad-med)";
                    nodeStroke = "#fbbf24";
                    nodeFilter = "url(#glow-amber)";
                  } else if (level === "critical") {
                    nodeFill = "url(#grad-high)";
                    nodeStroke = "#f43f5e";
                    nodeFilter = "url(#glow-rose)";
                    showOuterPulse = true;
                  }

                  return (
                    <g 
                      key={idx} 
                      className={`cursor-pointer transition-opacity duration-300 ${filterOpacity} group`}
                      onClick={() => {
                        const dbCity = cities.find(c => c.name.toLowerCase().trim() === reg.name.toLowerCase().trim());
                        setSelectedRegion({
                          ...reg,
                          dbId: dbCity?.id || reg.id,
                          count
                        });
                      }}
                    >
                      {/* Critical Pulsing Ring */}
                      {showOuterPulse && (
                        <circle cx={reg.x} cy={reg.y} r={reg.r} fill="none" stroke="#f43f5e" strokeWidth="1.5">
                          <animate attributeName="r" values={`${reg.r}; ${reg.r + 14}`} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.7; 0" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Selected target ring (rotates and blinks) */}
                      {isSelected && (
                        <circle 
                          cx={reg.x} 
                          cy={reg.y} 
                          r={reg.r + 8} 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        >
                          <animateTransform 
                            attributeName="transform" 
                            type="rotate" 
                            from={`0 ${reg.x} ${reg.y}`} 
                            to={`360 ${reg.x} ${reg.y}`} 
                            dur="5s" 
                            repeatCount="indefinite" 
                          />
                        </circle>
                      )}

                      {/* Outer border glow ring for hover */}
                      <circle 
                        cx={reg.x} 
                        cy={reg.y} 
                        r={reg.r + 3} 
                        fill="transparent" 
                        stroke="#10b981" 
                        strokeWidth="1.5"
                        className="opacity-0 group-hover:opacity-40 transition-opacity duration-200"
                      />

                      {/* Base Node Circle */}
                      <circle 
                        cx={reg.x} 
                        cy={reg.y} 
                        r={reg.r} 
                        fill={nodeFill} 
                        stroke={isSelected ? "#10b981" : nodeStroke} 
                        strokeWidth={isSelected ? "2.5" : "1.2"}
                        filter={nodeFilter}
                        className="transition-all duration-200 group-hover:scale-105 group-hover:brightness-110" 
                      />

                      {/* Text Label inside node */}
                      <text 
                        x={reg.x} 
                        y={reg.y + 3} 
                        textAnchor="middle" 
                        fill={count > 0 && level !== "low" ? "#ffffff" : "#cbd5e1"}
                        fontWeight="bold" 
                        fontSize={reg.name.length > 8 ? "6.5" : "8"}
                        className="pointer-events-none font-semibold uppercase tracking-wider"
                      >
                        {reg.name.substring(0, 8)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 text-[10px] text-slate-350 bg-slate-900/95 border border-slate-800 p-3 rounded-lg backdrop-blur">
            <span className="font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Legenda do Radar ({
                mapMode === "count" ? "Volume" :
                mapMode === "sla" ? "SLA/Atraso" :
                mapMode === "resolution" ? "Resolução" : "Score RDF"
              })
            </span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-600" />
              <span>Sem demandas registradas</span>
            </div>
            {mapMode === "count" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400 shadow-[0_0_4px_#10b981]" />
                  <span>Poucas demandas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500 border border-amber-350 shadow-[0_0_5px_#f59e0b]" />
                  <span>Médio volume (Atenção)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-600 border border-rose-450 shadow-[0_0_6px_#f43f5e] animate-pulse" />
                  <span>Volume crítico (Foco)</span>
                </div>
              </>
            )}
            {mapMode === "sla" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400 shadow-[0_0_4px_#10b981]" />
                  <span>Atraso curto (&lt; 7 dias)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500 border border-amber-350 shadow-[0_0_5px_#f59e0b]" />
                  <span>Atraso médio (7 a 20 dias)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-600 border border-rose-450 shadow-[0_0_6px_#f43f5e] animate-pulse" />
                  <span>Atraso crítico (&gt; 20 dias)</span>
                </div>
              </>
            )}
            {mapMode === "resolution" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400 shadow-[0_0_4px_#10b981]" />
                  <span>Alta resolutividade (&gt;= 75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500 border border-amber-350 shadow-[0_0_5px_#f59e0b]" />
                  <span>Resolução média (40% a 75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-600 border border-rose-450 shadow-[0_0_6px_#f43f5e] animate-pulse" />
                  <span>Baixa resolutividade (&lt; 40%)</span>
                </div>
              </>
            )}
            {mapMode === "priority" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400 shadow-[0_0_4px_#10b981]" />
                  <span>Criticidade baixa (&lt; 40)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500 border border-amber-350 shadow-[0_0_5px_#f59e0b]" />
                  <span>Criticidade média (40-70)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-600 border border-rose-450 shadow-[0_0_6px_#f43f5e] animate-pulse" />
                  <span>Criticidade alta (&gt;= 70)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Console: Sidebar HUD / Ranked territorial list */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col h-full min-h-[550px] text-white">
          {!selectedRegion ? (
            // Ranking List Mode
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-100 font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs uppercase tracking-widest font-extrabold">Ranking Territorial</h3>
                </div>
                <div className="text-[10px] bg-slate-800 text-slate-350 px-2 py-0.5 rounded border border-slate-700">
                  {rankedCities.length} RAs
                </div>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-550">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar Região Administrativa..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/30 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white outline-none transition-all duration-150"
                />
              </div>

              {/* Cities scroll list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[390px] custom-scrollbar">
                {rankedCities.map((item, index) => {
                  const level = getRegionLevel(item.name);
                  let pillBg = "bg-slate-950 text-slate-400 border-slate-800";
                  if (level === "low") pillBg = "bg-emerald-950/45 text-emerald-400 border-emerald-900/50";
                  else if (level === "medium") pillBg = "bg-amber-950/45 text-amber-400 border-amber-900/50";
                  else if (level === "critical") pillBg = "bg-rose-950/45 text-rose-455 border-rose-900/50";

                  return (
                    <div 
                      key={index}
                      onClick={() => setSelectedRegion(item)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/30 border border-slate-950 hover:border-emerald-800/85 hover:bg-slate-950/70 cursor-pointer transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-550 w-4 font-mono">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors duration-150 truncate max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${pillBg}`}>
                          {mapMode === "count" && `${item.count} dem.`}
                          {mapMode === "sla" && `${item.avg_sla_days} dias`}
                          {mapMode === "resolution" && `${item.resolution_rate}% res.`}
                          {mapMode === "priority" && `${item.avg_priority_score} pts`}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-450 transition-all duration-150" />
                      </div>
                    </div>
                  );
                })}
                {rankedCities.length === 0 && (
                  <div className="text-center text-slate-550 text-xs py-8">
                    Nenhuma Região Administrativa encontrada.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // HUD City Intelligence Mode
            <div className="flex flex-col h-full animate-fadeIn">
              {/* Back Button */}
              <button 
                onClick={() => setSelectedRegion(null)}
                className="flex items-center gap-1.5 text-[10px] text-slate-450 hover:text-white uppercase tracking-widest font-bold mb-4 border-b border-slate-800 pb-3 transition-colors duration-150"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" /> Voltar ao Ranking
              </button>

              {/* City Title Header */}
              <div className="space-y-1">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-black text-emerald-400 tracking-wider uppercase truncate max-w-[170px]" title={selectedRegion.name}>
                    {selectedRegion.name}
                  </h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-450 rounded">
                    {selectedRegion.zone}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-550 uppercase tracking-widest font-bold">
                  <MapPin className="w-3 h-3 text-slate-500" /> Região Administrativa
                </div>
                {/* Active HUD mode status badge */}
                <div className="pt-1">
                  {mapMode === "count" && (
                    <span className="inline-block text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                      Volume: {getRegionMetrics(selectedRegion.name).demand_count} demandas
                    </span>
                  )}
                  {mapMode === "sla" && (
                    <span className="inline-block text-[9px] text-amber-400 font-extrabold uppercase tracking-wider bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                      SLA Médio: {getRegionMetrics(selectedRegion.name).avg_sla_days} dias pendentes
                    </span>
                  )}
                  {mapMode === "resolution" && (
                    <span className="inline-block text-[9px] text-cyan-400 font-extrabold uppercase tracking-wider bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                      Resolução: {getRegionMetrics(selectedRegion.name).resolution_rate}% concluídas
                    </span>
                  )}
                  {mapMode === "priority" && (
                    <span className="inline-block text-[9px] text-rose-400 font-extrabold uppercase tracking-wider bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                      RDF Score: {getRegionMetrics(selectedRegion.name).avg_priority_score} pts médios
                    </span>
                  )}
                </div>
              </div>

              {/* Coordinator responsible details */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  <User className="w-3 h-3 text-emerald-400" /> Coordenador Geral
                </div>
                <p className="text-xs font-bold text-slate-200">
                  {dbCityInfo?.responsible_user?.name || "Não atribuído"}
                </p>
                <p className="text-[10px] text-slate-500 truncate" title={dbCityInfo?.responsible_user?.email}>
                  {dbCityInfo?.responsible_user?.email || "Configure em 'Cidades'"}
                </p>
                <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-900/50 flex justify-between">
                  <span>Prioridade Estratégica:</span>
                  <span className="font-bold text-emerald-450">{dbCityInfo?.strategic_priority || "Média"}</span>
                </div>
              </div>

              {/* Mapped statistics loaded dynamically */}
              <div className="flex-1 mt-5">
                {cityMetricsLoading ? (
                  <div className="h-48 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Carregando Inteligência...</p>
                  </div>
                ) : cityMetrics ? (
                  <div className="space-y-4">
                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">Total Mapeado</span>
                        <h4 className="text-base font-extrabold text-white mt-0.5">{cityMetrics.kpis.total_demands}</h4>
                      </div>
                      <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wide">Críticas / Urgentes</span>
                        <h4 className="text-base font-extrabold text-rose-400 mt-0.5">{cityMetrics.kpis.urgent_demands}</h4>
                      </div>
                    </div>

                    {/* Progress Bar of Resolution */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Resolução de Demandas</span>
                        <span>
                          {cityMetrics.kpis.total_demands ? Math.round((cityMetrics.kpis.completed_demands / cityMetrics.kpis.total_demands) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded border border-slate-850 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${cityMetrics.kpis.total_demands ? (cityMetrics.kpis.completed_demands / cityMetrics.kpis.total_demands) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${cityMetrics.kpis.total_demands ? (cityMetrics.kpis.pending_demands / cityMetrics.kpis.total_demands) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>{cityMetrics.kpis.completed_demands} Resolvidas</span>
                        <span>{cityMetrics.kpis.pending_demands} Pendentes</span>
                      </div>
                    </div>

                    {/* Top Local Themes list */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Temas Críticos na RA</span>
                      <div className="space-y-1.5">
                        {cityMetrics.charts.demands_by_theme && cityMetrics.charts.demands_by_theme.length > 0 ? (
                          cityMetrics.charts.demands_by_theme.slice(0, 3).map((t: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/30 p-2 rounded border border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || "#10b981" }} />
                                <span className="text-slate-350 font-semibold truncate max-w-[120px]">{t.theme}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded">{t.count}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-slate-550 text-[10px] py-4">
                            Nenhuma demanda mapeada nesta RA.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-550 text-xs">
                    Erro ao carregar dados de inteligência territorial.
                  </div>
                )}
              </div>

              {/* Call-to-action buttons */}
              <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
                <button 
                  onClick={() => onNavigate("demandas", selectedRegion.dbId)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-2.5 rounded text-center text-xs tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
                >
                  <FileText className="w-4 h-4" /> Abrir Painel de Demandas
                </button>
                <button 
                  onClick={() => onNavigate("dossie", selectedRegion.dbId)}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-bold py-2.5 rounded text-center text-xs tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" /> Visualizar Dossiê RA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
