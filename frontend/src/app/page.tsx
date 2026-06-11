// --- page.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Map, MapPin, Tags, FileText, PhoneCall, 
  Users, CheckSquare, FileSpreadsheet, BarChart2, Shield, 
  History, Settings, LogOut, Bell, Calendar, User as UserIcon,
  Menu, X
} from "lucide-react";

// Views
import LoginView from "../components/LoginView";
import ResetPasswordView from "../components/ResetPasswordView";
import DashboardView from "../components/DashboardView";
import MapView from "../components/MapView";
import CitiesView from "../components/CitiesView";
import ThemesView from "../components/ThemesView";
import DemandsView from "../components/DemandsView";
import MeetingsView from "../components/MeetingsView";
import AttendancesView from "../components/AttendancesView";
import ActionsView from "../components/ActionsView";
import DossierView from "../components/DossierView";
import ImportsView from "../components/ImportsView";
import ReportsView from "../components/ReportsView";
import UsersView from "../components/UsersView";
import LogsView from "../components/LogsView";
import SettingsView from "../components/SettingsView";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [initialCityId, setInitialCityId] = useState<number | null>(null); // For links from map

  // Global Lists for shared dropdowns
  const [cities, setCities] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Dashboard Metrics state
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Global Dashboard Filter States
  const [dashStartDate, setDashStartDate] = useState("");
  const [dashEndDate, setDashEndDate] = useState("");
  const [dashCityId, setDashCityId] = useState("");
  const [dashThemeId, setDashThemeId] = useState("");
  const [dashPriority, setDashPriority] = useState("");
  const [dashStatus, setDashStatus] = useState("");

  // Loading state
  const [appLoading, setAppLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notification Drawer states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [overdueActions, setOverdueActions] = useState<any[]>([]);
  const [criticalDemands, setCriticalDemands] = useState<any[]>([]);
  const [importSummaries, setImportSummaries] = useState<any[]>([]);

  const fetchNotificationDetails = async () => {
    if (!token) return;
    setNotificationsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      
      // 1. Fetch actions
      const resActions = await fetch(`${apiUrl}/actions/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resActions.ok) {
        const actionsData = await resActions.json();
        const now = new Date();
        const overdue = actionsData.filter((a: any) => 
          (a.status === "Pendente" || a.status === "Em andamento") && 
          new Date(a.deadline) < now
        );
        setOverdueActions(overdue.slice(0, 5));
      }

      // 2. Fetch demands
      const resDemands = await fetch(`${apiUrl}/demands/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resDemands.ok) {
        const demandsData = await resDemands.json();
        const critical = demandsData.filter((d: any) => 
          (d.priority === "Crítica" || d.priority === "Urgente") && 
          (d.status === "Nova" || d.status === "Em análise")
        );
        setCriticalDemands(critical.slice(0, 5));
      }

      // 3. Fetch imports
      const resImports = await fetch(`${apiUrl}/imports/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resImports.ok) {
        const importsData = await resImports.json();
        setImportSummaries(importsData.slice(0, 5));
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes de notificações:", err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (isNotificationOpen) {
      fetchNotificationDetails();
    }
  }, [isNotificationOpen]);

  useEffect(() => {
    // Check local storage for session
    const storedToken = localStorage.getItem("rdf_token");
    const storedStatus = localStorage.getItem("rdf_status");
    if (storedToken) {
      setToken(storedToken);
      setUserStatus(storedStatus);
    } else {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchGlobalLists();
    }
  }, [token]);

  useEffect(() => {
    if (token && (activeTab === "dashboard" || activeTab === "mapa")) {
      fetchDashboardMetrics();
    }
  }, [token, activeTab, dashStartDate, dashEndDate, dashCityId, dashThemeId, dashPriority, dashStatus]);

  const fetchCurrentUser = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        setUserStatus(data.status);
      } else {
        // Token expired/invalid
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAppLoading(false);
    }
  };

  const fetchGlobalLists = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      // Fetch Cities
      const resCities = await fetch(`${apiUrl}/cities/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resCities.ok) setCities(await resCities.json());

      // Fetch Themes
      const resThemes = await fetch(`${apiUrl}/themes/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resThemes.ok) setThemes(await resThemes.json());

      // Fetch Users
      const resUsers = await fetch(`${apiUrl}/users/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resUsers.ok) setUsers(await resUsers.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardMetrics = async () => {
    setMetricsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (dashStartDate) queryParams.append("start_date", dashStartDate);
      if (dashEndDate) queryParams.append("end_date", dashEndDate);
      if (dashCityId) queryParams.append("city_id", dashCityId);
      if (dashThemeId) queryParams.append("theme_id", dashThemeId);
      if (dashPriority) queryParams.append("priority", dashPriority);
      if (dashStatus) queryParams.append("status", dashStatus);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/dashboard/?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleLoginSuccess = (jwtToken: string, status: string) => {
    localStorage.setItem("rdf_token", jwtToken);
    localStorage.setItem("rdf_status", status);
    setToken(jwtToken);
    setUserStatus(status);
  };

  const handlePasswordResetSuccess = () => {
    localStorage.setItem("rdf_status", "active");
    setUserStatus("active");
    fetchCurrentUser();
  };

  const handleLogout = () => {
    localStorage.removeItem("rdf_token");
    localStorage.removeItem("rdf_status");
    setToken(null);
    setUserStatus(null);
    setCurrentUser(null);
    setActiveTab("dashboard");
  };

  const handleNavigateFromMap = (tab: string, cityId?: number) => {
    if (cityId) {
      setInitialCityId(cityId);
    } else {
      setInitialCityId(null);
    }
    setActiveTab(tab);
  };

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // --- UNAUTHENTICATED ROUTE ---
  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // --- FIRST-TIME PASSWORD RESET MANDATORY ROUTE ---
  if (userStatus === "pending_password_change") {
    return (
      <ResetPasswordView 
        token={token} 
        onPasswordResetSuccess={handlePasswordResetSuccess} 
      />
    );
  }

  const isAdmin = currentUser?.role?.name === "Administrador";

  // Navigation config
  const navItems = [
    { id: "dashboard", label: "Painel Geral", icon: LayoutDashboard, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "mapa", label: "Mapa de Demandas", icon: Map, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "demandas", label: "Demandas", icon: FileText, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "atendimentos", label: "Atendimentos", icon: PhoneCall, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "reunioes", label: "Reuniões", icon: Users, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "acoes", label: "Ações e Encaminhamentos", icon: CheckSquare, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "dossie", label: "Dossiê da Cidade", icon: MapPin, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "importacao", label: "Importação", icon: FileSpreadsheet, roles: ["Administrador", "Coordenador"] },
    { id: "relatorios", label: "Relatórios", icon: BarChart2, roles: ["Administrador", "Coordenador"] },
    { id: "cidades", label: "Cidades / RAs", icon: MapPin, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "temas", label: "Temas e Subtemas", icon: Tags, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
    { id: "usuarios", label: "Usuários", icon: Shield, roles: ["Administrador"] },
    { id: "logs", label: "Logs de Auditoria", icon: History, roles: ["Administrador"] },
    { id: "configuracoes", label: "Configurações", icon: Settings, roles: ["Administrador", "Coordenador", "Operador", "Visualizador"] },
  ];

  const currentTabLabel = navItems.find(item => item.id === activeTab)?.label || "Radar DF";

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans relative overflow-x-hidden">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR PANEL */}
      <aside className={`w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col justify-between shrink-0 select-none fixed inset-y-0 left-0 z-40 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                <span className="font-black text-sm tracking-widest">RDF</span>
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">Radar DF</h1>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-1">
                  Inteligência Territorial
                </span>
              </div>
            </div>
            {/* Close button for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 md:hidden"
              title="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const hasRole = item.roles.includes(currentUser?.role?.name || "Visualizador");
              if (!hasRole) return null;
              
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false); // Close on mobile navigation click
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                    isSelected 
                      ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/20" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className={`w-4.5 h-4.5 ${isSelected ? "text-white" : "text-slate-550"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/25">
          <div className="flex items-center gap-2.5 p-1">
            <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-white truncate leading-none">{currentUser?.name}</p>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1 block">
                {currentUser?.role?.name}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800/40 hover:bg-red-900/10 border border-slate-800 hover:border-red-900/35 hover:text-red-400 rounded-lg py-2 text-xs font-semibold text-slate-400 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex justify-between items-center shrink-0 shadow-sm relative z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 md:hidden"
              title="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-slate-800 text-base">{currentTabLabel}</h2>
          </div>

          {/* Header Actions / Bell Notifications */}
          <div className="flex items-center gap-4">
            <div 
              className="relative cursor-pointer text-slate-550 hover:text-slate-700 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
              title="Notificações e Alertas"
              onClick={() => setIsNotificationOpen(true)}
            >
              <Bell className={`w-5 h-5 ${metrics?.kpis?.actions_overdue > 0 ? "text-red-500 animate-swing" : "text-slate-550"}`} />
              {metrics?.kpis?.actions_overdue > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="text-slate-400 text-xs hidden md:block">
              {new Date().toLocaleDateString("pt-BR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Dynamic Filters header only on Dashboard or Map */}
        {(activeTab === "dashboard" || activeTab === "mapa") && (
          <div className="bg-white border-b border-slate-100 px-8 py-3.5 flex flex-wrap gap-4 items-end text-xs relative z-10 shadow-sm/50">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Início</label>
              <input
                type="date"
                value={dashStartDate}
                onChange={(e) => setDashStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2.5 outline-none text-[11px]"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Fim</label>
              <input
                type="date"
                value={dashEndDate}
                onChange={(e) => setDashEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2.5 outline-none text-[11px]"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Região/RA</label>
              <select
                value={dashCityId}
                onChange={(e) => setDashCityId(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 outline-none text-[11px]"
              >
                <option value="">Todas</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Tema</label>
              <select
                value={dashThemeId}
                onChange={(e) => setDashThemeId(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 outline-none text-[11px]"
              >
                <option value="">Todos</option>
                {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Prioridade</label>
              <select
                value={dashPriority}
                onChange={(e) => setDashPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 outline-none text-[11px]"
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
                value={dashStatus}
                onChange={(e) => setDashStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2 outline-none text-[11px]"
              >
                <option value="">Todos</option>
                <option value="Nova">Nova</option>
                <option value="Em análise">Em análise</option>
                <option value="Encaminhada">Encaminhada</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>

            <button
              onClick={() => {
                setDashStartDate("");
                setDashEndDate("");
                setDashCityId("");
                setDashThemeId("");
                setDashPriority("");
                setDashStatus("");
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-3 py-1 rounded-lg text-[10px] transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* VIEW SCROLLER BODY */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === "dashboard" && (
            <DashboardView 
              metrics={metrics} 
              loading={metricsLoading} 
              onNavigate={handleNavigateFromMap} 
            />
          )}

          {activeTab === "mapa" && (
            <MapView 
              metrics={metrics} 
              cities={cities} 
              onNavigate={handleNavigateFromMap} 
            />
          )}

          {activeTab === "demandas" && (
            <DemandsView 
              initialCityId={initialCityId}
              cities={cities} 
              themes={themes} 
              users={users} 
              currentUser={currentUser} 
              token={token} 
            />
          )}

          {activeTab === "atendimentos" && (
            <AttendancesView 
              cities={cities} 
              themes={themes} 
              users={users} 
              token={token} 
            />
          )}

          {activeTab === "reunioes" && (
            <MeetingsView 
              cities={cities} 
              users={users} 
              token={token} 
            />
          )}

          {activeTab === "acoes" && (
            <ActionsView 
              cities={cities} 
              themes={themes} 
              users={users} 
              token={token} 
            />
          )}

          {activeTab === "dossie" && (
            <DossierView 
              initialCityId={initialCityId}
              cities={cities} 
              token={token} 
            />
          )}

          {activeTab === "importacao" && (
            <ImportsView 
              token={token} 
              onRefresh={fetchGlobalLists} 
            />
          )}

          {activeTab === "relatorios" && (
            <ReportsView 
              cities={cities} 
              themes={themes} 
              users={users} 
              token={token} 
            />
          )}

          {activeTab === "cidades" && (
            <CitiesView 
              cities={cities} 
              users={users} 
              currentUser={currentUser} 
              token={token} 
              onRefresh={fetchGlobalLists} 
            />
          )}

          {activeTab === "temas" && (
            <ThemesView 
              themes={themes} 
              token={token} 
              onRefresh={fetchGlobalLists} 
              currentUser={currentUser} 
            />
          )}

          {activeTab === "usuarios" && (
            <UsersView 
              currentUser={currentUser} 
              token={token} 
            />
          )}

          {activeTab === "logs" && (
            <LogsView 
              currentUser={currentUser} 
              token={token} 
            />
          )}

          {activeTab === "configuracoes" && (
            <SettingsView 
              currentUser={currentUser} 
              token={token} 
            />
          )}
        </main>
      </div>

      {/* NOTIFICATION DRAWER / SIDE OVERLAY */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm font-sans">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-100 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-widest">Painel de Alertas e Notificações</h3>
              </div>
              <button 
                onClick={() => setIsNotificationOpen(false)} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar">
              {notificationsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Buscando alertas...</span>
                </div>
              ) : (
                <>
                  {/* Overdue Actions Section */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1 flex justify-between">
                      <span>Ações Vencidas ({overdueActions.length})</span>
                      {overdueActions.length > 0 && <span className="text-red-505 font-extrabold animate-pulse">Atenção</span>}
                    </h4>
                    {overdueActions.length > 0 ? (
                      <div className="space-y-2">
                        {overdueActions.map((act) => (
                          <div 
                            key={act.id} 
                            onClick={() => {
                              setActiveTab("acoes");
                              setIsNotificationOpen(false);
                            }}
                            className="bg-white border border-red-100 hover:border-red-300 p-3.5 rounded-xl shadow-sm cursor-pointer transition-all duration-150 group"
                          >
                            <div className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-600">{act.title}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{act.description}</div>
                            <div className="text-[10px] text-red-650 font-bold mt-1.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                              Prazo: {new Date(act.deadline).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-450 text-xs italic py-2">Nenhuma ação com prazo vencido.</div>
                    )}
                  </div>

                  {/* Critical Demands Section */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">
                      Críticas & Urgentes Novas ({criticalDemands.length})
                    </h4>
                    {criticalDemands.length > 0 ? (
                      <div className="space-y-2">
                        {criticalDemands.map((dem) => (
                          <div 
                            key={dem.id} 
                            onClick={() => {
                              setActiveTab("demandas");
                              setIsNotificationOpen(false);
                            }}
                            className="bg-white border border-amber-100 hover:border-amber-300 p-3.5 rounded-xl shadow-sm cursor-pointer transition-all duration-150 group"
                          >
                            <div className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-600">#{dem.id}: {dem.title}</div>
                            <div className="text-[10px] text-slate-455 truncate mt-0.5">{dem.description}</div>
                            <div className="flex gap-2 mt-2.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-md">
                                {dem.priority}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-50 border border-slate-150 text-slate-500 rounded-md">
                                {dem.city?.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-455 text-xs italic py-2">Nenhuma demanda crítica nova pendente.</div>
                    )}
                  </div>

                  {/* Import Summaries Section */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">
                      Relatórios de Importações ({importSummaries.length})
                    </h4>
                    {importSummaries.length > 0 ? (
                      <div className="space-y-2">
                        {importSummaries.map((imp) => (
                          <div 
                            key={imp.id} 
                            onClick={() => {
                              setActiveTab("importacao");
                              setIsNotificationOpen(false);
                            }}
                            className="bg-white border border-slate-200 hover:border-slate-350 p-3.5 rounded-xl shadow-sm cursor-pointer transition-all duration-150 group"
                          >
                            <div className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-600">{imp.file_name}</div>
                            <div className="flex justify-between text-[10px] text-slate-550 mt-2 border-t border-slate-100/50 pt-1.5">
                              <span>Status: <b className={imp.status === "Sucesso" ? "text-emerald-600" : "text-amber-605"}>{imp.status}</b></span>
                              <span>Linhas: <b>{imp.total_rows}</b> (Erros: <b className="text-red-600">{imp.error_rows}</b>)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-455 text-xs italic py-2">Nenhuma importação no histórico.</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button 
                onClick={() => setIsNotificationOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase shadow-sm transition-colors duration-150"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
