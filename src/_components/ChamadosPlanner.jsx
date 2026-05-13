import { useState } from 'react';
import { Paper, Text, TextInput, ActionIcon, Group, Box, ScrollArea, Badge, Title } from '@mantine/core';
import { Search, CalendarPlus } from 'lucide-react';

function ChamadosPlanner({ chamados, abrirModal }) {
  const [search, setSearch] = useState('');

  const chamadosFiltrados = (chamados || [])
    .filter(c => 
      c.subject?.toLowerCase().includes(search.toLowerCase()) || 
      c.protocol?.toString().includes(search) || 
      (c.organizationName && c.organizationName.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (!a.scheduleDate && b.scheduleDate) return -1;
      if (a.scheduleDate && !b.scheduleDate) return 1;

      if (a.scheduleDate && b.scheduleDate) {
        return new Date(a.scheduleDate) - new Date(b.scheduleDate);
      }
      return 0;
    });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return '#ef4444';
      case 2: return '#f59e0b';
      case 3: return '#3b82f6';
      default: return '#71717a';
    }
  };

  return (
    <Paper 
      w={350} 
      radius="lg" 
      p="md"
      className="bg-[#0b0b0d] border border-zinc-800/50 shadow-2xl"
      // Trava o container externo para não crescer com o conteúdo
      style={{ 
        height: '85vh', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }} 
    >
      {/* HEADER - Altura Fixa */}
      <Box style={{ flexShrink: 0, marginBottom: '16px' }}>
        <Group position="apart" mb="xs" align="center">
          <Title order={4} className="text-zinc-100 tracking-tighter font-black text-lg uppercase">
            Chamados abertos
          </Title>
          <Badge 
            variant="filled" 
            className="bg-red-500/10 text-red-500 border border-red-500/20 font-bold" 
            size="sm"
          >
            {chamadosFiltrados.length}
          </Badge>
        </Group>

        <TextInput
          placeholder="Buscar chamado..."
          variant="filled"
          size="xs"
          icon={<Search size={14} className="text-zinc-500" />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          styles={{
            input: { backgroundColor: '#161618', border: '1px solid #27272a', color: '#f4f4f5', height: '40px' }
          }}
        />
      </Box>

      {/* ÁREA DE SCROLL - A mágica do ScrollArea.Autosize */}
      <ScrollArea.Autosize 
        maxtheight="100%" 
        style={{ flex: 1 }} 
        mx="-md" // Compensa o padding do Paper para a barra encostar na borda se quiser
        px="md"
        scrollbarSize={6}
        offsetScrollbars
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
          {chamadosFiltrados.map((chamado) => (
            <Paper
              key={chamado.protocol}
              radius="md"
              className="group bg-[#141416] border border-zinc-800/30 hover:border-zinc-700/80 transition-all duration-200 relative overflow-hidden"
            >
              <Box 
                className="absolute left-0 top-0 bottom-0 w-[3px]" 
                style={{ backgroundColor: getPriorityColor(chamado.priority) }}
              />

              <Box p="sm" pl="md">
                <Group position="apart" noWrap align="flex-start">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="10px" weight={800} className="text-blue-500/90 font-mono mb-1">
                      #{chamado.protocol}
                    </Text>
                    
                    <Text size="xs" weight={700} className="text-zinc-200 leading-tight mb-3 line-clamp-2">
                      {chamado.subject}
                    </Text>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Group spacing={4} noWrap>
                        <Text size="9px" weight={900} className="text-zinc-600 uppercase">Cliente:</Text>
                        <Text size="10px" weight={600} className="text-zinc-400 truncate">
                          {chamado.organizationName || 'N/A'}
                        </Text>
                      </Group>
                      <Group spacing={4}>
                        <Text size="9px" weight={900} className="text-zinc-600 uppercase">Prioridade:</Text>
                        <Text 
                          size="10px" 
                          weight={800} 
                          style={{ color: getPriorityColor(chamado.priority) }}
                        >
                          Pr. {chamado.priority || 0}
                        </Text>
                      </Group>
                      
                      {chamado.scheduleDate &&
                      <Group spacing={4} noWrap>
                        <Text size="9px" weight={900} className="text-zinc-600 uppercase">Data agendamento:</Text>
                        <Text size="10px" weight={600} className="text-zinc-400 truncate text-bold" style={{ color: getPriorityColor(chamado.priority) }}> 
                          {chamado.scheduleDate || 'N/A'}
                        </Text>
                      </Group>
                      } 
                    </div>
                  </div>

                  <ActionIcon 
                    variant="subtle" 
                    size="md" 
                    radius="md"
                    className="bg-zinc-800/20 hover:bg-blue-600 border border-zinc-700/30 transition-colors"
                    onClick={() => abrirModal(chamado)}
                  >
                    <CalendarPlus size={16} className="text-zinc-400 group-hover:text-white" />
                  </ActionIcon>
                </Group>
              </Box>
            </Paper>
          ))}
        </div>
      </ScrollArea.Autosize>
    </Paper>
  );
}

export default ChamadosPlanner;