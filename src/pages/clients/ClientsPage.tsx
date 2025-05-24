// ... (código anterior mantido)

function ClientsPage() {
  const { permissions } = usePermissions();
  // ... (resto do código mantido)

  const handleEdit = (client: Client) => {
    if (!permissions.canEditClients) {
      alert('Você não tem permissão para editar clientes');
      return;
    }
    setEditingClient(client);
    setIsEditing(true);
  };
  
  const handleDelete = async (clientId: string) => {
    if (!permissions.canDeleteClients) {
      alert('Você não tem permissão para excluir clientes');
      return;
    }
    
    if (!user || !window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    // ... (resto do código mantido)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        {permissions.canCreateClients && (
          <Link to="/clients/new" className="btn btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            Novo Cliente
          </Link>
        )}
      </div>
      
      {/* ... (resto do código mantido) */}
      
      {/* Atualizar os botões de ação para mostrar apenas quando o usuário tem permissão */}
      <button
        onClick={() => handleEdit(client)}
        className={`text-gray-400 hover:text-white transition-colors p-1 ${
          !permissions.canEditClients ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={!permissions.canEditClients}
        title={permissions.canEditClients ? 'Editar' : 'Sem permissão para editar'}
      >
        <Edit2 className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => handleDelete(client.id)}
        className={`text-gray-400 hover:text-red-500 transition-colors p-1 ml-2 ${
          !permissions.canDeleteClients ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={!permissions.canDeleteClients}
        title={permissions.canDeleteClients ? 'Excluir' : 'Sem permissão para excluir'}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      
      {/* ... (resto do código mantido) */}
    </div>
  );
}