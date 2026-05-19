import { useSendQuoteMutation, useUpdateQuoteStatusMutation, useDeleteQuoteMutation } from '../../services/quotesApi';
import toast from 'react-hot-toast';

const QuoteCard = ({ quote, isAdmin = false, onDeleteSuccess }) => {
  const [sendQuote, { isLoading: isSending }] = useSendQuoteMutation();
  const [updateStatus] = useUpdateQuoteStatusMutation();
  const [deleteQuote, { isLoading: isDeleting }] = useDeleteQuoteMutation();

  const handleSendQuote = async () => {
    try {
      await sendQuote(quote._id).unwrap();
      toast.success('Presupuesto enviado por email');
    } catch (error) {
      toast.error(error?.data?.message || 'Error al enviar');
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/quotes/${quote._id}/pdf`, '_blank');
  };

  const handleAccept = async () => {
    try {
      await updateStatus({ id: quote._id, estado: 'aceptado' }).unwrap();
      toast.success('Presupuesto aceptado');
    } catch (error) {
      toast.error('Error al aceptar');
    }
  };

  const handleReject = async () => {
    try {
      await updateStatus({ id: quote._id, estado: 'rechazado' }).unwrap();
      toast.success('Presupuesto rechazado');
    } catch (error) {
      toast.error('Error al rechazar');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await deleteQuote(quote._id).unwrap();
      toast.success('Presupuesto eliminado');
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      toast.error(error?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {isAdmin ? (
        <>
          {['borrador', 'enviado'].includes(quote.estado) && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition"
            >
              {isDeleting ? 'Eliminando...' : '🗑️ Eliminar'}
            </button>
          )}
          {quote.estado === 'borrador' && (
            <button
              onClick={handleSendQuote}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition"
            >
              {isSending ? 'Enviando...' : '📧 Enviar'}
            </button>
          )}
          <a
            href={`/api/quotes/${quote._id}/pdf`}
            download={`presupuesto-${quote.numero}.pdf`}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm inline-block transition"
          >
            📄 PDF
          </a>
        </>
      ) : (
        <>
          <a
            href={`/api/quotes/${quote._id}/pdf`}
            download={`presupuesto-${quote.numero}.pdf`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            📄 Descargar PDF
          </a>

          {quote.estado === 'enviado' && (
            <>
              <button
                onClick={handleAccept}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                ✅ Aceptar
              </button>
              <button
                onClick={handleReject}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                ❌ Rechazar
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default QuoteCard;
