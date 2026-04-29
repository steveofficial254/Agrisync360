import { useEffect, useState } from "react";
import api from "../api/axios";

export default function useMarket() {
  const [data, setData] = useState([]);
  useEffect(() => { api.get("/market/prices/all").then((r) => setData(r.data.data)).catch(() => {}); }, []);
  return data;
}
