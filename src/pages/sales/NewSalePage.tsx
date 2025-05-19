import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Camera, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../contexts/SupabaseContext';

interface SaleForm {
  clientId: string;
  saleDate: string;
  instagram: string;
  notes: string;
}

interface Client {
  id: string;
  name: string;
}

function NewSalePage() {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    formState: { errors } 
  } = useForm<SaleForm>({
    defaultValues: {
      saleDate: new Date().toISOString().split('T')[0],
    }
  });
  
  useEffect(() => {
    if (!user || searchTerm.length < 2) {
      setClients([]);
      return;
    }

    const searchClients = async () => {
      setClientsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', user.id)
          .ilike('name', `%${searchTerm}%`)
          .order('name')
          .limit(10);
          
        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setClientsLoading(false);
      }
    };

    // Debounce a busca para evitar muitas requisições
    const timeoutId = setTimeout(searchClients, 300);
    return () => clearTimeout(timeoutId);
  }, [user, searchTerm]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setValue('clientId', client.id);
    setSearchTerm(client.name);
    setClients([]); // Limpa a lista de resultados
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const fileList = Array.from(e.target.files);
    const newImagePreviews = fileList.map(file => URL.createObjectURL(file));
    
    setImages(prev => [...prev, ...fileList]);
    setImagesPreviews(prev => [...prev, ...newImagePreviews]);
  };
  
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagesPreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const onSubmit = async (data: SaleForm) => {
    if (!user || !selectedClient) {
      setError('Por favor, selecione um cliente');
      return;
    }
    
    if (images.length === 0) {
      setError('Por favor, adicione pelo menos uma foto');
      return;
    }
    
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            client_id: selectedClient.id,
            sale_date: data.saleDate,
            instagram: data.instagram || null,
            notes: data.notes || null,
            is_completed: false,
            user_id: user.id,
          },
        ])
        .select();
        
      if (saleError) throw saleError;
      
      if (!saleData || saleData.length === 0) {
        throw new Error('Erro ao criar registro de venda');
      }
      
      const saleId = saleData[0].id;
      const totalImages = images.length;
      let uploadedImages = 0;
      
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${saleId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('sale_photos')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { error: photoRecordError } = await supabase
          .from('sale_photos')
          .insert([
            {
              sale_id: saleId,
              storage_path: filePath,
              user_id: user.id,
            },
          ]);
          
        if (photoRecordError) throw photoRecordError;
        
        uploadedImages++;
        setUploadProgress(Math.round((uploadedImages / totalImages) * 100));
      }
      
      navigate('/sales');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a venda.');
      console.error('Error creating sale:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/sales')}
          className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold">Nova Venda</h1>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="form-group">
            <label htmlFor="clientSearch" className="label">Cliente *</label>
            <div className="relative">
              <input
                id="clientSearch"
                type="text"
                placeholder="Digite o nome do cliente para buscar..."
                className="input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {clientsLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {clients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 rounded-md shadow-lg border border-gray-700">
                  <ul className="py-1">
                    {clients.map((client) => (
                      <li key={client.id}>
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-700 text-gray-200"
                          onClick={() => handleClientSelect(client)}
                        >
                          {client.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {searchTerm.length > 0 && searchTerm.length < 2 && (
                <p className="text-xs text-gray-400 mt-1">
                  Digite pelo menos 2 caracteres para buscar
                </p>
              )}
            </div>
            {!selectedClient && <input type="hidden" {...register('clientId', { required: true })} />}
          </div>
          
          <div className="form-group">
            <label htmlFor="saleDate" className="label">Data da Venda *</label>
            <input
              id="saleDate"
              type="date"
              className={`input ${errors.saleDate ? 'border-red-500 focus:ring-red-500' : ''}`}
              {...register('saleDate', { required: 'Data é obrigatória' })}
            />
            {errors.saleDate && <p className="error-text">{errors.saleDate.message}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="instagram" className="label">Instagram</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                @
              </span>
              <input
                id="instagram"
                type="text"
                className="input pl-7"
                placeholder="nome_do_cliente"
                {...register('instagram')}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="label">Fotos *</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 mt-2">
              <div className="flex flex-wrap gap-4 mb-4">
                {imagesPreviews.map((src, index) => (
                  <div key={index} className="relative h-24 w-24 bg-gray-700 rounded-md overflow-hidden">
                    <img 
                      src={src} 
                      alt={`Preview ${index}`} 
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-gray-900 bg-opacity-70 rounded-full p-1"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                
                <label className="flex flex-col items-center justify-center h-24 w-24 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700 transition-colors">
                  <Camera className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-xs text-gray-400">Adicionar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-400">
                Clique para adicionar fotos. Você pode selecionar múltiplas fotos.
              </p>
            </div>
            {images.length === 0 && <p className="text-xs text-gray-400 mt-1">Pelo menos uma foto é necessária</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="notes" className="label">Anotações</label>
            <textarea
              id="notes"
              rows={4}
              className="input"
              placeholder="Anotações adicionais sobre a venda..."
              {...register('notes')}
            ></textarea>
          </div>
          
          {loading && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Enviando fotos...</span>
                <span className="text-sm text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-violet-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-outline mr-2"
              onClick={() => navigate('/sales')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </span>
              ) : (
                'Salvar Venda'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewSalePage;