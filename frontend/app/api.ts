// api.ts (Mock)

// --- Helper to get current date as YYYY-MM-DD ---
function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- Interface definitions ---
interface Livro {
  id: number;
  titulo: string;
  autor: string;
  categoria?: string;
  // status?: 'disponivel' | 'emprestado' | 'reservado'; // Example for more detailed status
}

interface Usuario {
  id: number;
  nome: string;
  tipo: string; // e.g., 'aluno', 'professor', 'Funcionário'
}

interface Reserva {
  id: number;
  livro: Livro; // Nested Livro object
  usuario: Usuario; // Nested Usuario object
  dataReserva: string; // YYYY-MM-DD
  status: "Ativa" | "Cancelada" | "Efetivada";
}

interface Emprestimo {
  id: number;
  livro: Livro; // Nested Livro object
  usuario: Usuario; // Nested Usuario object
  dataEmprestimo: string; // YYYY-MM-DD
  dataDevolucao: string | null; // YYYY-MM-DD or null
  status: "Em andamento" | "Devolvido";
}

// --- Mock Data ---
const mockLivros: Livro[] = [
  { id: 1, titulo: "O Senhor dos Anéis", autor: "J.R.R. Tolkien", categoria: "Fantasia" },
  { id: 2, titulo: "1984", autor: "George Orwell", categoria: "Distopia" },
  { id: 3, titulo: "Dom Quixote", autor: "Miguel de Cervantes", categoria: "Clássico" },
  { id: 4, titulo: "A Revolução dos Bichos", autor: "George Orwell", categoria: "Sátira Política" },
  { id: 5, titulo: "O Pequeno Príncipe", autor: "Antoine de Saint-Exupéry", categoria: "Infantil" },
  { id: 6, titulo: "Orgulho e Preconceito", autor: "Jane Austen", categoria: "Romance" },
  { id: 7, titulo: "Cem Anos de Solidão", autor: "Gabriel García Márquez", categoria: "Realismo Mágico" },
  { id: 8, titulo: "O Hobbit", autor: "J.R.R. Tolkien", categoria: "Fantasia" },
  { id: 9, titulo: "Fahrenheit 451", autor: "Ray Bradbury", categoria: "Ficção Científica" },
  { id: 10, titulo: "Moby Dick", autor: "Herman Melville", categoria: "Aventura" },
  { id: 11, titulo: "Guerra e Paz", autor: "Liev Tolstói", categoria: "Histórico" },
  { id: 12, titulo: "O Apanhador no Campo de Centeio", autor: "J.D. Salinger", categoria: "Ficção" },
];

const mockUsuarios: Usuario[] = [
  { id: 101, nome: "Ana Silva", tipo: "Aluno" },
  { id: 102, nome: "Carlos Souza", tipo: "Professor" },
  { id: 103, nome: "Beatriz Lima", tipo: "Aluno" },
  { id: 104, nome: "Daniel Costa", tipo: "Funcionário" },
  { id: 105, nome: "Fernanda Alves", tipo: "Aluno" },
  { id: 106, nome: "Ricardo Borges", tipo: "Professor" },
];

let mockReservas: Reserva[] = [
  { id: 201, livro: mockLivros[0], usuario: mockUsuarios[0], dataReserva: "2025-05-10", status: "Ativa" },
  { id: 202, livro: mockLivros[2], usuario: mockUsuarios[1], dataReserva: "2025-05-12", status: "Efetivada" },
  { id: 203, livro: mockLivros[4], usuario: mockUsuarios[0], dataReserva: "2025-04-20", status: "Cancelada" },
];

let mockEmprestimos: Emprestimo[] = [
  { id: 301, livro: mockLivros[1], usuario: mockUsuarios[2], dataEmprestimo: "2025-05-01", dataDevolucao: null, status: "Em andamento" },
  { id: 302, livro: mockLivros[3], usuario: mockUsuarios[3], dataEmprestimo: "2025-04-15", dataDevolucao: "2025-05-15", status: "Devolvido" },
  { id: 303, livro: mockLivros[5], usuario: mockUsuarios[1], dataEmprestimo: "2025-05-05", dataDevolucao: null, status: "Em andamento" },
];

