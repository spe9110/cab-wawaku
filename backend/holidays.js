import axios from "axios";

// Fonction qui prend l'année et retourne les jours fériés de RDC
export const getRDCongoHolidays = async (year) => {
  try {
    const res = await axios.get(`https://date.nager.at/api/v3/publicholidays/${year}/CD`);
    return res.data.map(h => h.date); // ["2025-01-01", "2025-05-01", ...]
  } catch (err) {
    console.error("Error fetching holidays:", err.message);
    return [];
  }
};