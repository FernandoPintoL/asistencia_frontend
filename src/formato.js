// Formato de fechas igual al que usaba Django. El backend envía fechas ISO
// ya en hora de Bolivia, así que solo se reordena el texto (sin conversiones).

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** "2026-10-15" → "15/10/2026" */
export function fecha(iso) {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** "2026-10-15" → "Jue 15/10/2026" */
export function fechaDia(iso) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${fecha(iso)}`;
}

/** "2026-10-15T18:05:09-04:00" → "18:05:09" */
export function hora(iso) {
  return iso ? iso.slice(11, 19) : "—";
}

/** "2026-10-15T18:05:09-04:00" → "15/10/2026 18:05:09" */
export function fechaHora(iso) {
  return `${fecha(iso)} ${hora(iso)}`;
}

/** "2026-10-15T18:05:09-04:00" → "15/10 18:05" */
export function fechaHoraCorta(iso) {
  return `${fecha(iso).slice(0, 5)} ${iso.slice(11, 16)}`;
}
