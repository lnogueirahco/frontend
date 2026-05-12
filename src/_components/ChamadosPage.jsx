import './../App.css';
import '@mantine/core/styles.css'; 
import 'mantine-datatable/styles.css'; 
import useChamadosService from './../_services/ChamadosService';
import TabelaChamados from './../_components/TabelaChamados';
import buscarChamados from "./../_services/buscarChamados"; 
import { useQuery } from '@tanstack/react-query'
import React, { useState } from 'react';
import { ModalResumoChamado } from './../_components/ModalResumoChamado';
import LoadingOverlay from './../_components/LoadingOverlay';

function ChamadosPage({filter}) { 
    
    // Serviços  

    const { resumirChamado } = useChamadosService();

    // Estado  

    const [state, setState] = useState({
        loading: false,
        error: null,
        mensagem: '',
        modal: {
            response: "",
            chamado: {}, 
            open: false
        }
    });

    // Gerenciador de estado

    const { data, isLoading } = useQuery({
        queryKey: ['todos'],
        queryFn: buscarChamados, 
        refetchInterval: 5000, 
    }); 

    // Functions Handles 

    const fecharModal = () => {
            setState(prev => ({
                ...prev,
                modal: { ...prev.modal, open: false }
            }));
        };
    
    const abrirModal = async (chamado) => {
      setState(prev => ({ ...prev, loading: true })); 

      try {
          const resultado = await resumirChamado(chamado);          
          setState(prev => ({
              ...prev,
              loading: false,
              modal: { 
                open: true, 
                response: resultado.analise, 
                chamado: chamado, 
              }
          }));
      } catch (err) {
          setState(prev => ({ ...prev, loading: false, error: "Erro no resumo" }));
      }
  };
    
    // Conteúdo página
    
    return ( 
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 relative">
          
          {/* O Loading aparece por cima de tudo se estiver carregando a IA */}
          {state.loading && <LoadingOverlay />}
          {isLoading && <LoadingOverlay />}

          {state.modal.open && (
            <ModalResumoChamado 
              response={state.modal.response} 
              chamado={state.modal.chamado} 
              onClose={fecharModal}
            />
          )}

          <div className="p-4 space-y-4 flex-1">            
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/40 overflow-hidden shadow-sm">
               <TabelaChamados 
                    chamados={data} 
                    filter={filter} 
                    abrirModal={abrirModal} 
                  />
            </div>
          </div>
        </div>
     );
}

export default ChamadosPage;