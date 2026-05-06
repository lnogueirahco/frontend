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
            const response = await axios.get("/v2.0/ticket/list?situation=2,3&operator_id=acd660924f28324b3474cb4f5baacd86&column=protocol",
                { headers: { Authorization: "Bearer 225815e713457d070635b28b4a10f87a"}}
            );

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

    useEffect(() => { CarregarChamados(); }, []);

    return state;
}

export default useChamadosService;