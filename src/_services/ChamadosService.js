import { useState, useCallback } from "react";

import axios from "axios";

function useChamadosService() {
    const [state, setState] = useState({
        loading: false,
        error: null,
        mensagem: '',
        modal: {
            response: [],
            chamado: {}, 
            open: false
        }
    });

    const fecharModal = () => {
        setState(prev => ({
            ...prev,
            modal: { ...prev.modal, open: false }
        }));
    };

    const abrirModal = useCallback(async (chamado) => { 
        if (!chamado) return;

        setState(prev => ({ ...prev, loading: true }));
        try {
            const response = await axios.get('/api/chamados/resumir/' + chamado.id);
            setState(prev => ({
                ...prev,
                loading: false,
                modal: {
                    chamado: chamado,
                    response: response.data.analise, 
                    open: true
                }
            }));
        } catch (err) {
            console.error(err);
            setState(prev => ({
                ...prev,
                error: true,
                mensagem: "Erro ao carregar os dados",
                loading: false
            }));
        }
    }, []);

    return { ...state, abrirModal, fecharModal };
}

export default useChamadosService;