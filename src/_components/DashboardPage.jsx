import './../App.css';
import '@mantine/core/styles.css';
import 'mantine-datatable/styles.css';
import '@mantine/charts/styles.css';
import React, { useState, useMemo } from 'react';
import { Group, Text, Box, Stack, Paper, Badge, Table, Divider, Progress } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import Planner from './Planner';
import { useQuery } from '@tanstack/react-query';
import useChamadosService from './../_services/ChamadosService';
import LoadingOverlay from './LoadingOverlay';
import ChamadosPlanner from './ChamadosPlanner';
import buscarChamados from '../_services/buscarChamados';
import ModalAgendamentoChamado from './ModalAgendamentoChamado';
import {
    Home, Folder, Calendar, User,
    Target, AlertTriangle, CheckCircle2, Flame,
    Clock, BarChart2, Activity, TrendingUp,
    Zap, Circle, ChevronRight, Timer
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const HOJE = '2026-05-13';

function formatElapsed(ms) {
    if (!ms) return '—';
    const h = Math.floor(ms / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    return `${h}h`;
}

function formatHora(iso) {
    if (!iso) return '—';
    return iso.split('T')[1]?.substring(0, 5) ?? '—';
}

const PRIORITY_MAP = {
    1: { label: 'Urgente', color: '#f87171', dot: 'bg-red-500' },
    2: { label: 'Alta',    color: '#fb923c', dot: 'bg-orange-400' },
    3: { label: 'Normal',  color: '#60a5fa', dot: 'bg-blue-400' },
};

function getPriorityConfig(p) {
    return PRIORITY_MAP[p] ?? { label: '—', color: '#71717a', dot: 'bg-zinc-500' };
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

/** Cartão KPI com borda colorida à esquerda e ícone flat */
function KpiCard({ label, value, sub, icon: Icon, accentColor, warn }) {
    return (
        <Paper
            p="md"
            radius="sm"
            style={{
                background: '#111113',
                borderTop: '1px solid rgba(63,63,70,0.5)',
                borderRight: '1px solid rgba(63,63,70,0.5)',
                borderBottom: '1px solid rgba(63,63,70,0.5)',
                borderLeft: `3px solid ${warn ? '#f87171' : accentColor}`,
            }}
        >
            <Group justify="space-between" align="flex-start" wrap="nowrap" mb={8}>
                <Text size="xs" style={{ color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>
                    {label}
                </Text>
                <Icon size={15} color={warn ? '#f87171' : accentColor} strokeWidth={1.8} />
            </Group>
            <Text style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: warn ? '#f87171' : '#f4f4f5', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                {value}
            </Text>
            {sub && (
                <Text size="xs" mt={6} style={{ color: '#52525b', fontFamily: 'monospace', fontSize: 10 }}>{sub}</Text>
            )}
        </Paper>
    );
}

/** Badge de prioridade flat */
function PriorityBadge({ priority }) {
    const cfg = getPriorityConfig(priority);
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span style={{ color: cfg.color, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>
                {cfg.label}
            </span>
        </span>
    );
}

/** Item de métrica de backlog */
function BacklogMetric({ icon: Icon, label, value, color }) {
    return (
        <Box style={{ borderLeft: `2px solid ${color}`, paddingLeft: 12 }}>
            <Group gap={6} mb={2} wrap="nowrap">
                <Icon size={12} color={color} strokeWidth={1.8} />
                <Text size="xs" style={{ color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>
                    {label}
                </Text>
            </Group>
            <Text style={{ fontSize: 28, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {value}
            </Text>
        </Box>
    );
}

// ─── Componente principal ────────────────────────────────────────────────────

function DashboardPage() {
    const { buscarAgendamentos, criarAgendamento, atualizarAgendamento, deletarAgendamento } = useChamadosService();

    const [state, setState] = useState({
        loading: false,
        error: null,
        mensagem: '',
        modal: { chamado: {}, open: false },
    });

    const [abaAtiva, setAbaAtiva] = useState('Dashboard');

    const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
        queryKey: ['agendamentos-calendario'],
        queryFn: buscarAgendamentos,
        refetchInterval: 5000,
    });

    const { data: chamadosBacklog, isLoading: loadingBacklog } = useQuery({
        queryKey: ['chamados-agendamento'],
        queryFn: buscarChamados,
        refetchInterval: 5000,
    });

    const agendamentosHoje = useMemo(() => {
        if (!agendamentos) return [];
        return agendamentos.filter(a => a.scheduleDate?.startsWith(HOJE));
    }, [agendamentos]);

    const resumoHoje = useMemo(() => {
        if (agendamentosHoje.length === 0)
            return { totalPlanejado: 0, totalTempoAlocado: 0, totalHorasDosponiveis: 8.8 };
        return agendamentosHoje[0];
    }, [agendamentosHoje]);

    const ocupacaoPercent = useMemo(() => {
        const total = 8.8;
        const usado = resumoHoje.totalTempoAlocado || 0;
        return Math.min(Math.round((usado / total) * 100), 100);
    }, [resumoHoje]);

    const dadosFila = useMemo(() => {
        if (!chamadosBacklog) return { grafico: [], urgente: 0, alta: 0, normal: 0, homologacao: 0, slaCritico: 0, parados: 0, total: 0 };

        const urgente      = chamadosBacklog.filter(c => c.priority === 1).length;
        const alta         = chamadosBacklog.filter(c => c.priority === 2).length;
        const normal       = chamadosBacklog.filter(c => c.priority === 3).length;
        const homologacao  = chamadosBacklog.filter(c => c.statusDescription === 'Em Homologação').length;
        const slaCritico   = chamadosBacklog.filter(c => c.priority === 1 && c.elapsedTime > 500000).length;
        const seteDiasAtras = new Date('2026-05-06');
        const parados      = chamadosBacklog.filter(c => new Date(c.updatedAt) < seteDiasAtras && c.situationId !== 2).length;

        return {
            grafico: [
                { name: 'Urgente', value: urgente,  color: 'red.5'    },
                { name: 'Alta',    value: alta,     color: 'orange.5' },
                { name: 'Normal',  value: normal,   color: 'blue.5'   },
            ],
            urgente, alta, normal, homologacao, slaCritico, parados,
            total: urgente + alta + normal,
        };
    }, [chamadosBacklog]);

    // ── Modal handlers ──────────────────────────────────────────────────────
    const fecharModal  = () => setState(prev => ({ ...prev, modal: { ...prev.modal, open: false } }));

    const abrirModal = async (agendamento) => {
        setState(prev => ({ ...prev, loading: true }));
        const chamado = { id: agendamento.id || agendamento.idTicket, protocol: agendamento.protocol, subject: agendamento.subject };
        try {
            setState(prev => ({ ...prev, loading: false, modal: { open: true, agendamento, chamado } }));
        } catch {
            setState(prev => ({ ...prev, loading: false, error: 'Erro no modal' }));
        }
    };

    const confirmarModal = async (chamadoAgendamento, isEditar) => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            if (!isEditar) criarAgendamento(chamadoAgendamento);
            else atualizarAgendamento(chamadoAgendamento);
            setState(prev => ({ ...prev, loading: false }));
        } catch {
            setState(prev => ({ ...prev, loading: false, error: 'Erro ao salvar' }));
        }
    };

    const deletarModal = async (idAgendamento) => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            deletarAgendamento(idAgendamento);
            setState(prev => ({ ...prev, loading: false }));
        } catch {
            setState(prev => ({ ...prev, loading: false, error: 'Erro ao deletar' }));
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="font-sans selection:bg-blue-500/30" style={{ minHeight: '100vh', background: '#040405', color: '#f4f4f5' }}>

            {(loadingAgendamentos || loadingBacklog || state.loading) && <LoadingOverlay />}

            {state.modal.open && (
                <ModalAgendamentoChamado
                    agendamento={state.modal.agendamento}
                    chamado={state.modal.chamado}
                    onClose={fecharModal}
                    onConfirmar={confirmarModal}
                    onDeletar={deletarModal}
                />
            )}

            {/* ── CORPO PRINCIPAL ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 48px)', overflow: 'hidden' }}>

                {/* ── COL 1: Fila de Chamados ─────────────────────────────── */}
                <aside style={{
                    width: 380, flexShrink: 0,
                    borderRight: '1px solid rgba(63,63,70,0.4)',
                    overflowY: 'hidden',
                    padding: '16px 12px',
                }}>
                    <Group gap={6} mb={12} align="center">
                        <Folder size={13} color="#71717a" strokeWidth={1.8} />
                        <Text style={{ color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>
                            Fila de Chamados
                        </Text>
                        {chamadosBacklog && (
                            <Badge size="xs" variant="filled" color="zinc" style={{ background: '#27272a', color: '#a1a1aa', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                                {chamadosBacklog.length}
                            </Badge>
                        )}
                    </Group>
                    <ChamadosPlanner chamados={chamadosBacklog} abrirModal={abrirModal} />
                </aside>

                {/* ── COL 2: Dashboard Central ─────────────────────────────── */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minWidth: 0 }}>
                    <Stack gap={20}>

                        {/* ── Seção: Metas do Dia ──────────────────────────── */}
                        <section>
                            <Group gap={6} mb={12} align="center">
                                <Target size={13} color="#60a5fa" strokeWidth={1.8} />
                                <Text style={{ color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>
                                    Metas de Hoje — 13 Mai 2026
                                </Text>
                            </Group>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                <KpiCard
                                    label="Tickets Hoje"
                                    value={resumoHoje.totalPlanejado}
                                    sub="Chamados planejados"
                                    icon={Target}
                                    accentColor="#60a5fa"
                                />
                                <KpiCard
                                    label="Horas Alocadas"
                                    value={`${resumoHoje.totalTempoAlocado}h`}
                                    sub={`${ocupacaoPercent}% da capacidade`}
                                    icon={Clock}
                                    accentColor="#a78bfa"
                                />
                                <KpiCard
                                    label="Saldo Livre"
                                    value={`${Math.max(0, resumoHoje.totalHorasDosponiveis)}h`}
                                    sub={resumoHoje.totalHorasDosponiveis < 0 ? 'Sem tempo para alocação' : 'Disponível hoje'}
                                    icon={AlertTriangle}
                                    accentColor="#34d399"
                                    warn={resumoHoje.totalHorasDosponiveis < 0}
                                />
                                <KpiCard
                                    label="Total na Fila"
                                    value={dadosFila.total}
                                    sub={`${dadosFila.urgente} urgentes`}
                                    icon={Activity}
                                    accentColor="#fb923c"
                                    warn={dadosFila.urgente > 0}
                                />
                            </div>

                            {/* Barra de ocupação */}
                            <Paper mt={12} p="sm" radius="sm" style={{ background: '#111113', border: '1px solid rgba(63,63,70,0.4)' }}>
                                <Group justify="space-between" mb={6} align="center">
                                    <Text style={{ color: '#52525b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: 9 }}>
                                        Ocupação do dia
                                    </Text>
                                    <Text size="xs" style={{ color: '#a1a1aa', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                                        {resumoHoje.totalTempoAlocado}h / 8.8h
                                    </Text>
                                </Group>
                                <Progress
                                    value={ocupacaoPercent}
                                    color={ocupacaoPercent >= 100 ? 'red' : ocupacaoPercent >= 80 ? 'orange' : 'blue'}
                                    size={5}
                                    radius="xs"
                                    style={{ background: '#27272a' }}
                                />
                            </Paper>
                        </section>

                        {/* ── Seção: Saúde do Backlog ──────────────────────── */}
                        <section>
                            <Group gap={6} mb={12} align="center">
                                <BarChart2 size={13} color="#fb923c" strokeWidth={1.8} />
                                <Text style={{ color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>
                                    Saúde do Backlog
                                </Text>
                            </Group>

                            <Paper p="lg" radius="sm" style={{ background: '#111113', border: '1px solid rgba(63,63,70,0.4)' }}>
                                <Group gap={40} wrap="nowrap" align="center">

                                    {/* Donut */}
                                    <Box style={{ flexShrink: 0 }}>
                                        {dadosFila.grafico.length > 0 && dadosFila.grafico.some(d => d.value > 0) ? (
                                            <DonutChart
                                                data={dadosFila.grafico}
                                                withLabelsLine
                                                labelsType="percent"
                                                withLabels
                                                size={150}
                                                thickness={22}
                                                strokeWidth={0}
                                            />
                                        ) : (
                                            <Box style={{ width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #27272a' }}>
                                                <Text size="xs" style={{ color: '#52525b' }}>Sem dados</Text>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Divider */}
                                    <div style={{ width: 1, height: 100, background: 'rgba(63,63,70,0.4)', flexShrink: 0 }} />

                                    {/* Breakdown por prioridade */}
                                    <Stack gap={10} style={{ flexShrink: 0, minWidth: 120 }}>
                                        <Text style={{ color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>Distribuição</Text>
                                        {[
                                            { label: 'Urgente', value: dadosFila.urgente, color: '#f87171' },
                                            { label: 'Alta',    value: dadosFila.alta,    color: '#fb923c' },
                                            { label: 'Normal',  value: dadosFila.normal,  color: '#60a5fa' },
                                        ].map(({ label, value, color }) => (
                                            <Group key={label} gap={8} justify="space-between" align="center">
                                                <Group gap={6}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                                                    <Text size="xs" style={{ color: '#a1a1aa' }}>{label}</Text>
                                                </Group>
                                                <Text size="sm" style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</Text>
                                            </Group>
                                        ))}
                                    </Stack>

                                    {/* Divider */}
                                    <div style={{ width: 1, height: 100, background: 'rgba(63,63,70,0.4)', flexShrink: 0 }} />

                                    {/* Métricas críticas */}
                                    <Group gap={32} align="flex-start" wrap="nowrap">
                                        <BacklogMetric icon={Flame}         label="SLA Crítico"     value={dadosFila.slaCritico}  color="#f87171" />
                                        <BacklogMetric icon={Timer}         label="Parados 7d"      value={dadosFila.parados}     color="#fb923c" />
                                        <BacklogMetric icon={CheckCircle2}  label="Homologação"     value={dadosFila.homologacao} color="#34d399" />
                                    </Group>
                                </Group>
                            </Paper>
                        </section>

                        {/* ── Seção: Tickets Agendados Hoje ────────────────── */}
                        <section>
                            <Group gap={6} mb={12} align="center">
                                <CheckCircle2 size={13} color="#34d399" strokeWidth={1.8} />
                                <Text style={{ color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>
                                    Tickets Agendados — Hoje
                                </Text>
                                {agendamentosHoje.length > 0 && (
                                    <Badge size="xs" style={{ background: '#052e16', color: '#4ade80', border: '1px solid #14532d', marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                                        {agendamentosHoje.length}
                                    </Badge>
                                )}
                            </Group>

                            <Paper radius="sm" style={{ background: '#111113', border: '1px solid rgba(63,63,70,0.4)', overflow: 'hidden' }}>
                                <div style={{ maxHeight: 340, overflowY: 'auto', overflowX: 'hidden' }}>
                                    <Table verticalSpacing="sm" horizontalSpacing="md" style={{ tableLayout: 'fixed', width: '100%' }}>
                                        <colgroup>
                                            <col style={{ width: '10%' }} />
                                            <col style={{ width: '36%' }} />
                                            <col style={{ width: '18%' }} />
                                            <col style={{ width: '16%' }} />
                                            <col style={{ width: '10%' }} />
                                            <col style={{ width: '10%' }} />
                                        </colgroup>
                                        <Table.Thead style={{ background: '#0a0a0c', position: 'sticky', top: 0, zIndex: 1 }}>
                                            <Table.Tr style={{ borderBottom: '1px solid rgba(63,63,70,0.5)' }}>
                                                {['#', 'Assunto', 'Horário', 'Prioridade', 'Dur.', 'Score'].map(h => (
                                                    <Table.Th key={h} style={{ color: '#52525b', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                                                        {h}
                                                    </Table.Th>
                                                ))}
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {agendamentosHoje.length > 0 ? (
                                                [...agendamentosHoje]
                                                    .sort((a, b) => b.totalScore - a.totalScore)
                                                    .map((t) => (
                                                        <Table.Tr
                                                            key={t.idAgendamentoTicket}
                                                            style={{ borderBottom: '1px solid rgba(63,63,70,0.2)', cursor: 'pointer', transition: 'background 0.1s' }}
                                                            onClick={() => abrirModal(t)}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(39,39,42,0.4)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Table.Td style={{ overflow: 'hidden' }}>
                                                                <Text size="xs" style={{ fontWeight: 700, color: '#60a5fa', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', fontSize: 11 }}>
                                                                    #{t.protocol}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td style={{ overflow: 'hidden' }}>
                                                                <Text size="sm" style={{ color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={t.subject}>
                                                                    {t.subject}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td style={{ overflow: 'hidden' }}>
                                                                <Text size="xs" style={{ color: '#a1a1aa', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {formatHora(t.dataInicio)}–{formatHora(t.dataFim)}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td style={{ overflow: 'hidden' }}>
                                                                <PriorityBadge priority={t.priority} />
                                                            </Table.Td>
                                                            <Table.Td style={{ overflow: 'hidden' }}>
                                                                <Text size="xs" style={{ color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>
                                                                    {t.duracao ? `${t.duracao}h` : '—'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td style={{ overflow: 'hidden' }}>
                                                                <Text
                                                                    size="sm"
                                                                    style={{
                                                                        fontWeight: 900,
                                                                        fontVariantNumeric: 'tabular-nums',
                                                                        letterSpacing: '-0.02em',
                                                                        color: t.totalScore < 0 ? '#f87171' : t.totalScore > 50 ? '#34d399' : '#e4e4e7',
                                                                    }}
                                                                >
                                                                    {t.totalScore}
                                                                </Text>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))
                                            ) : (
                                                <Table.Tr>
                                                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#3f3f46', fontSize: 13 }}>
                                                        Nenhum chamado planejado para hoje — use a fila lateral para agendar.
                                                    </Table.Td>
                                                </Table.Tr>
                                            )}
                                        </Table.Tbody>
                                    </Table>
                                </div>
                            </Paper>
                        </section>

                    </Stack>
                </main>

                {/* ── COL 3: Calendário ───────────────────────────────────── */}
                <aside style={{
                    width: 420, flexShrink: 0,
                    borderLeft: '1px solid rgba(63,63,70,0.4)',
                    overflowY: 'auto',
                    padding: '16px 12px',
                }}>
                    <Group gap={6} mb={12} align="center">
                        <Calendar size={13} color="#71717a" strokeWidth={1.8} />
                        <Text style={{ color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 900, fontSize: 9 }}>
                            Planejamento diário
                        </Text>
                    </Group>
                    <Planner chamados={agendamentos} abrirModal={abrirModal} navegacaoAtiva={false} />
                </aside>

            </div>
        </div>
    );
}

export default DashboardPage;