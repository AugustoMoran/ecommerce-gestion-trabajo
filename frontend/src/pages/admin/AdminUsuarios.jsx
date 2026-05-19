import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetUsersListQuery,
  useChangeUserRoleMutation,
  useDeleteUserMutation,
  useGetUsersStatsQuery,
} from '../../services/adminUsersApi';
import toast from 'react-hot-toast';

const AdminUsuarios = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  // Queries with loading states
  const { data: usersList = { users: [], total: 0 }, isLoading } = useGetUsersListQuery(
    { search, role: roleFilter, limit: 50 },
    { skip: false }
  );
  const { data: userStats = {} } = useGetUsersStatsQuery();

  // Mutations
  const [changeRole, { isLoading: isChangingRole }] = useChangeUserRoleMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const handleEditClick = (user) => {
    setEditModal(user);
    setEditRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editModal || !editModal._id) {
      toast.error('Error: Usuario no identificado');
      return;
    }
    if (!editRole) {
      toast.error('Selecciona un rol');
      return;
    }

    try {
      await changeRole({ id: editModal._id, newRole: editRole }).unwrap();
      toast.success('✅ Rol actualizado');
      setEditModal(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Error al cambiar rol');
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteModal(user);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(deleteModal._id).unwrap();
      toast.success('✅ Usuario eliminado');
      setDeleteModal(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Error al eliminar usuario');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-2">Administra roles y permisos de usuarios</p>
        </div>

      {/* Stats */}
      {userStats && Object.keys(userStats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(userStats).slice(0, 5).map(([key, value]) => (
            <div key={key} className="bg-gray-900 rounded-lg shadow p-4 text-center">
              <p className="text-gray-500 text-xs font-medium uppercase">{key}</p>
              <p className="text-2xl font-bold text-gray-100 mt-2">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg shadow p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="tecnico">Técnico</option>
            <option value="gremio">Gremio</option>
            <option value="despachante">Despachante</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-gray-900 rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Cargando usuarios...</p>
          </div>
        ) : usersList?.users?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Rol</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usersList.users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-800 border-b border-gray-700">
                    <td className="px-6 py-4">{user.nombre} {user.apellido}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-800 mr-4 font-medium"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No se encontraron usuarios
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {usersList?.total > 0 && (
        <p className="text-sm text-gray-600">
          Mostrando {usersList.users?.length || 0} de {usersList.total} usuarios
        </p>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-gray-100 mb-4">
              Cambiar rol: {editModal.nombre} {editModal.apellido}
            </h3>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-700 rounded-lg mb-6 bg-gray-800 text-gray-100"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="tecnico">Técnico</option>
              <option value="gremio">Gremio</option>
              <option value="despachante">Despachante</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRole}
                disabled={isChangingRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isChangingRole ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-gray-100 mb-2">
              ¿Eliminar usuario?
            </h3>
            <p className="text-gray-400 mb-6">
              {deleteModal.nombre} {deleteModal.apellido} ({deleteModal.email})
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeletingUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {isDeletingUser ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsuarios;
