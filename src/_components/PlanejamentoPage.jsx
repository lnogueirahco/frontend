import './../App.css';
import '@mantine/core/styles.css'; 
import 'mantine-datatable/styles.css'; 
import React, {useState} from 'react';
import { Group, Text, Title, Box, Stack } from '@mantine/core';
import Planner from './Planner';
import { useQuery } from '@tanstack/react-query';
import useChamadosService from './../_services/ChamadosService';
import LoadingOverlay from './LoadingOverlay'; 
import ChamadosPlanner from './ChamadosPlanner';
import buscarChamados from '../_services/buscarChamados';
import ModalAgendamentoChamado from './ModalAgendamentoChamado';

function PlanejamentoPage() {   
    const { buscarAgendamentos, criarAgendamento, atualizarAgendamento, deletarAgendamento} = useChamadosService(); 

    const [state, setState] = useState({
        loading: false,
        error: null,
        mensagem: '',
        modal: {
            chamado: {}, 
            open: false
        }
    });

    const { data: agendamentos, loadingAgendamentos } = useQuery({
        queryKey: ['agendamentos-calendario'],
        queryFn: buscarAgendamentos, 
        refetchInterval: 5000, 
    }); 

    const { data: chamadosBacklog, loadingBacklog } = useQuery({
        queryKey: ['chamados-agendamento'], 
        queryFn: buscarChamados, 
        refetchInterval: 5000, 
    });

    const fecharModal = () => {
            setState(prev => ({
                ...prev,
                modal: { ...prev.modal, open: false }
            }));
        };
    
    const abrirModal = async (agendamento) => {
      setState(prev => ({ ...prev, loading: true })); 
    
       console.log(agendamento)

      const chamado = {
        id: agendamento.id || agendamento.idTicket,
        protocol: agendamento.protocol, 
        subject: agendamento.subject
      }

      try {
          setState(prev => ({
              ...prev,
              loading: false,
              modal: { 
                open: true,  
                agendamento: agendamento,
                chamado: chamado, 
              }
          }));
      } catch (err) {
          setState(prev => ({ ...prev, loading: false, error: "Erro no resumo" }));
      }
    };

    const confirmarModal = async (chamadoAgendamento, isEditar) => {
      setState(prev => ({ ...prev, loading: true })); 
      try {
        if(!isEditar)
            criarAgendamento(chamadoAgendamento);
        else 
            atualizarAgendamento(chamadoAgendamento);

        setState(prev => ({
              ...prev,
              loading: false
          }));
      } catch (err) {
          setState(prev => ({ ...prev, loading: false, error: "Erro no resumo" }));
      }
    };

    const deletarModal = async (idAgendamento) => {
      setState(prev => ({ ...prev, loading: true })); 
      try {
        deletarAgendamento(idAgendamento);
        
        setState(prev => ({
              ...prev,
              loading: false
          }));
      } catch (err) {
          setState(prev => ({ ...prev, loading: false, error: "Erro no resumo" }));
      }
    };

    return ( 
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 relative">
        {loadingAgendamentos && <LoadingOverlay />}

         {state.modal.open 
         && (
            <ModalAgendamentoChamado 
            agendamento={state.modal.agendamento} 
            chamado={state.modal.chamado} 
            onClose={fecharModal}
            onConfirmar={confirmarModal}
            onDeletar={deletarModal}
            />
        )}
        

        <Stack gap="lg" p="xl" className="bg-[#040405] min-h-screen font-sans selection:bg-blue-500/30">
        {/* HEADER */}
        <Group justify="space-between" className="border-b border-zinc-800/50 pb-6 mb-2">
            <Box>
                <Title order={1} className="text-zinc-100 tracking-tighter text-3xl font-black flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                    Planejamento de Desenvolvimento
                </Title>
                <Text size="xs" className="text-zinc-500 font-mono uppercase tracking-[0.2em] mt-2 ml-6">
                    Gerencie prazos e notifique clientes
                </Text>
            </Box>
        </Group>

        {/* CONTEÚDO PRINCIPAL (LADO A LADO) */}
        <Group align="flex-start" grow={false} wrap="nowrap" gap="md">
            
            {/* BARRA LATERAL (Largura fixa para não esmagar) */}
            <Box w={350}>
                <ChamadosPlanner chamados={chamadosBacklog} abrirModal={abrirModal}  />
            </Box>

            {/* CALENDÁRIO (Cresce para ocupar o resto da tela) */}
            <Box className="flex-1 min-w-0">
                <Planner chamados={agendamentos} abrirModal={abrirModal} />
            </Box>

        </Group>
    </Stack>
    </div>
    );
}

export default PlanejamentoPage;