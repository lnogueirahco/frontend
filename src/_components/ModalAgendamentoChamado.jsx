import { useState, useEffect } from 'react';
import { Modal, Button, Group, Text, Stack, Textarea, Box, Divider, LoadingOverlay, Tooltip } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Calendar, Tag, Clock, Trash2 } from 'lucide-react';
import 'dayjs/locale/pt-br';
import { Link } from 'react-router-dom';

function ModalAgendamentoChamado({ agendamento, chamado, onClose, onConfirmar, onDeletar }) {
  const [dataFim, setDataFim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState(new Date());
  const href = 'https://console.tomticket.com/dashboard/ticket/history/'; // todo mudar isso e deixar no obj já montado. 
  const isEditar = !!agendamento?.idAgendamentoTicket && agendamento.idAgendamentoTicket > 0;

  console.log(agendamento);
  console.log(chamado);

useEffect(() => {
  if (agendamento && agendamento.idAgendamentoTicket > 0) {
    setDataInicio(agendamento.dataInicio ? new Date(agendamento.dataInicio) : new Date());
    setDataFim(agendamento.dataFim ? new Date(agendamento.dataFim) : new Date());
  } else {
    const hoje = new Date();
    setDataInicio(hoje);
    
    const umaHoraDepois = new Date();
    umaHoraDepois.setHours(hoje.getHours() + 1);
    setDataFim(umaHoraDepois);
  }
}, [agendamento]);

  const handleConfirmar = async () => {
    if (!dataInicio || !dataFim) return;

    setLoading(true);
    
    const dadosParaEnviar = {
      IdAgendamentoTicket: isEditar ? agendamento.idAgendamentoTicket : 0,
      IdTicket: agendamento?.id || chamado?.id, 
      DataInicio: dataInicio,
      DataFim: dataFim
    };

    try {
      await onConfirmar(dadosParaEnviar, isEditar);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

    const handleDeletar = async () => {
    if (!dataInicio || !dataFim) return;

    setLoading(true);
    
    try {
        onDeletar(agendamento.idAgendamentoTicket)
        onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={!!agendamento || !!chamado}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Calendar size={20} className="text-blue-500" />
          <Text fw={900} className="text-zinc-100 uppercase tracking-tighter text-lg">
            {isEditar ? 'Editar Alocação  ' : 'Novo Planejamento  '} 
            <span className="text-blue-500 font-bold hover:underline">
              <Link 
                to={`${href}${agendamento?.IdTicket || chamado?.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                #{agendamento?.protocol || chamado?.protocol}
              </Link>
            </span>
     </Text>
        </Group>
      }
      centered
      size="md"
      radius="lg"
      padding="xl"
      overlayProps={{ color: '#000', opacity: 0.85, blur: 10 }}
      styles={{
        header: { backgroundColor: '#111113', borderBottom: '1px solid #27272a' },
        content: { backgroundColor: '#111113', border: '1px solid #27272a', position: 'relative' },
        close: { color: '#71717a', '&:hover': { backgroundColor: '#27272a', color: '#fff' } }
      }}
    >
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} loaderProps={{ color: 'blue' }} />

      <Stack gap="xl">
        <Box className="bg-[#18181b] p-4 border border-zinc-800/50 rounded-lg mt-4">
            <Group gap={8} mb={4}>
               <Tag size={14} className="text-zinc-500" />
               <Text size="xs" fw={800} className="text-zinc-500 uppercase">Assunto:</Text>
            </Group>
            <Text size="sm" fw={600} className="text-zinc-200 line-clamp-2">
              {agendamento?.assunto || chamado?.subject}
            </Text>
        </Box>

        <Divider label="Janela de Trabalho" labelPosition="center" className="text-zinc-700" />

        <Group grow wrap="nowrap">
          <DateTimePicker
            label="Início"
            placeholder="Data e Hora"
            locale="pt-br"
            value={dataInicio}
            onChange={setDataInicio}
            defaultValue={new Date()} 
            dropdownType="popover"
            valueFormat="DD/MM/YYYY HH:mm"
            variant="filled"
            leftSection={<Clock size={16} className="text-blue-500" />}
            styles={dateInputStyles}
          />
          <DateTimePicker
            label="Término"
            placeholder="Data e Hora"
            locale="pt-br"
            value={dataFim}
            onChange={setDataFim}
            defaultValue={new Date()} 
            dropdownType="popover"
            valueFormat="DD/MM/YYYY HH:mm"
            variant="filled"
            leftSection={<Clock size={16} className="text-blue-500" />}
            styles={dateInputStyles}
          />
        </Group>

        <Textarea
          label="Observações"
          placeholder="Detalhes técnicos da tarefa..."
          variant="filled"
          radius="md"
          minRows={3}
          styles={inputStyles}
        />

        <Stack gap="xs" mt="lg">
          <Button 
            fullWidth 
            size="md" 
            className="bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
            onClick={handleConfirmar}
            loading={loading}
          >
            {isEditar ? 'Atualizar Agendamento' : 'Criar Agendamento'}
          </Button>

          <Group grow gap="sm">
            <Button variant="subtle" color="gray" onClick={onClose} className="text-zinc-500">
              Cancelar
            </Button>
            
            {isEditar && (
              <Button 
                variant="light" 
                color="red" 
                onClick={handleDeletar}
                leftSection={<Trash2 size={16} />}
              >
                Excluir
              </Button>
            )}
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}

const inputStyles = {
  label: { color: '#a1a1aa', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' },
  input: { 
    backgroundColor: '#18181b', 
    border: '1px solid #27272a', 
    color: '#f4f4f5',
    '&:focus': { borderColor: '#3b82f6' } 
  },
};

const dateInputStyles = {
  ...inputStyles,
  calendarHeader: { color: '#f4f4f5' },
  day: { color: '#f4f4f5', '&:hover': { backgroundColor: '#27272a' } },
  monthThead: { color: '#71717a' },
};

export default ModalAgendamentoChamado;