import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetAllQuotesQuery } from '../../services/quotesApi';
import QuoteForm from '../../components/quotes/QuoteForm';
import QuoteCard from '../../components/quotes/QuoteCard';

const AdminQuotes = () => {
  const { data: quotes = [], isLoading, error } = useGetAllQuotesQuery();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('todos'); // todos, borrador, enviado, aceptado, rechazado

  const filteredQuotes = quotes.filter((quote) => {
    if (filter === 'todos') return true;
    return quote.estado === filter;
  });

  if (isLoading) {
    return <div className="text-center py-10">Cargando presupuestos...</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Gestión de Presupuestos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition font-semibold shadow-lg"
        >
          ➕ Crear Presupuesto
        </button>
      </div>

      {showForm && (
        <QuoteForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            // RTK Query invalidará automáticamente
          }}
        />
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['todos', 'borrador', 'enviado', 'aceptado', 'rechazado'].map((estado) => (
          <button
            key={estado}
            onClick={() => setFilter(estado)}
            className={`px-4 py-2 rounded-lg capitalize transition font-medium ${
              filter === estado
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-100 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            {estado}
          </button>
        ))}
      </div>

      {/* Tabla de Presupuestos */}
      {filteredQuotes.length === 0 ? (
        <div className="text-center py-16 text-gray-300 bg-gray-900 rounded-lg">
          <p className="text-lg font-medium">No hay presupuestos para mostrar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full border-collapse bg-gray-900">
              <thead>
                <tr className="bg-gray-800 border-b-2 border-gray-700">
                  <th className="px-4 py-3 text-left text-white font-bold">Número</th>
                  <th className="px-4 py-3 text-left text-white font-bold">Cliente</th>
                  <th className="px-4 py-3 text-left text-white font-bold">Total</th>
                  <th className="px-4 py-3 text-left text-white font-bold">Estado</th>
                  <th className="px-4 py-3 text-left text-white font-bold">Fecha</th>
                  <th className="px-4 py-3 text-center text-white font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote._id} className="border-b border-gray-700 hover:bg-gray-800 transition">
                    <td className="px-4 py-3 font-bold text-white">{quote.numero}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-white">{quote.client.nombre}</div>
                        <div className="text-sm text-gray-400">{quote.client.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-green-400">${quote.totales.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        quote.estado === 'borrador' ? 'bg-yellow-600 text-yellow-50 border border-yellow-500' :
                        quote.estado === 'enviado' ? 'bg-blue-600 text-blue-50 border border-blue-500' :
                        quote.estado === 'aceptado' ? 'bg-green-600 text-green-50 border border-green-500' :
                        'bg-red-600 text-red-50 border border-red-500'
                      }`}>
                        {quote.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-medium">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <QuoteCard quote={quote} isAdmin={true} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default AdminQuotes;
