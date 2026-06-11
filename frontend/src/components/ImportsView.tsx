// --- ImportsView.tsx ---
"use client";
import React, { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Download, History } from "lucide-react";

interface ImportsViewProps {
  token: string;
  onRefresh: () => void;
}

export default function ImportsView({ token, onRefresh }: ImportsViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/imports/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setImportHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUploadPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/imports/preview`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Erro ao processar planilha. Verifique a estrutura das colunas.");
      }

      setPreviewData(data);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Erro de rede ao validar planilha.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/imports/execute`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Erro ao executar importação");
      }

      setResultData(data);
      setStep("result");
      fetchHistory();
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao finalizar importação.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrors = (importId: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    window.open(`${apiUrl}/imports/${importId}/errors?token=${token}`, "_blank");
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData(null);
    setResultData(null);
    setError("");
    setStep("upload");
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-slate-800 font-bold text-xl">Importação de Planilhas</h2>
        <p className="text-slate-500 text-xs mt-0.5">Importe demandas em lote através de planilhas CSV ou Excel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wizard Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[400px]">
          {step === "upload" && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-800 text-sm">Passo 1: Selecionar Arquivo</h3>
              
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUploadPreview} className="space-y-6">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 cursor-pointer relative group transition-colors duration-150">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors duration-150 mb-3" />
                  {file ? (
                    <div className="text-center space-y-1">
                      <p className="text-emerald-700 font-semibold text-sm">{file.name}</p>
                      <p className="text-slate-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <p className="text-slate-600 font-medium text-sm">Arraste ou clique para selecionar</p>
                      <p className="text-slate-400 text-xs">Suporta arquivos CSV, XLSX e XLS de até 10MB</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  <b>Atenção:</b> A planilha deve conter as colunas exatas:
                  <code className="block mt-1.5 p-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 overflow-x-auto truncate">
                    data | cidade | bairro | tema | subtema | titulo | descricao | origem | prioridade | status | responsavel | observacao | nome_solicitante | contato
                  </code>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
                      window.open(`${apiUrl}/imports/template?token=${token}`, "_blank");
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition-colors duration-150 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    Baixar Modelo CSV
                  </button>
                  <button
                    type="submit"
                    disabled={!file || loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      "Validar e Pré-visualizar"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "preview" && previewData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Passo 2: Resumo da Validação</h3>
                <span className="text-xs text-slate-500">Arquivo: {previewData.filename}</span>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-550">Linhas Totais</div>
                  <div className="text-2xl font-bold text-slate-800 mt-0.5">{previewData.total_rows}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="text-[10px] uppercase font-bold text-emerald-850">Linhas Válidas</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-0.5">{previewData.success_rows}</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="text-[10px] uppercase font-bold text-red-850">Erros Encontrados</div>
                  <div className="text-2xl font-bold text-red-750 mt-0.5">{previewData.error_rows}</div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-100 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-150 font-bold text-slate-600">
                    <tr>
                      <th className="p-2.5 w-16 text-center">Linha</th>
                      <th className="p-2.5">Título / Demanda</th>
                      <th className="p-2.5">Status Validação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewData.rows.slice(0, 10).map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="p-2.5 text-center font-bold text-slate-400">#{r.row_number}</td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-700 truncate max-w-[200px]">{r.data.titulo || "Sem título"}</div>
                          <div className="text-slate-400 text-[10px] truncate max-w-[200px] mt-0.5">{r.data.descricao}</div>
                        </td>
                        <td className="p-2.5">
                          {r.valid ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Válida
                            </span>
                          ) : (
                            <div className="text-red-600 font-medium space-y-0.5">
                              {r.errors.map((err: any, eIdx: number) => (
                                <div key={eIdx} className="flex items-center gap-0.5 text-[10px]">
                                  <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                                  <span>{err.error}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.rows.length > 10 && (
                  <div className="p-2 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
                    Exibindo primeiras 10 linhas de {previewData.rows.length}.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetImport}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm transition-colors duration-150"
                >
                  Cancelar e Recomeçar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={loading || previewData.success_rows === 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm shadow-sm transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    `Importar ${previewData.success_rows} Linhas Válidas`
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "result" && resultData && (
            <div className="space-y-6 text-center py-6">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100 mb-2">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Importação Finalizada!</h3>
              
              <div className="max-w-xs mx-auto bg-slate-50 border border-slate-150 p-4 rounded-xl text-sm text-slate-700 space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Importado:</span>
                  <span className="font-bold text-emerald-700">{resultData.successful_rows} linhas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total com Erros:</span>
                  <span className="font-bold text-red-700">{resultData.error_rows} linhas</span>
                </div>
              </div>

              {resultData.error_rows > 0 && (
                <div className="max-w-md mx-auto p-3.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800 text-left space-y-2">
                  <p className="font-bold flex items-center gap-1 text-red-700">
                    <AlertCircle className="w-4.5 h-4.5" /> Alguns registros falharam na validação.
                  </p>
                  <p>As linhas com erros não foram importadas para preservar a integridade territorial. Baixe o log de inconsistências para corrigir a planilha e reenviar.</p>
                  <button
                    onClick={() => handleDownloadErrors(resultData.import_id)}
                    className="flex items-center gap-1 text-xs font-bold bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Relatório de Erros
                  </button>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={resetImport}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg text-sm shadow-sm transition-colors duration-150"
                >
                  Nova Importação
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - History list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold">
            <History className="w-5 h-5 text-emerald-600" />
            <h3>Histórico de Uploads</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]">
            {importHistory.map((item) => (
              <div 
                key={item.id} 
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex justify-between items-start">
                  <div className="font-bold text-slate-700 truncate max-w-[140px]" title={item.file_name}>
                    {item.file_name}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === "Sucesso" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {item.status}
                  </span>
                </div>
                
                <div className="text-slate-450 text-[10px]">
                  Processado em: {new Date(item.created_at).toLocaleString("pt-BR")}
                </div>

                <div className="flex justify-between text-[11px] border-t border-slate-100/60 pt-2 text-slate-600">
                  <span>Sucesso: <b>{item.successful_rows}</b></span>
                  <span>Erros: <b>{item.error_rows}</b></span>
                  
                  {item.error_rows > 0 && (
                    <button
                      onClick={() => handleDownloadErrors(item.id)}
                      className="text-red-650 hover:text-red-700 font-bold flex items-center gap-0.5"
                      title="Baixar log de erros"
                    >
                      <Download className="w-3 h-3" /> Log
                    </button>
                  )}
                </div>
              </div>
            ))}
            {importHistory.length === 0 && (
              <div className="text-center text-slate-400 py-12">Nenhum upload registrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
