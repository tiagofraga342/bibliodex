// api.ts

// --- Helper to get current date as YYYY-MM-DD ---
function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- Autor/Categoria/Cursos ---
export interface AutorReadBasic {
  id_autor: number;
  nome: string;
  ano_nasc?: number | null;
}

export interface CategoriaReadBasic {
  id_categoria: number;
  nome: string;
}

export interface CursoReadBasic {
  id_curso: number;
  nome: string;
  departamento?: string | null;
}

// --- Livro ---
export interface LivroReadBasic {
  id_livro: number;
  titulo: string;
  ano_publicacao?: number | null;
  status_geral?: string | null;
  id_categoria: number;
}

export interface LivroRead {
  id_livro: number;
  titulo: string;
  ano_publicacao?: number | null;
  status_geral?: string | null;
  id_categoria: number;
  categoria: CategoriaReadBasic;
  autores: AutorReadBasic[];
}

// --- Usuario ---
export interface UsuarioReadBasic {
  id_usuario: number;
  nome: string;
  telefone?: string | null;
  matricula: string;
  email?: string | null;
  id_curso?: number | null;
  is_active: boolean;
  curso?: CursoReadBasic | null;
  role?: string; // O backend envia 'role' no token, não 'tipo'
}

export interface UsuarioRead extends UsuarioReadBasic {
  // id_usuario, nome, etc. herdados
  // curso?: CursoReadBasic | null;
}

// --- Exemplar ---
export interface ExemplarReadBasic {
  id_exemplar: number;
  codigo_identificacao: string;
  status: string;
  data_aquisicao?: string | null;
  observacoes?: string | null;
  id_livro: number;
}

// --- Funcionario ---
export interface FuncionarioReadBasic {
  id_funcionario: number;
  nome: string;
  cargo: string;
  matricula_funcional: string;
  is_active: boolean;
}

// --- Reserva ---
export interface ReservaRead {
  id_reserva: number;
  data_reserva: string;
  data_validade_reserva: string;
  status: string;
  id_exemplar?: number | null;
  id_livro_solicitado?: number | null;
  id_usuario: number;
  id_funcionario_registro?: number | null;
  usuario: UsuarioReadBasic;
  exemplar?: ExemplarReadBasic | null;
  livro?: LivroRead | null; // livro é populado com autores/categoria
  funcionario_registro_reserva?: FuncionarioReadBasic | null;
}

// --- Emprestimo ---
export interface EmprestimoRead {
  id_emprestimo: number;
  data_retirada: string;
  data_prevista_devolucao: string;
  data_efetiva_devolucao?: string | null;
  status_emprestimo: string;
  id_usuario: number;
  id_exemplar: number;
  id_funcionario_registro: number;
  usuario: UsuarioReadBasic;
  exemplar: ExemplarReadBasic;
  funcionario_registro_emprestimo: FuncionarioReadBasic;
}

// --- Token ---
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// --- Constantes e helpers ---
// Detecta ambiente: se rodando no browser, usa proxy '/api', senão usa variável de ambiente
const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/^"|"$/g, "");
const TOKEN_KEY = "bibliodex_access_token";
const REFRESH_TOKEN_KEY = "bibliodex_refresh_token";

const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// --- Função para tentar renovar o access_token automaticamente ---
const tryRefreshToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (data.access_token && data.refresh_token) {
      setTokens(data.access_token, data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// --- Wrapper para lidar com 401 e tentar refresh ---
async function fetchWithAutoRefresh(input: RequestInfo, init?: RequestInit, retry = true): Promise<Response> {
  let response = await fetch(input, init);
  if (response.status === 401 && retry) {
    // Tenta renovar o token
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Reenvia a requisição original com novo token
      const token = getAuthToken();
      if (token) {
        const headers = new Headers(init?.headers || {});
        headers.set("Authorization", `Bearer ${token}`);
        response = await fetch(input, { ...init, headers });
        if (response.status !== 401) return response;
      }
    }
    // Se não conseguiu renovar, limpa tokens e redireciona para login
    clearTokens();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith('/login')) {
      window.location.href = '/login';
    }
  }
  return response;
}

const handleApiError = async (response: Response, url: string) => {
  let errorMessage = "Ocorreu um erro desconhecido";
  let status = response.status;
  let data: any = null;
  try {
    data = await response.json();
    errorMessage = data.detail || data.message || errorMessage;
  } catch {
    // ignore
  }
  if (status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
  }
  const err = new Error(errorMessage);
  (err as any).status = status;
  (err as any).data = data;
  throw err;
};

// --- API methods usando fetchWithAutoRefresh ---
const api = {
  get: async <T>(url: string, params?: any): Promise<{ data: T }> => {
    const token = getAuthToken();
    let fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    if (params && typeof params === 'object') {
      const qs = new URLSearchParams(params).toString();
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
    }
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetchWithAutoRefresh(fullUrl, { headers });
    if (!response.ok) {
      await handleApiError(response, fullUrl);
    }
    const data = await response.json();
    return { data };
  },

  post: async <T>(url: string, body: any): Promise<{ data: T }> => {
    const token = getAuthToken();
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    // Corrigir headers para envio de form-data no login
    if (url.endsWith('/auth/token') && body instanceof URLSearchParams) {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(fullUrl, {
        method: 'POST',
        body,
        headers,
      });
      if (!response.ok) {
        await handleApiError(response, fullUrl);
      }
      const data = await response.json();
      // Salva access_token e refresh_token se presentes
      if (data.access_token && data.refresh_token) {
        setTokens(data.access_token, data.refresh_token);
      }
      return { data };
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetchWithAutoRefresh(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      await handleApiError(response, fullUrl);
    }
    const data = await response.json();
    // Salva access_token e refresh_token se presentes (ex: refresh endpoint)
    if (data.access_token && data.refresh_token) {
      setTokens(data.access_token, data.refresh_token);
    }
    return { data };
  },

  put: async <T>(url: string, body: any): Promise<{ data: T }> => {
    const token = getAuthToken();
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetchWithAutoRefresh(fullUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      await handleApiError(response, fullUrl);
    }
    const data = await response.json();
    return { data };
  },

  delete: async <T>(url: string): Promise<{ data: T }> => {
    const token = getAuthToken();
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetchWithAutoRefresh(fullUrl, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      await handleApiError(response, fullUrl);
    }
    const data = await response.json();
    return { data };
  },
};

// Exemplo de função para buscar livros paginados/filtrados
export interface PaginatedLivros {
  total: number;
  items: LivroRead[];
}

export async function fetchLivros(params: {
  skip?: number;
  limit?: number;
  titulo?: string;
  autor?: string;
  categoria_id?: number;
  sort_by?: string;
  sort_dir?: string;
}): Promise<{ data: PaginatedLivros }> {
  // Remove parâmetros undefined antes de enviar
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
  );
  return api.get<PaginatedLivros>("/livros", cleanParams);
}

// Exemplo de função para buscar usuários por nome (autocomplete)
export async function fetchUsuariosAutocomplete(params: {
  nome_like: string;
  limit?: number;
}) {
  return api.get<UsuarioReadBasic[]>("/usuarios", params);
}

export {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getAuthToken,
  getRefreshToken,
  API_BASE_URL,
  setTokens,
  clearTokens,
};

export default api;
