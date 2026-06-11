// --- UsersView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, User, Check, X } from "lucide-react";

interface UsersViewProps {
  currentUser: any;
  token: string;
}

export default function UsersView({ currentUser, token }: UsersViewProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [statusVal, setStatusVal] = useState("active");

  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const isAdmin = currentUser?.role?.name === "Administrador";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchRoles();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/users/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/users/roles`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRoleId("");
    setStatusVal("active");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(""); // Keep password blank unless changing
    setRoleId(user.role_id.toString());
    setStatusVal(user.status);
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !roleId) {
      setError("Nome, E-mail e Perfil são obrigatórios.");
      return;
    }
    if (!editingUser && !password) {
      setError("Senha é obrigatória para novos usuários.");
      return;
    }

    setError("");
    setFormLoading(true);

    const payload: any = {
      name,
      email,
      role_id: parseInt(roleId),
      status: statusVal
    };
    if (password) {
      payload.password = password;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const url = editingUser 
        ? `${apiUrl}/users/${editingUser.id}` 
        : `${apiUrl}/users/`;
      const method = editingUser ? "PUT" : "POST";

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
        throw new Error(data.detail || "Erro ao salvar usuário");
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar usuário.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser.id) {
      alert("Você não pode excluir a sua própria conta.");
      return;
    }
    if (!window.confirm("Deseja realmente excluir este usuário?")) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao excluir");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 italic text-sm">
        Permissão Negada. Somente usuários administradores podem acessar a gestão de perfis e operadores.
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-slate-800 font-bold text-xl">Usuários e Permissões</h2>
          <p className="text-slate-500 text-xs mt-0.5">Gerenciamento de credenciais, logs e níveis de acesso (RBAC)</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Users Table */}
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
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Perfil</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Último Login</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {u.name}
                    </td>
                    <td className="p-4 text-slate-500">{u.email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        {u.role?.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${
                        u.status === "active" ? "text-emerald-600" :
                        u.status === "pending_password_change" ? "text-amber-600" : "text-red-500"
                      }`}>
                        {u.status === "active" ? "Ativo" : 
                         u.status === "pending_password_change" ? "P. Senha" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {u.last_login ? new Date(u.last_login).toLocaleString("pt-BR") : "Nunca logou"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 rounded text-slate-500 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 border border-slate-200 hover:border-red-600 hover:text-red-600 rounded text-slate-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingUser ? `Editar Usuário: ${editingUser.name}` : "Novo Operador de Equipe"}
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
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Pedro Henrique"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Ex: pedro@radardf.local"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Senha {editingUser ? "(Deixe em branco para manter)" : "*"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-800 text-sm outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Perfil de Acesso *
                  </label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="">Selecione...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Status da Conta
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-850 text-sm outline-none transition-all"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo / Bloqueado</option>
                    <option value="pending_password_change">Exigir Troca de Senha</option>
                  </select>
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
                  {formLoading ? "Salvando..." : "Salvar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
