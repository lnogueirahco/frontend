import { useState, useEffect } from 'react';
import { Group, Text, Paper, Title, Stack, Box } from '@mantine/core';
import { Badge } from "../components/ui/badge"; // Assumindo seu Shadcn ui
import { parseISO, differenceInDays, formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles } from 'lucide-react';
// Configuração rígida de cores e alertas
const DASHBOARD_CONFIG = {
  MIN_EXCELLENT_RATING: 4.5,
  MIN_WARNING_RATING: 4.1, // Ajuste fino: abaixo de 4.0 já é crítico
  COLORS: {
    EXCELLENT: 'text-emerald-400',
    WARNING: 'text-amber-400',
    CRITICAL: 'text-red-500',
    EXCELLENT_BG: 'bg-emerald-500/10 border-emerald-500/20',
    WARNING_BG: 'bg-amber-500/10 border-amber-500/20',
    CRITICAL_BG: 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_-10px_rgba(239,68,68,0.15)]',
  }
};

// Utilitário para limpar o HTML sujo que vem da API do TomTicket
const stripHtml = (html) => {
  if (!html) return "Sem mensagem registrada.";
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

export function TabelaChamados({ chamados, filter, abrirModal}) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const listaLimpa = Array.isArray(chamados) ? chamados : (chamados?.data || []);
    

    const chamadosFiltrados = listaLimpa?.filter(item => {

      const termoBusca = typeof filter === 'string' ? filter.toLowerCase() : "";

      const matchProtocolo = item.protocol?.toString().includes(termoBusca);
      
      const matchOrganizacao = item.organizationName?.toLowerCase().includes(termoBusca);

      return matchProtocolo || matchOrganizacao;
    }) ?? [];

    const listaProcessada = chamadosFiltrados.map((chamado) => {
      const hoje = new Date();
      
      // Parse seguro das datas
      const dataSLA = chamado.slaDeadlineDate ? parseISO(chamado.slaDeadlineDate) : null;
      const dataAtualizacao = chamado.updatedAt ? parseISO(chamado.updatedAt) : hoje;
      const lastMessageDateParsed = chamado.lastMessageDate ? parseISO(chamado.lastMessageDate) : null;
      const scheduleDateParsed = chamado.scheduleDate ? parseISO(chamado.scheduleDate) : null;
      
      const diasSemInteracao = differenceInDays(hoje, dataAtualizacao);
      const isSlaVencido = dataSLA && dataSLA < hoje;
      const isHomologacao = chamado.statusDescription?.includes("Homologação");
      const isEmAtendimento = chamado.statusDescription === "Em Atendimento";

      // Análise de Rating para cores dinâmicas
      const rating = chamado.mediaAvaliacaoCliente || 0;
      const isCriticalRating = rating > 0 && rating < DASHBOARD_CONFIG.MIN_WARNING_RATING;
      const isWarningRating = rating >= DASHBOARD_CONFIG.MIN_WARNING_RATING && rating < DASHBOARD_CONFIG.MIN_EXCELLENT_RATING;
      
      const ratingColor = isCriticalRating ? DASHBOARD_CONFIG.COLORS.CRITICAL : 
                          isWarningRating ? DASHBOARD_CONFIG.COLORS.WARNING : 
                          DASHBOARD_CONFIG.COLORS.EXCELLENT;

      const cardStyle = isCriticalRating ? DASHBOARD_CONFIG.COLORS.CRITICAL_BG :
                        isWarningRating ? DASHBOARD_CONFIG.COLORS.WARNING_BG :
                        'bg-zinc-900/40 border-zinc-800/60';

      let scoreAdicional = 0;

      if (rating > 0 && !isHomologacao) { 
        if (rating < DASHBOARD_CONFIG.MIN_WARNING_RATING) {
          chamado.totalScore  += 5; 
        } else if (rating < DASHBOARD_CONFIG.MIN_EXCELLENT_RATING) {
          chamado.totalScore +=  1;
        }
      }

      const motivos = [];
      if (chamado.situationId === 3) motivos.push("Respondido pelo cliente");
      if (isSlaVencido) motivos.push("SLA Estourado");
      if (isHomologacao) motivos.push("Em Homologação");
      if (isEmAtendimento) motivos.push("Em Atendimento");
      if (isCriticalRating) motivos.push("Risco de Detração");

      // Insight focado em ação rápida
      let insight = "Acompanhamento operacional normal.";
      if (isCriticalRating) {
        insight = `ALERTA: Média do cliente está em ${rating.toFixed(1)}.`;
      } else if (isSlaVencido) {
        insight = "SLA expirado. Pare o que estiver fazendo e assuma este ticket.";
      } else if (isHomologacao) {
        insight = diasSemInteracao >= 3 
          ? `Cobrar cliente: ${diasSemInteracao} dias sem retorno na homologação.` 
          : "Aguardando validação do cliente.";
      }

      // Configuração baseada no Score da View
      let config = { riskText: "text-zinc-300" };
      if (chamado.totalScore >= 20) config.riskText = "text-red-400";
      else if (chamado.totalScore >= 10) config.riskText = "text-amber-400";

      return {
        ...chamado,
        motivos,
        insight,
        config,
        ratingColor,
        cardStyle,
        isCriticalRating,
        isSlaVencido,
        isHomologacao,
        // Datas formatadas em STRING para evitar o erro do React
        displayAtualizacao: formatDistanceToNow(dataAtualizacao, { addSuffix: true, locale: ptBR }),
        displayLastMessageDate: lastMessageDateParsed ? format(lastMessageDateParsed, "dd/MM 'às' HH:mm") : "--/--", 
        displayScheduleDate: scheduleDateParsed ? format(scheduleDateParsed, "dd/MM 'às' HH:mm") : null, 
        // Textos limpos
        cleanLastMessageAtendente: stripHtml(chamado.lastMessageAtendente),
        cleanLastMessage: stripHtml(chamado.lastMessage)
      };
    });

    setRecords([...listaProcessada].sort((a, b) => b.totalScore - a.totalScore));
  }, [chamados, filter]);

  return (
    <Stack gap="lg" p="xl" className="bg-[#040405] min-h-screen font-sans selection:bg-blue-500/30">
      
      {/* HEADER TÁTICO */}
      <Group justify="space-between" className="border-b border-zinc-800/50 pb-6 mb-2">
        <Box>
          <Title order={1} className="text-zinc-100 tracking-tighter text-3xl font-black flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            Ticket Expert Manager <span className="text-zinc-600 font-mono text-lg font-normal">/ v2</span>
          </Title>
          <Text size="xs" className="text-zinc-500 font-mono uppercase tracking-[0.2em] mt-2 ml-6">
            Priorização Analítica de Suporte
          </Text>
        </Box>
        
        <Group gap="md">
          <div className="px-5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-end">
            <Text className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Ativos</Text>
            <Text className="text-white text-xl font-black tabular-nums leading-none mt-1">{records.length}</Text>
          </div>
        </Group>
      </Group>

      {/* RENDER DOS CARDS */}
      <Stack gap="md">
        {records.map((item) => (
          <Paper 
            key={item.id} 
            radius="lg" 
            className={`
              relative overflow-hidden transition-all duration-300 border
              hover:border-zinc-500 hover:scale-[1.005] group
              ${item.cardStyle}
            `}
          >
            {/* Barra lateral indicadora de SLA */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isSlaVencido ? 'bg-red-500' : 'bg-emerald-500'}`} />

            <div className="flex flex-col xl:flex-row pl-1">
              
              {/* === BLOCO ESQUERDO: CONTEXTO (65%) === */}
              <div className="flex-1 p-6 border-b xl:border-b-0 xl:border-r border-zinc-800/40">
                <Group justify="space-between" mb="md">
                  <Group gap="sm">
                    <Text className="font-mono text-[11px] text-zinc-400 bg-black/40 px-2 py-1 rounded border border-zinc-800">
                      #{item.protocol}
                    </Text>
                    <Badge variant="outline" className={`text-[10px] border-zinc-700 ${item.isSlaVencido ? 'text-red-400' : 'text-zinc-300'}`}>
                      {item.statusDescription}
                    </Badge> 
                  

                  <button
                    onClick={() => abrirModal(item)}
                    className="group relative flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-[10px] font-medium text-slate-300 transition-all hover:border-purple-500/50 hover:text-white active:scale-95"
                  >
                    {/* Efeito de Gradiente sutil no fundo ao passar o mouse */}
                    <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    
                    {/* Ícone de Estrelas (IA) */}
                    <Sparkles size={12} className="text-purple-400 group-hover:animate-pulse rounded-full" />
                    
                    <span>Resumir com IA</span>
                  </button>

                  </Group>

                <Group gap="sm" >
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    {item.displayScheduleDate != null ? "Agendado para " + item.displayScheduleDate : ""} 
                  </Text>  
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    Atualizado {item.displayAtualizacao}
                  </Text>
                    </Group>
                </Group>

                <Title order={3} className="text-zinc-100 text-xl font-bold truncate mb-1">
                  {item.organizationName} 
                </Title>
                <Text className="text-zinc-400 text-sm font-medium mb-5 truncate">
                  {item.subject}
                </Text> 

                {/* VISUALIZADOR DE MENSAGENS (Ação vs Reação) */}
                <Stack gap="sm" className="bg-black/30 p-4 rounded-xl border border-zinc-800/50">
                  
                  {/* SUA RESPOSTA (Em cima, destaque azulado/tech) */}
                  <div className="relative pl-4 border-l-2 border-blue-500 py-1">
                    <Text className="text-blue-400 text-[9px] font-black uppercase tracking-widest mb-1 flex justify-between items-center">
                      <span>Sua Última Resposta (Lucas)</span>
                    </Text>
                    <Text size="sm" className="text-zinc-300 line-clamp-2 leading-relaxed">
                      {item.cleanLastMessageAtendente}
                    </Text>
                  </div>

                  {/* DIVISOR SUTIL */}
                  <div className="h-px w-full bg-gradient-to-r from-zinc-800 to-transparent ml-4 my-1" />

                  {/* RESPOSTA DO CLIENTE (Embaixo, destaque neutro) */}
                  <div className="relative pl-4 border-l-2 border-zinc-600 py-1">
                    <Text className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 flex justify-between items-center">
                      <span>Última do Cliente ({item.customerName?.split(' ')[0]})</span>
                      <span className="font-mono text-[8px]">{item.displayLastMessageDate}</span>
                    </Text>
                    <Text size="sm" className="text-zinc-400 line-clamp-2 leading-relaxed italic">
                      "{item.cleanLastMessage}"
                    </Text>
                  </div>
                </Stack>
              </div>

              {/* === BLOCO DIREITO: MÉTRICAS E DECISÃO (35%) === */}
              <div className="w-full xl:w-[400px] p-6 flex flex-col justify-between">
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  {/* SCORE SYSTEM */}
                  <Box>
                    <Text className="text-zinc-500 text-[10px] uppercase font-black mb-1 tracking-widest">
                      Priority Score
                    </Text>
                    <Text className={`text-5xl font-black tracking-tighter leading-none ${item.config.riskText}`}>
                      {item.totalScore}
                    </Text>
                  </Box>

                  {/* RATING DO CLIENTE */}
                  <Box className="text-right">
                    <Text className="text-zinc-500 text-[10px] uppercase font-black mb-1 tracking-widest">
                      Rating Cliente
                    </Text>
                    <Text className={`text-5xl font-black tracking-tighter leading-none ${item.ratingColor}`}>
                      {item.mediaAvaliacaoCliente?.toFixed(1) || "-.-"} de {item.totalAvaliacoesCliente}
                    </Text>
                  </Box>
                </div>

                {/* TAGS RÁPIDAS */}
              <Group gap="xs" mb="sm" justify="end">
                {item.motivos.slice(0, 3).map((motivo) => (
                  <span 
                    key={motivo} 
                    className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700"
                  >
                    {motivo}
                  </span>
                ))}
              </Group>

                {/* CAIXA DE INSIGHT OPERACIONAL */}
                <div className="bg-black/40 rounded-lg p-3 border border-zinc-800/80 mb-4">
                  <Text className="text-zinc-300 text-xs font-medium leading-snug">
                    {item.insight}
                  </Text>
                </div>

                {/* BOTÃO DE AÇÃO */}
                <button
                  onClick={() => window.open(`https://console.tomticket.com/dashboard/ticket/history/${item.id}`, '_blank')}
                  className={`
                    w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-200
                    flex items-center justify-center gap-2
                    ${(item.isCriticalRating || item.isSlaVencido ) && !item.isHomologacao
                      ? 'bg-red-600 hover:bg-red-500 text-white' 
                      : 'bg-zinc-100 hover:bg-white text-black'}
                  `}
                >
                  {(item.isCriticalRating  && !item.isHomologacao )|| item.isSlaVencido ? 'Intervir Imediatamente' : 'Assumir Chamado'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                
              </div>

            </div>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

export default TabelaChamados;