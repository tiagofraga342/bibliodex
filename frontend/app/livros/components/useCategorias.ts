"use client";

import { useEffect, useState } from "react";
import api from "../../api";

export default function useCategorias() {
  const [categorias, setCategorias] = useState<any[]>([]);
  useEffect(() => {
    api.get("/categorias")
      .then(res => setCategorias(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategorias([]));
  }, []);
  return categorias;
}
