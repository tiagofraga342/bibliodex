import { useState, useRef } from "react";

export default function useModalReserva() {
  const [modalReservaLivro, setModalReservaLivro] = useState<any>(null);
  const [buscaUsuarioReserva, setBuscaUsuarioReserva] = useState("");
  const [usuariosFiltradosReserva, setUsuariosFiltradosReserva] = useState<any[]>([]);
  const [dropdownUsuarioReservaAberto, setDropdownUsuarioReservaAberto] = useState(false);
  const modalReservaRef = useRef<HTMLDialogElement>(null);
  const dropdownUsuarioReservaRef = useRef<HTMLDivElement>(null);
  const [mensagemReserva, setMensagemReserva] = useState("");

  return {
    modalReservaLivro, setModalReservaLivro,
    buscaUsuarioReserva, setBuscaUsuarioReserva,
    usuariosFiltradosReserva, setUsuariosFiltradosReserva,
    dropdownUsuarioReservaAberto, setDropdownUsuarioReservaAberto,
    modalReservaRef, dropdownUsuarioReservaRef,
    mensagemReserva, setMensagemReserva
  };
}
