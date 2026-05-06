import { useState, useEffect } from 'react';
import { Group, Text, Paper, Title, Stack, Box } from '@mantine/core';
import { Badge } from "../components/ui/badge";
import {
  parseISO,
  differenceInDays,
  formatDistanceToNow
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TabelaChamados({ chamados }) {

  

  const [records, setRecords] = useState([]);

  useEffect(() => {
    
    const listaLimpa = Array.isArray(chamados)
    ? chamados
    : (chamados?.data || []);

    const listaComScore = listaLimpa.map((chamado) => {

      let score = 0;
      const hoje = new Date();

      const motivos = [];

      const dataSLA = chamado.sla?.deadline?.date
        ? parseISO(chamado.sla.deadline.date)
        : null;

      const dataUltimaAtividade = chamado.status?.apply_date
        ? parseISO(chamado.status.apply_date)
        : hoje;

      const prioridade = chamado.priority || 1;

      const horasPassadas =
        (chamado.elapsed_time || 0) / 3600;

      const diasSemInteracao =
        differenceInDays(hoje, dataUltimaAtividade);

      const isHomologacao =
        chamado.situation?.description?.includes("Homologação");

      const isEmAtendimento =
        chamado.status?.description === "Em Atendimento";

      const isSlaVencido =
        dataSLA && dataSLA < hoje;

      const isManterOperacao = chamado.custom_fields?.open?.some(
        f => f.label === "Classificação" && f.value?.includes("01")
      );
      
      // 2. Reabertura
      const isReaberto = chamado.reopened === true;

      // 3. Complexidade por Anexos
      const temAnexos = chamado.attachments?.length > 0;

      /*
      =====================================
      REGRAS PRINCIPAIS
      =====================================
      */

      // PRIORIDADE BASE
      score += prioridade * 3;

      // SLA
      if (isSlaVencido) {
        score += 15;
        motivos.push("SLA vencido");
      }

      // REABERTURA (+12)
      if (isReaberto) {
        score += 12;
        motivos.push("Chamado reaberto");
      }

      // ANEXOS (+2 por evidência)
      if (temAnexos) {
        score += 2;
        motivos.push("Possui evidências/anexos");
      }

      if (isManterOperacao) {
        score += 1;
        motivos.push("Impacto: Manter a Operação");
      }

      // CHAMADO ENVELHECIDO
      const pesoAntiguidade =
        Math.min(Math.floor(horasPassadas / 12), 8);

      score += pesoAntiguidade;

      if (pesoAntiguidade >= 4) {
        motivos.push("Chamado envelhecido");
      }

      /*
      =====================================
      EM ATENDIMENTO
      =====================================
      */

      if (isEmAtendimento) {

        // Atendimento sempre deve subir
        score += 8;

        motivos.push("Aguardando atuação técnica");

        // Muito tempo sem atualizar
        if (diasSemInteracao >= 2) {
          score += 6;
          motivos.push("Sem atualização recente");
        }

      }

      /*
      =====================================
      HOMOLOGAÇÃO
      =====================================
      */

      if (isHomologacao) {

        // Desce naturalmente na fila
        score -= 10;

        motivos.push("Aguardando validação do cliente");

        // Porém começa a subir novamente
        // se ficar mofando
        if (diasSemInteracao >= 4) {

          score += 14;

          motivos.push("Homologação sem retorno");

        }

      }

      /*
      =====================================
      RISCO VISUAL
      =====================================
      */

      let config = {
        risk: "Saudável",
        border: "border-zinc-800",
        riskBg: "bg-emerald-500/10 border-emerald-500/20",
        riskText: "text-emerald-300",
      };

      if (score >= 22) {

        config = {
          risk: "Crítico",
          border: "border-red-500/20",
          riskBg: "bg-red-500/10 border-red-500/20",
          riskText: "text-red-300",
        };

      }
      else if (score >= 12) {

        config = {
          risk: "Atenção",
          border: "border-amber-500/20",
          riskBg: "bg-amber-500/10 border-amber-500/20",
          riskText: "text-amber-300",
        };

      }

      /*
      =====================================
      INSIGHT OPERACIONAL
      =====================================
      */

      let insight =
        "Chamado operacional em acompanhamento.";

      if (isHomologacao && diasSemInteracao < 4) {

        insight =
          `Aguardando retorno do cliente. Recomendado cobrar em ${4 - diasSemInteracao} dia(s).`;

      }

      if (isHomologacao && diasSemInteracao >= 4) {

        insight =
          "Cliente sem retorno na homologação. Necessário follow-up operacional.";

      }

      if (isEmAtendimento && diasSemInteracao < 2) {

        insight =
          "Chamado em atuação técnica ativa.";

      }

      if (isEmAtendimento && diasSemInteracao >= 2) {

        insight =
          "Chamado em atendimento sem atualização recente.";

      }

      if (isSlaVencido) {

        insight =
          "SLA expirado. Necessário priorizar atendimento imediatamente.";

      }

      return {
        ...chamado,
        score,
        motivos,
        insight,
        prioridade,
        config,
        dataSLA,
        diasSemInteracao,
        dataUltimaAtividade,
        isHomologacao,
        isEmAtendimento,
      };

    });

    setRecords(
      [...listaComScore].sort((a, b) => b.score - a.score)
    );

  }, [chamados]);

  return (

  <Stack
      gap="xl"
      p="xl"
      radius="xl" // <--- Adiciona o arredondamento aqui
      className="bg-[#09090b] min-h-screen"
    >

      {/* HEADER */}

      <Group justify="space-between" >

        <Box >

          <Title
            order={1}
            className="text-white tracking-tight text-4xl"
          >
            Dashboard Operacional
          </Title>

          <Text
            size="sm"
            className="text-zinc-500 mt-1"
          >
            Priorização inteligente baseada em contexto operacional
          </Text>

        </Box>

        <div className="
          px-5 py-4
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900/60
          backdrop-blur-xl
        ">

          <Text className="text-zinc-500 text-xs uppercase tracking-wider">
            Chamados ativos
          </Text>

          <Text className="text-white text-3xl font-black">
            {records.length}
          </Text>

        </div>

      </Group>

      {/* CARDS */}

      <Stack gap="lg" >

        {records.map((item) => {

          const ultimaAtualizacao =
            item.dataUltimaAtividade
              ? formatDistanceToNow(item.dataUltimaAtividade, {
                  addSuffix: true,
                  locale: ptBR
                })
              : "-";

          const isOverdue =
            item.dataSLA && item.dataSLA < new Date();

          return (

            <Paper
              key={item.id}
              radius="2xl"
              className={`
                bg-zinc-900/60
                backdrop-blur-xl
                border
                ${item.config.border}
                hover:border-zinc-700
                transition-all
                duration-300
                overflow-hidden
              `}
            >

              <div className="p-7">

                {/* TOPO */}

                <div className="grid grid-cols-12 gap-8">

                  {/* ESQUERDA */}

                  <div className="col-span-12 xl:col-span-8">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-3 mb-3">

                          <Text className="text-zinc-500 text-sm">
                            #{item.protocol}
                          </Text>

                          <div className={`
                            px-2 py-1
                            rounded-lg
                            border
                            text-xs
                            ${item.config.riskBg}
                            ${item.config.riskText}
                          `}>
                            {item.config.risk}
                          </div>

                        </div>

                        <Title
                          order={3}
                          className="text-white"
                        >
                          {item.customer?.organization?.name}
                        </Title>

                        <Text
                          className="
                            text-zinc-400
                            mt-4
                            text-[15px]
                            leading-7
                          "
                        >
                          {item.subject}
                        </Text>

                      </div>

                    </div>

                  </div>

                  {/* SCORE */}

                  <div className="col-span-12 xl:col-span-4">

                    <div className={`
                      rounded-3xl
                      border
                      ${item.config.riskBg}
                      p-5
                    `}>

                      <Text className="
                        text-zinc-500
                        text-xs
                        uppercase
                        tracking-widest
                      ">
                        Score Operacional
                      </Text>

                      <div className="flex items-end gap-3 mt-3">

                        <Text className={`
                          text-5xl
                          font-black
                          ${item.config.riskText}
                        `}>
                          {item.score}
                        </Text>

                        <Text className={`
                          mb-2
                          text-sm
                          font-medium
                          ${item.config.riskText}
                        `}>
                          {item.config.risk}
                        </Text>

                      </div>

                      <Text className="
                        text-zinc-400
                        text-sm
                        mt-4
                        leading-6
                      ">
                        {item.insight}
                      </Text>

                    </div>

                  </div>

                </div>

                {/* GRID INFERIOR */}

                <div className="
                  grid
                  grid-cols-12
                  gap-5
                  mt-7
                ">

                  {/* SLA */}

                  <div className="col-span-12 md:col-span-3">

                    <div className="
                      rounded-2xl
                      border
                      border-zinc-800
                      bg-black/20
                      p-4
                      h-full
                    ">

                      <Text className="
                        text-zinc-500
                        text-xs
                        uppercase
                        tracking-wider
                      ">
                        SLA
                      </Text>

                      <Text className={`
                        mt-3
                        text-lg
                        font-semibold
                        ${isOverdue
                          ? "text-red-300"
                          : "text-emerald-300"}
                      `}>

                        {isOverdue
                          ? "SLA expirado"
                          : "Dentro do prazo"}

                      </Text>

                      <Text className="
                        text-zinc-500
                        text-sm
                        mt-2
                      ">
                        Última atualização {ultimaAtualizacao}
                      </Text>

                    </div>

                  </div>

                  {/* STATUS */}

                  <div className="col-span-12 md:col-span-3">

                    <div className="
                      rounded-2xl
                      border
                      border-zinc-800
                      bg-black/20
                      p-4
                      h-full
                    ">

                      <Text className="
                        text-zinc-500
                        text-xs
                        uppercase
                        tracking-wider
                      ">
                        Status Operacional
                      </Text>

                      <div className="mt-3">

                        <Badge className="
                          bg-zinc-800
                          text-zinc-300
                          border
                          border-zinc-700
                        ">
                          {item.status?.description || "-"}
                        </Badge>

                      </div>

                      <Text className="
                        text-zinc-500
                        text-sm
                        mt-3
                      ">
                        {item.isHomologacao
                          ? `Sem retorno há ${item.diasSemInteracao} dia(s)`
                          : `Prioridade P${item.prioridade}`}
                      </Text>

                    </div>

                  </div>

                  {/* MOTIVOS */}

                  <div className="col-span-12 md:col-span-3">

                    <div className="
                      rounded-2xl
                      border
                      border-zinc-800
                      bg-black/20
                      p-4
                      h-full
                    ">

                      <Text className="
                        text-zinc-500
                        text-xs
                        uppercase
                        tracking-wider
                      ">
                        Motivos da priorização
                      </Text>

                      <div className="
                        flex
                        flex-wrap
                        gap-2
                        mt-4
                      ">

                        {item.motivos.map((motivo) => (

                          <div
                            key={motivo}
                            className="
                              px-2
                              py-1
                              rounded-lg
                              bg-zinc-800
                              border
                              border-zinc-700
                              text-zinc-300
                              text-xs
                            "
                          >
                            {motivo}
                          </div>

                        ))}

                      </div>

                    </div>

                  </div>

                  {/* RECOMENDAÇÃO */}

                  <div className="col-span-12 md:col-span-3">

                    <div className="
                      rounded-2xl
                      border
                      border-zinc-800
                      bg-black/20
                      p-4
                      h-full
                    ">

                      <Text className="
                        text-zinc-500
                        text-xs
                        uppercase
                        tracking-wider
                      ">
                        Próxima ação
                      </Text>

                      <Text className="
                        text-white
                        text-sm
                        leading-7
                        mt-3
                      ">

                        {item.isHomologacao && item.diasSemInteracao < 4 &&
                          `Realizar follow-up em ${4 - item.diasSemInteracao} dia(s).`
                        }

                        {item.isHomologacao && item.diasSemInteracao >= 4 &&
                          "Cobrar retorno do cliente imediatamente."
                        }

                        {item.isEmAtendimento &&
                          "Continuar atuação técnica e registrar evolução."
                        }

                        {!item.isHomologacao && !item.isEmAtendimento &&
                          "Monitorar andamento operacional do chamado."
                        }

                      </Text>

                    </div>

                  </div>

                </div>

              </div>

            </Paper>

          );

        })}

      </Stack>

    </Stack>

  );
}

export default TabelaChamados;