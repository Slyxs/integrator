import { Database, DownloadCloud, FileJson, FileCode, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { generarRespaldo, getHistorialRespaldos } from '../../services/api';

// Dispara la descarga de un archivo de texto en el navegador.
const downloadFile = (filename, content, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Backup = () => {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistorial = async () => {
    try {
      const data = await getHistorialRespaldos();
      setHistorial(data);
    } catch (err) {
      toast.error(err.message || 'No se pudo cargar el historial');
      setHistorial([]);
    }
  };

  useEffect(() => { loadHistorial(); }, []);

  const handleBackup = async (formato) => {
    setLoading(true);
    try {
      const res = await generarRespaldo(formato, user?.nombre || 'Administrador');
      if (formato === 'sql') {
        downloadFile(res.archivo, res.sql, 'application/sql');
      } else {
        downloadFile(res.archivo, JSON.stringify(res.datos, null, 2), 'application/json');
      }
      toast.success(`Respaldo generado (${res.registros} registros)`);
      loadHistorial();
    } catch (err) {
      toast.error(err.message || 'No se pudo generar el respaldo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-coffee">
          <Database size={26} /> Respaldo de Información
        </h1>
        <p className="text-sm text-base-content/70">
          Genera una copia de seguridad de los datos del sistema y descárgala en tu equipo.
        </p>
      </div>

      {/* Tarjetas de acción */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="rounded-box bg-primary/10 p-3 text-primary">
                <FileJson size={24} />
              </div>
              <div>
                <h2 className="card-title text-lg">Respaldo JSON</h2>
                <p className="text-sm text-base-content/60">Formato estructurado, ideal para importar datos.</p>
              </div>
            </div>
            <div className="card-actions mt-3">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => handleBackup('json')}
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm" /> : <DownloadCloud size={16} />}
                Descargar JSON
              </button>
            </div>
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="rounded-box bg-secondary/10 p-3 text-secondary">
                <FileCode size={24} />
              </div>
              <div>
                <h2 className="card-title text-lg">Respaldo SQL</h2>
                <p className="text-sm text-base-content/60">Sentencias INSERT para restaurar en MySQL.</p>
              </div>
            </div>
            <div className="card-actions mt-3">
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={() => handleBackup('sql')}
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm" /> : <DownloadCloud size={16} />}
                Descargar SQL
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        <span className="text-sm">
          Por seguridad, las contraseñas de los usuarios no se incluyen en el respaldo. Para una copia
          binaria completa y restaurable use <code>mysqldump</code> directamente en el servidor.
        </span>
      </div>

      {/* Historial */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-lg">Historial de respaldos</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={loadHistorial} aria-label="Actualizar">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Formato</th>
                  <th className="text-center">Tablas</th>
                  <th className="text-center">Registros</th>
                  <th>Generado por</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id}>
                    <td className="font-mono text-xs">{h.archivo}</td>
                    <td>
                      <span className={`badge badge-sm ${h.formato === 'sql' ? 'badge-secondary' : 'badge-primary'}`}>
                        {h.formato.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">{h.tablas}</td>
                    <td className="text-center">{h.registros}</td>
                    <td>{h.usuario || '—'}</td>
                    <td>{(h.createdAt || '').slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
                {historial.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-base-content/60 py-8">
                      Aún no se han generado respaldos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Backup;
