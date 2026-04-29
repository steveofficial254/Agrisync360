import { useEffect, useState } from "react";
import api from "../api/axios";

export default function useWeather() {
  const [data, setData] = useState([]);
  useEffect(() => { api.get("/weather/forecast").then((r) => setData(r.data.data)).catch(() => {}); }, []);
  return data;
}
