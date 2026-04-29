import { useEffect, useState } from "react";
import api from "../api/axios";

export default function useFarmer() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/farmers/profile").then((r) => setData(r.data.data)).catch(() => {}); }, []);
  return data;
}
