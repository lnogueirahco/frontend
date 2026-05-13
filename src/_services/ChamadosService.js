import { useCallback } from "react";

import axios from "axios";

function useChamadosService() {
    const resumirChamado = useCallback(async (chamado) => { 
        if (!chamado) return;

        try {
            const response = await axios.get('/api/chamados/resumir/' + chamado.id);
            const analise = response?.data || "Sem análise disponível";
            return analise; 
        } catch (err) {
            console.error(err);
        }
    }, []);

    const buscarAgendamentos = useCallback(async (operatorId = null) => { 
        operatorId = 'acd660924f28324b3474cb4f5baacd86'; // quando implementar login, trocar dinamicamente ao usuário logado. 

        try {
            const response = await axios.get('/api/planejamentos/' + operatorId);
            return response.data; 
        } catch (err) {
            console.error(err);
        }
    }, []); 

    const criarAgendamento = useCallback(async (agendamento) => { 
        const formatarDataLocal = (data) => {
            if (!data) return null;
            const d = new Date(data);
            if (isNaN(d.getTime())) return null;

            // Ajusta o fuso horário manualmente para pegar a string local
            const offset = d.getTimezoneOffset() * 60000;
            const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, -1); 
            // O .slice(0, -1) remove o "Z" do final para o .NET não tentar converter de volta
            return localISOTime;
        };

        const agendamentoEnviar = {
            IdAgendamentoTicket: agendamento.IdAgendamentoTicket,
            IdTicket: String(agendamento.IdTicket),
            DataInicio: formatarDataLocal(agendamento.DataInicio),
            DataFim: formatarDataLocal(agendamento.DataFim)
        };

        try {
            const response = await axios.post('/api/planejamento', agendamentoEnviar, {
                headers: { 'Content-Type': 'application/json' }
            });
            return response.status; 
        } catch (err) {
            console.error("Erro no POST:", err.response?.data || err.message);
            throw err;
        }
    }, []);

    const atualizarAgendamento = useCallback(async (agendamento) => { 
        // Função para manter a hora exatamente como aparece na tela (Local)
        const formatarDataLocal = (data) => {
            if (!data) return null;
            const d = new Date(data);
            if (isNaN(d.getTime())) return null;

            // Compensação manual do fuso para evitar o salto de +3h do ISO
            const offset = d.getTimezoneOffset() * 60000;
            // Removemos o 'Z' para o .NET não tratar como UTC
            return new Date(d.getTime() - offset).toISOString().slice(0, -1);
        };

        const agendamentoEnviar = {
            IdAgendamentoTicket: agendamento.IdAgendamentoTicket,
            IdTicket: String(agendamento.IdTicket),
            DataInicio: formatarDataLocal(agendamento.DataInicio),
            DataFim: formatarDataLocal(agendamento.DataFim)
        };

        try {
            const response = await axios.put(
                `/api/planejamento/${agendamento.IdAgendamentoTicket}`, 
                agendamentoEnviar, 
                { headers: { 'Content-Type': 'application/json' } }
            );
            return response.status; 
        } catch (err) {
            // Log limpo para facilitar o seu monitoramento
            console.error(`# Erro ao atualizar:`, err.response?.data || err.message);
            throw err; // Mantemos o throw para o Modal saber que deve manter o loading/erro
        }
    }, []);

    const deletarAgendamento = useCallback(async (id) => { 
        try {
            const response = await axios.delete('/api/planejamento/' + id);
            return response.status; 
        } catch (err) {
            console.error(err);
        }
    }, []);

    return { resumirChamado, buscarAgendamentos, criarAgendamento, atualizarAgendamento, deletarAgendamento};
}


export default useChamadosService;