"use client";

import { useEffect, useState } from "react";
import api, { UsuarioReadBasic as Usuario } from "../../api";

export default function useUsuarios(isAuthenticated: boolean, authUser: any) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    if (isAuthenticated && authUser?.role === 'funcionario') {
      api.get<Usuario[]>("/usuarios")
        .then(res => setUsuarios(res.data))
        .catch(() => setUsuarios([]));
    } else {
      setUsuarios([]);
    }
  }, [isAuthenticated, authUser]);

  return usuarios;
}
