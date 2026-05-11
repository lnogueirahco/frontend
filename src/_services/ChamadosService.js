import { useState, useEffect, useCallback } from "react";

import axios from "axios";

function useChamadosService() {

    const [state, setState] = useState({
        loading: false,
        error: null,
        mensagem: '',
        chamados: []
    });

    const CarregarChamados = useCallback(async () => { 
        setState(prev => ({ ...prev, loading: true }));

        try {
            const response = await axios.get("/api/chamados");

            setState(prev => ({...prev, chamados: response.data, loading: false}));
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

    useEffect(() => { CarregarChamados(); }, [CarregarChamados]);

return { ...state, CarregarChamados };

}

export default useChamadosService;