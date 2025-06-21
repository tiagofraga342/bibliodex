import { useEffect, useState } from "react";
import { fetchLivros, PaginatedLivros } from "../../api";

export interface Filtros {
  titulo: string;
  autor: string;
  categoria: string;
}

export default function useLivros(filtros: Filtros, page: number, pageSize: number) {
  const [livros, setLivros] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchLivros({
      skip: page * pageSize,
      limit: pageSize,
      titulo: filtros.titulo || undefined,
      autor: filtros.autor || undefined,
      categoria_id: filtros.categoria ? Number(filtros.categoria) : undefined,
      sort_by: "titulo",
      sort_dir: "asc",
    })
      .then((res) => {
        setLivros(res.data.items);
        setTotal(res.data.total);
        setLoading(false);
        setErro(null);
      })
      .catch((err) => {
        let msg = 'Erro ao buscar livros';
        if (err && (err.status === 504 || (err.message && err.message.toLowerCase().includes('timeout')))) {
          msg = 'A busca está demorando demais ou expirou. Tente novamente ou aguarde mais tempo.';
        }
        setErro(msg);
        setLoading(false);
      });
  }, [filtros, page, pageSize]);

  return { livros, total, loading, erro };
}
