const ETIQUETAS = { PRESENTE: "Presente", FALTA: "Falta", PENDIENTE: "Pendiente", PROGRAMADA: "Programada" };

export default function Estado({ estado }) {
  return <span className={`badge-estado e-${estado}`}>{ETIQUETAS[estado]}</span>;
}
