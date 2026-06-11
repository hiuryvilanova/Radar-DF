// --- ThemesView.tsx ---
"use client";
import React, { useState, useMemo } from "react";
import { 
  Folder, Tag, PlusCircle, Plus, Trash2, HelpCircle, 
  Activity, GraduationCap, Shield, Car, Hammer, Briefcase, 
  Home, Heart, Leaf, FileText, Sparkles, X, ChevronRight, Loader2
} from "lucide-react";

interface ThemesViewProps {
  themes: any[];
  token: string;
  onRefresh: () => void;
  currentUser: any;
}

const IconMap: Record<string, React.ComponentType<any>> = {
  Activity,
  GraduationCap,
  Shield,
  Car,
  Hammer,
  Briefcase,
  Home,
  Heart,
  Leaf,
  FileText,
  Folder
};

const PRESET_COLORS = [
  { name: "Vermelho", hex: "#ef4444" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Verde", hex: "#10b981" },
  { name: "Laranja", hex: "#f97316" },
  { name: "Roxo", hex: "#8b5cf6" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Ciano", hex: "#06b6d4" },
  { name: "Teal", hex: "#14b8a6" }
];

export default function ThemesView({ themes, token, onRefresh, currentUser }: ThemesViewProps) {
  const [themeName, setThemeName] = useState("");
  const [themeColor, setThemeColor] = useState("#3b82f6");
  const [themeIcon, setThemeIcon] = useState("Folder");
  const [themeDescription, setThemeDescription] = useState("");
  
  // Inline subtheme state per card
  const [activeInlineThemeId, setActiveInlineThemeId] = useState<number | null>(null);
  const [inlineSubthemeName, setInlineSubthemeName] = useState("");
  
  // Traditional sidebar states
  const [selectedThemeId, setSelectedThemeId] = useState<number | "">("");
  const [subthemeName, setSubthemeName] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inlineLoading, setInlineLoading] = useState(false);

  const isAdmin = currentUser?.role?.name === "Administrador";

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeName) return;

    setError("");
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/themes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: themeName,
          color: themeColor,
          icon: themeIcon,
          description: themeDescription,
          status: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao criar tema");

      setThemeName("");
      setThemeDescription("");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar tema.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubtheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThemeId || !subthemeName) return;

    setError("");
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/themes/subthemes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          theme_id: selectedThemeId,
          name: subthemeName,
          description: `Subtema de ${themes.find(t => t.id === selectedThemeId)?.name}`,
          status: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao criar subtema");

      setSubthemeName("");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar subtema.");
    } finally {
      setLoading(false);
    }
  };

  // Inline Subtheme submit
  const handleCreateSubthemeInline = async (themeId: number) => {
    if (!inlineSubthemeName.trim()) return;

    setError("");
    setInlineLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const themeNameText = themes.find(t => t.id === themeId)?.name || "";
      const res = await fetch(`${apiUrl}/themes/subthemes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          theme_id: themeId,
          name: inlineSubthemeName.trim(),
          description: `Subtema de ${themeNameText}`,
          status: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao criar subtema");

      setInlineSubthemeName("");
      setActiveInlineThemeId(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar subtema.");
      alert(err.message || "Erro ao criar subtema.");
    } finally {
      setInlineLoading(false);
    }
  };

  const handleDeleteTheme = async (id: number) => {
    if (!window.confirm("A exclusão do tema excluirá permanentemente todos os subtemas vinculados. Deseja prosseguir?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/themes/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Erro ao excluir tema");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSubtheme = async (id: number) => {
    if (!window.confirm("Deseja excluir este subtema?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/themes/subthemes/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Erro ao excluir subtema");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 font-sans">
      {/* Themes display & list */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h2 className="text-slate-800 font-bold text-xl">Temas e Subtemas</h2>
          <p className="text-slate-500 text-xs mt-0.5">Categorização e classificação estratégica de demandas e reuniões</p>
        </div>

        {/* Responsive Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pr-2">
          {themes.map((theme) => {
            const ThemeIcon = IconMap[theme.icon] || Folder;
            
            return (
              <div 
                key={theme.id}
                className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Header Info */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center shrink-0" 
                        style={{ backgroundColor: theme.color || "#3b82f6" }}
                      >
                        <ThemeIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight truncate max-w-[170px]" title={theme.name}>
                          {theme.name}
                        </h3>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                          {theme.subthemes.length} subtemas vinculados
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteTheme(theme.id)}
                        className="p-1 text-slate-400 hover:text-red-650 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0"
                        title="Excluir tema e subtemas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed italic flex-1">
                    &ldquo;{theme.description || "Sem descrição cadastrada."}&rdquo;
                  </p>
                  
                  {/* Inline subtheme input field (Admin only) */}
                  {isAdmin && (
                    <div className="mt-4 pt-3 border-t border-slate-100/70">
                      {activeInlineThemeId === theme.id ? (
                        <div className="flex items-center gap-2 animate-fadeIn">
                          <input
                            type="text"
                            value={inlineSubthemeName}
                            onChange={(e) => setInlineSubthemeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateSubthemeInline(theme.id);
                              if (e.key === "Escape") {
                                setActiveInlineThemeId(null);
                                setInlineSubthemeName("");
                              }
                            }}
                            placeholder="Nome do subtema..."
                            autoFocus
                            className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-1 px-2.5 text-xs outline-none text-slate-800 transition-all duration-150"
                          />
                          <button
                            onClick={() => handleCreateSubthemeInline(theme.id)}
                            disabled={inlineLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md text-xs font-semibold"
                          >
                            {inlineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar"}
                          </button>
                          <button
                            onClick={() => {
                              setActiveInlineThemeId(null);
                              setInlineSubthemeName("");
                            }}
                            className="text-slate-400 hover:text-slate-650 p-1 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveInlineThemeId(theme.id);
                            setInlineSubthemeName("");
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors duration-150"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Subtema
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Subthemes tags footer */}
                <div 
                  className="p-3.5 bg-slate-50 border-t border-slate-100/60 flex flex-wrap gap-1.5"
                >
                  {theme.subthemes.map((sub: any) => (
                    <span 
                      key={sub.id}
                      className="inline-flex items-center gap-1 bg-white border text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm/50"
                      style={{
                        backgroundColor: `${theme.color}0a`, // ~4% opacity
                        borderColor: `${theme.color}25`, // ~15% opacity
                        color: theme.color || "#475569"
                      }}
                    >
                      <Tag className="w-2.5 h-2.5 opacity-60 shrink-0" />
                      {sub.name}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteSubtheme(sub.id)}
                          className="opacity-40 hover:opacity-100 hover:text-red-600 font-bold ml-1 text-[8px]"
                          title="Remover subtema"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                  {theme.subthemes.length === 0 && (
                    <span className="text-slate-450 text-[10px] italic">Nenhum subtema cadastrado.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forms Sidebar (Admin Only) */}
      <div className="space-y-6">
        {isAdmin ? (
          <>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                {error}
              </div>
            )}

            {/* Create Theme Form */}
            <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-50">
                <PlusCircle className="w-4.5 h-4.5 text-emerald-600" />
                Criar Novo Tema
              </h3>
              
              <form onSubmit={handleCreateTheme} className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Nome do Tema *
                  </label>
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    required
                    placeholder="Ex: Habitação"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-1.5 px-3 text-slate-800 text-xs outline-none transition-all duration-150"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Paleta de Cores Padrão
                  </label>
                  <div className="grid grid-cols-8 gap-1.5 mb-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setThemeColor(c.hex)}
                        title={c.name}
                        className="w-6 h-6 rounded-full border border-white hover:scale-110 transition-transform flex items-center justify-center shadow-sm"
                        style={{ 
                          backgroundColor: c.hex,
                          outline: themeColor === c.hex ? `2px solid ${c.hex}` : 'none',
                          outlineOffset: '2px'
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-8 h-8 p-0 border border-slate-200 rounded-lg cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-1 px-2.5 text-slate-800 text-xs outline-none uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Ícone Representativo
                  </label>
                  <select
                    value={themeIcon}
                    onChange={(e) => setThemeIcon(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-1.5 px-2 text-slate-800 text-xs outline-none transition-all duration-150"
                  >
                    <option value="Folder">Padrão (Pasta)</option>
                    <option value="Activity">Saúde (Activity)</option>
                    <option value="GraduationCap">Educação (Cap)</option>
                    <option value="Shield">Segurança (Shield)</option>
                    <option value="Car">Mobilidade (Car)</option>
                    <option value="Hammer">Infraestrutura (Hammer)</option>
                    <option value="Briefcase">Emprego (Briefcase)</option>
                    <option value="Home">Habitação (Home)</option>
                    <option value="Heart">Ação Social (Heart)</option>
                    <option value="Leaf">Meio Ambiente (Leaf)</option>
                    <option value="FileText">Regularização (File)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Descrição do Tema
                  </label>
                  <textarea
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    placeholder="Resumo das demandas cobertas por este tema..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-1.5 px-3 text-slate-800 text-xs outline-none transition-all duration-150 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm transition-colors duration-150 flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar Novo Tema"}
                </button>
              </form>
            </div>

            {/* Create Subtheme Form */}
            <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-50">
                <PlusCircle className="w-4.5 h-4.5 text-emerald-600" />
                Criar Subtema (Global)
              </h3>
              
              <form onSubmit={handleCreateSubtheme} className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Tema Pai Vinculado *
                  </label>
                  <select
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value === "" ? "" : parseInt(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-1.5 px-2 text-slate-800 text-xs outline-none transition-all duration-150"
                  >
                    <option value="">Selecione o tema principal</option>
                    {themes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    Nome do Subtema *
                  </label>
                  <input
                    type="text"
                    value={subthemeName}
                    onChange={(e) => setSubthemeName(e.target.value)}
                    required
                    placeholder="Ex: UBS, Creche, Asfalto..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-1.5 px-3 text-slate-800 text-xs outline-none transition-all duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedThemeId}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs shadow-sm transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar Subtema"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="bg-slate-550/5 border border-slate-200/50 p-5 rounded-2xl text-slate-500 text-xs text-center leading-relaxed backdrop-blur-sm">
            <HelpCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            Somente usuários com perfil de <strong>Administrador</strong> possuem permissão para criar, alterar cores ou remover temas e subtemas da taxonomia do Radar DF.
          </div>
        )}
      </div>
    </div>
  );
}
