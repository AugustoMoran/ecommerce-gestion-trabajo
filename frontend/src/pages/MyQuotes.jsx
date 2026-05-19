import { useGetMyQuotesQuery } from '../services/quotesApi';
import QuoteCard from '../components/quotes/QuoteCard';

const MyQuotes = () => {
  const { data: quotes = [], isLoading } = useGetMyQuotesQuery();

  if (isLoading) {
    return <div className="text-center py-10">Cargando presupuestos...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mis Presupuestos</h1>

      {quotes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No tienes presupuestos aún</p>
          <p className="text-sm text-gray-500">
            Los presupuestos que te envíen aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {quotes.map((quote) => (
            <div
              key={quote._id}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Presupuesto #{quote.numero}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Creado: {new Date(quote.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      quote.estado === 'borrador'
                        ? 'bg-yellow-100 text-yellow-700'
                        : quote.estado === 'enviado'
                        ? 'bg-blue-100 text-blue-700'
                        : quote.estado === 'aceptado'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {quote.estado}
                  </span>
                </div>

                {/* Items */}
                <div className="mb-4 bg-gray-50 rounded p-4">
                  <h3 className="font-semibold text-sm mb-3">Productos:</h3>
                  <div className="space-y-2">
                    {quote.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.nombre} x{item.cantidad}
                        </span>
                        <span>${(item.cantidad * item.precioUnitario).toFixed(2)}</span>
                      </div>
                    ))}
                    {quote.instalacion.incluye && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span>Instalación</span>
                        <span>${quote.instalacion.monto.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-4 text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="text-blue-600 font-bold text-xl">
                    ${quote.totales.total.toFixed(2)}
                  </span>
                </div>

                {/* Info de envío */}
                {quote.enviado && (
                  <div className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded">
                    <div>
                      ✉️ Enviado:{' '}
                      {new Date(quote.enviado.fecha).toLocaleDateString('es-AR')}
                    </div>
                    {quote.enviado.descargadoFecha && (
                      <div>
                        📥 Descargado:{' '}
                        {new Date(quote.enviado.descargadoFecha).toLocaleDateString('es-AR')}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-3">
                  <QuoteCard quote={quote} isAdmin={false} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuotes;
