import React, { useState } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Title } from '@mantine/core';

const Planner = ({ chamados, abrirModal }) => {
  const [view, setView] = useState('week');
  const [currentDate] = useState(new Date()); 

  const horaInicio = 7;
  const totalHoras = 11; 
  const alturaHora = 60; 

  const getDays = () => {
    if (view === 'day') return [currentDate];
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  };

  const diasParaExibir = getDays();
  const labelsHoras = Array.from({ length: totalHoras }, (_, i) => i + horaInicio);

  return (
    <div className="bg-black min-h-screen p-6 text-zinc-100 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <Title order={1} className="text-zinc-100 tracking-tighter text-3xl font-black flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            {format(currentDate, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
        </Title>
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 shadow-xl">
          {['day', 'week', 'month'].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {v === 'day' ? 'Hoje' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 shadow-2xl">
        
        {/* EIXO VERTICAL */}
        {view !== 'month' && (
          <div className="w-20 bg-zinc-900/50 border-r border-zinc-800 pt-12">
            {labelsHoras.map(hora => (
              <div key={hora} style={{ height: `${alturaHora}px` }} className="text-[10px] font-mono text-zinc-600 flex justify-center items-start border-b border-zinc-800/30 pt-1">
                {String(hora).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        )}

        {/* GRADE DE DIAS */}
        <div className={`flex-1 grid gap-px bg-zinc-800 ${view === 'month' ? 'grid-cols-7' : `grid-cols-${diasParaExibir.length}`}`}>
          {diasParaExibir.map((dia) => {
            const ticketsDoDia = chamados?.filter(c => c.dataInicio?.substring(0, 10) === format(dia, 'yyyy-MM-dd')) || [];

            return (
              <div key={dia.toString()} className="bg-zinc-950 flex flex-col min-w-0 border-r border-zinc-900/30 relative">
                
                <div className="p-3 border-b border-zinc-900 bg-zinc-900/20 sticky top-0 z-20">
                  <p className="text-[10px] font-black text-zinc-600 uppercase">{format(dia, 'eee', { locale: ptBR })}</p>
                  <p className={`text-lg font-bold ${isSameDay(dia, new Date()) ? 'text-blue-500' : 'text-zinc-300'}`}>{format(dia, 'dd')}</p>
                </div>

                <div className="relative flex-1" style={view !== 'month' ? { height: `${totalHoras * alturaHora}px` } : { minHeight: '120px' }}>
                  
                  {view !== 'month' ? (
                    <>
                      {/* Indicador de Hora Atual */}
                      {isSameDay(dia, new Date()) && (() => {
                        const agora = new Date();
                        const horaDecimal = agora.getHours() + agora.getMinutes() / 60;
                        if (horaDecimal >= horaInicio && horaDecimal <= (horaInicio + totalHoras)) {
                          return (
                            <div className="absolute w-full z-40 pointer-events-none flex items-center" style={{ top: `${(horaDecimal - horaInicio) * alturaHora}px` }}>
                              <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                              <div className="flex-1 h-[1px] bg-red-500/60" />
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Linhas de Grade de Fundo */}
                      {labelsHoras.map(h => (
                        <div key={h} style={{ height: `${alturaHora}px` }} className="border-b border-zinc-900/50" />
                      ))}

                      {/* RENDERIZAÇÃO DOS TICKETS COM CÁLCULO DE COLISÃO */}
                      {ticketsDoDia.map((ticket) => {
                        // Detecta todos os tickets que ocupam o mesmo intervalo de tempo
                        const sobrepostos = ticketsDoDia.filter(t => 
                          (ticket.inicio < (t.inicio + t.duracao)) && 
                          ((ticket.inicio + ticket.duracao) > t.inicio)
                        );

                        // Define a largura e a posição horizontal baseada na quantidade de sobreposições
                        const totalSobrepostos = sobrepostos.length;
                        const indexNoGrupo = sobrepostos.sort((a, b) => a.protocol.localeCompare(b.protocol)).findIndex(t => t.protocol === ticket.protocol);
                        
                        const largura = 100 / totalSobrepostos;
                        const posicaoEsquerda = largura * indexNoGrupo;

                        return (
                          <div
                            key={ticket.protocol}
                            onClick={() => abrirModal(ticket)}
                            className="absolute p-2 rounded-xl border border-zinc-800/50 shadow-2xl cursor-pointer hover:scale-[1.02] hover:z-50 transition-all backdrop-blur-md group overflow-hidden"
                            style={{
                              top: `${(ticket.inicio - horaInicio) * alturaHora}px`,
                              height: `${ticket.duracao * alturaHora}px`,
                              width: `${largura - 1}%`, // -1% para um gap visual pequeno entre colunas
                              left: `${posicaoEsquerda + 0.5}%`,
                              backgroundColor: `${ticket.cor}25`,
                            }}
                          >
                            {/* Detalhe Lateral Colorido */}
                            <div 
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                              style={{ backgroundColor: ticket.cor }}
                            />

                            <div className="flex flex-col h-full">
                              <div className="flex justify-between items-start mb-1 shrink-0">
                                <span className="text-[9px] font-mono font-bold text-zinc-500 truncate group-hover:text-zinc-300">
                                  #{ticket.protocol}
                                </span>
                                <span className="bg-black/40 px-1 rounded text-[8px] font-bold text-zinc-400">
                                  {Number(ticket.duracao).toFixed(2).replace('.', ',')}h
                                </span>
                              </div>

                              <h4 className="text-[10px] font-bold leading-tight text-zinc-100 group-hover:text-white line-clamp-2 break-words">
                                {ticket.subject}
                              </h4>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    /* VISÃO MENSAL */
                    <div className="p-2 space-y-1">
                      {ticketsDoDia.map(ticket => (
                        <div key={ticket.protocol}
                          onClick={() => abrirModal(ticket)}
                          className="p-1 rounded text-[9px] truncate text-white font-bold"
                          style={{ backgroundColor: ticket.cor }}>
                          #{ticket.protocol}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Planner;