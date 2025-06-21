import { useState, useRef } from "react";

export default function useModalEmprestimo() {
  const [modalLivro, setModalLivro] = useState<any>(null);
  const [buscaUsuarioEmprestimo, setBuscaUsuarioEmprestimo] = useState("");
  const [usuariosFiltradosEmprestimo, setUsuariosFiltradosEmprestimo] = useState<any[]>([]);
  const [dropdownUsuarioEmprestimoAberto, setDropdownUsuarioEmprestimoAberto] = useState(false);
  const modalEmprestimoRef = useRef<HTMLDialogElement>(null);
  const dropdownUsuarioEmprestimoRef = useRef<HTMLDivElement>(null);
  const [mensagem, setMensagem] = useState("");

  return {
    modalLivro, setModalLivro,
    buscaUsuarioEmprestimo, setBuscaUsuarioEmprestimo,
    usuariosFiltradosEmprestimo, setUsuariosFiltradosEmprestimo,
    dropdownUsuarioEmprestimoAberto, setDropdownUsuarioEmprestimoAberto,
    modalEmprestimoRef, dropdownUsuarioEmprestimoRef,
    mensagem, setMensagem
  };
}
