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

    return { resumirChamado };
}

export default useChamadosService;