export default function Paginacion({ datos, onCambiar }) {
  if (!datos || datos.num_pages <= 1) return null;
  const { page, num_pages } = datos;
  return (
    <nav aria-label="Paginación" className="mt-3">
      <ul className="pagination justify-content-center mb-0">
        {page > 1 && (
          <li className="page-item">
            <button className="page-link" onClick={() => onCambiar(page - 1)}>Anterior</button>
          </li>
        )}
        <li className="page-item disabled">
          <span className="page-link">Página {page} de {num_pages}</span>
        </li>
        {page < num_pages && (
          <li className="page-item">
            <button className="page-link" onClick={() => onCambiar(page + 1)}>Siguiente</button>
          </li>
        )}
      </ul>
    </nav>
  );
}