// Simple ID generators
let nextLivroId = mockLivros.length > 0 ? Math.max(...mockLivros.map(l => l.id)) + 1 : 1;
let nextUsuarioId = mockUsuarios.length > 0 ? Math.max(...mockUsuarios.map(u => u.id)) + 1 : 101;
let nextReservaId = mockReservas.length > 0 ? Math.max(...mockReservas.map(r => r.id)) + 1 : 201;
let nextEmprestimoId = mockEmprestimos.length > 0 ? Math.max(...mockEmprestimos.map(e => e.id)) + 1 : 301;


// --- API Mock Implementation ---
const api = {
  get: <T>(url: string, params?: any): Promise<{ data: T }> => {
    console.log(`[MOCK API] GET: ${url}`, params);
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate network delay
        // Handle /livros and /api/livros
        if (url.startsWith('/livros') || url.startsWith('/api/livros')) {
          if (url.endsWith('/') || url === '/api/livros') { // Ends with / or is exactly /api/livros
            resolve({ data: mockLivros as any });
          } else if (url.includes('?titulo=')) {
            const tituloQuery = url.split('?titulo=')[1].toLowerCase();
            const filteredLivros = mockLivros.filter(livro =>
              livro.titulo.toLowerCase().includes(tituloQuery)
            );
            resolve({ data: filteredLivros as any });
          } else {
            resolve({ data: mockLivros as any }); // Fallback
          }
        // Handle /usuarios and /api/usuarios
        } else if (url.startsWith('/usuarios') || url.startsWith('/api/usuarios')) {
          if (url.endsWith('/') || url === '/api/usuarios') { // Ends with / or is exactly /api/usuarios
            resolve({ data: mockUsuarios as any });
          } else if (url.includes('?nome=')) {
            const nomeQuery = url.split('?nome=')[1].toLowerCase();
            const filteredUsuarios = mockUsuarios.filter(usuario =>
              usuario.nome.toLowerCase().includes(nomeQuery)
            );
            resolve({ data: filteredUsuarios as any });
          } else {
            resolve({ data: mockUsuarios as any }); // Fallback
          }
        // Handle /api/reservas
        } else if (url === '/api/reservas') {
          resolve({ data: mockReservas as any });
        // Handle /api/emprestimos
        } else if (url === '/api/emprestimos') {
          resolve({ data: mockEmprestimos as any });
        }
        else {
          console.error(`[MOCK API] Unhandled GET request for URL: ${url}`);
          reject(new Error(`Mock API: No handler for GET ${url}`));
        }
      }, 300); // 300ms delay
    });
  },

  post: <T>(url: string, body: any): Promise<{ data: T }> => {
    console.log(`[MOCK API] POST: ${url}`, body);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (url === '/api/reservas' || url === '/reservas') { // Handle old and new path for reservations
          const { livroId, usuarioId } = body;
          const livro = mockLivros.find(l => l.id === Number(livroId));
          const usuario = mockUsuarios.find(u => u.id === Number(usuarioId));

          if (!livro || !usuario) {
            console.error(`[MOCK API] POST /api/reservas: Livro ou Usuário não encontrado. LivroID: ${livroId}, UsuarioID: ${usuarioId}`);
            return reject(new Error('Livro ou Usuário não encontrado'));
          }
          const novaReserva: Reserva = {
            id: nextReservaId++,
            livro,
            usuario,
            dataReserva: getCurrentDateString(),
            status: "Ativa",
          };
          mockReservas.push(novaReserva);
          console.log('[MOCK API] Nova reserva criada:', novaReserva);
          resolve({ data: novaReserva as any });

        } else if (url === '/api/emprestimos' || url === '/emprestimos') { // Handle old and new path for loans
          const { livroId, usuarioId } = body;
          const livro = mockLivros.find(l => l.id === Number(livroId));
          const usuario = mockUsuarios.find(u => u.id === Number(usuarioId));

          if (!livro || !usuario) {
            console.error(`[MOCK API] POST /api/emprestimos: Livro ou Usuário não encontrado. LivroID: ${livroId}, UsuarioID: ${usuarioId}`);
            return reject(new Error('Livro ou Usuário não encontrado'));
          }
          const novoEmprestimo: Emprestimo = {
            id: nextEmprestimoId++,
            livro,
            usuario,
            dataEmprestimo: getCurrentDateString(),
            dataDevolucao: null,
            status: "Em andamento",
          };
          mockEmprestimos.push(novoEmprestimo);
          console.log('[MOCK API] Novo empréstimo criado:', novoEmprestimo);
          resolve({ data: novoEmprestimo as any });
        } else {
          console.error(`[MOCK API] Unhandled POST request for URL: ${url}`);
          reject(new Error(`Mock API: No handler for POST ${url}`));
        }
      }, 300);
    });
  },

  put: <T>(url: string, body: any): Promise<{ data: T }> => {
    console.log(`[MOCK API] PUT: ${url}`, body);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const parts = url.split('/');
        const id = parseInt(parts[parts.length - 1]);

        if (url.startsWith('/api/reservas/')) {
          const reservaIndex = mockReservas.findIndex(r => r.id === id);
          if (reservaIndex !== -1) {
            // Example: updating status for cancellation
            if (body.status === "Cancelada" && mockReservas[reservaIndex].status === "Ativa") {
              mockReservas[reservaIndex] = { ...mockReservas[reservaIndex], status: "Cancelada" };
              console.log('[MOCK API] Reserva atualizada:', mockReservas[reservaIndex]);
              resolve({ data: mockReservas[reservaIndex] as any });
            } else if (body.status) { // Generic status update
               mockReservas[reservaIndex] = { ...mockReservas[reservaIndex], ...body };
               console.log('[MOCK API] Reserva atualizada:', mockReservas[reservaIndex]);
               resolve({ data: mockReservas[reservaIndex] as any });
            }
            else {
              console.warn(`[MOCK API] PUT /api/reservas/${id}: Update not applicable or no changes provided. Current status: ${mockReservas[reservaIndex].status}`);
              resolve({ data: mockReservas[reservaIndex] as any }); // Or reject if strict
            }
          } else {
            console.error(`[MOCK API] PUT /api/reservas/${id}: Reserva não encontrada.`);
            reject(new Error('Reserva não encontrada'));
          }
        } else if (url.startsWith('/api/emprestimos/')) {
          const emprestimoIndex = mockEmprestimos.findIndex(e => e.id === id);
          if (emprestimoIndex !== -1) {
            // Example: registering return
            if (body.status === "Devolvido" && mockEmprestimos[emprestimoIndex].status === "Em andamento") {
              mockEmprestimos[emprestimoIndex] = {
                ...mockEmprestimos[emprestimoIndex],
                status: "Devolvido",
                dataDevolucao: body.dataDevolucao || getCurrentDateString(),
              };
              console.log('[MOCK API] Empréstimo atualizado:', mockEmprestimos[emprestimoIndex]);
              resolve({ data: mockEmprestimos[emprestimoIndex] as any });
            } else if (body.status) { // Generic status update
                mockEmprestimos[emprestimoIndex] = { ...mockEmprestimos[emprestimoIndex], ...body };
                console.log('[MOCK API] Empréstimo atualizado:', mockEmprestimos[emprestimoIndex]);
                resolve({ data: mockEmprestimos[emprestimoIndex] as any });
            }
            else {
              console.warn(`[MOCK API] PUT /api/emprestimos/${id}: Update not applicable or no changes provided. Current status: ${mockEmprestimos[emprestimoIndex].status}`);
              resolve({ data: mockEmprestimos[emprestimoIndex] as any }); // Or reject
            }
          } else {
            console.error(`[MOCK API] PUT /api/emprestimos/${id}: Empréstimo não encontrado.`);
            reject(new Error('Empréstimo não encontrado'));
          }
        } else {
          console.error(`[MOCK API] Unhandled PUT request for URL: ${url}`);
          reject(new Error(`Mock API: No handler for PUT ${url}`));
        }
      }, 300);
    });
  },
  // You can add mock implementations for delete, etc. if your component uses them
  // delete: <T>(url: string): Promise<{ data: T }> => { ... },
};

export default api;
