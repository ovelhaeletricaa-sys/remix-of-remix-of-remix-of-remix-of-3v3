
# Painel de Ordens de Produção — Rastreabilidade e Gestão de Status

## Problema Atual
Ao registrar uma saída para produção, o sistema:
- Cria movimentações individuais por componente no historico
- Salva uma `ProductionOrder` no localStorage, mas **nao exibe em lugar nenhum**
- O campo "Status da Producao" (Concluida, Estocada, Incompleta, Cancelada) nao tem efeito pratico

O usuario nao consegue:
- Ver as ordens de producao existentes
- Alterar o status de uma producao em andamento
- Cancelar uma producao (com devolucao automatica ao estoque)
- Rastrear quais itens ja foram baixados

---

## Solucao Proposta

### 1. Nova aba "Ordens de Producao" na pagina Movimentacoes

Adicionar uma segunda aba na pagina de Movimentacoes, ao lado do historico:

```text
[ Historico de Movimentacoes ]  [ Ordens de Producao ]
```

Essa aba exibira uma tabela com todas as ordens de producao, contendo:

| Coluna | Descricao |
|--------|-----------|
| Codigo da Composicao | Ex: COMP-001 - Mesa Industrial |
| Projeto | Codigo do projeto vinculado |
| Tipo de Saida | Integral / Parcial / Fracionada |
| Qtd Composicoes | Quantas unidades foram produzidas |
| Status | Badge colorido (Incompleta, Concluida, Estocada, Cancelada) |
| Colaborador | Quem registrou |
| Data | Quando foi criada |
| Acoes | Botoes de alterar status e ver detalhes |

### 2. Dialog de Detalhes da Ordem

Ao clicar em uma ordem, abre um dialog mostrando:

- Informacoes gerais (composicao, projeto, tipo de saida, colaborador)
- **Tabela de itens processados**: cada componente com quantidade solicitada, quantidade entregue, e status individual
- **Movimentacoes vinculadas**: lista das movimentacoes geradas, com link para o historico
- **Seletor de status** para alterar o estado da producao

### 3. Logica de Alteracao de Status

Cada transicao de status tera um comportamento especifico:

- **Incompleta -> Concluida**: Apenas marca como finalizada. Nenhuma alteracao de estoque.
- **Incompleta -> Estocada**: Marca como finalizada e armazenada. Nenhuma alteracao de estoque.
- **Qualquer -> Cancelada**: **Reverte automaticamente** todas as movimentacoes vinculadas, devolvendo os itens ao estoque. Cria movimentacoes de tipo DEVOLUCAO com observacao automatica indicando o cancelamento.
- **Cancelada -> reabrir**: Nao permitido (status final).

### 4. Indicador Visual no Historico

No historico de movimentacoes, as movimentacoes que pertencem a uma producao ganharao:
- Um badge ou icone indicando que fazem parte de uma Ordem de Producao
- O codigo da composicao visivel na linha
- Tooltip ou link para abrir os detalhes da ordem

---

## Detalhes Tecnicos

### Arquivos modificados

1. **`src/pages/Movimentacoes.tsx`**
   - Adicionar componente de Tabs (Historico | Ordens de Producao)
   - Criar tabela de ordens de producao com filtros e busca
   - Dialog de detalhes da ordem com tabela de itens e movimentacoes
   - Seletor de status com confirmacao (AlertDialog para cancelamento)
   - Badge de producao nas linhas do historico

2. **`src/hooks/useInventory.ts`**
   - Criar funcao `cancelProductionOrder(id)` que:
     - Busca todos os `movementIds` da ordem
     - Reverte o estoque de cada movimentacao (incrementa `currentStock`)
     - Cria movimentacoes de DEVOLUCAO automaticas
     - Atualiza o status da ordem para CANCELADA
   - Expor `productionOrders` e `updateProductionOrder` no contexto (ja existem, mas nao estao sendo usados na interface)

3. **`src/contexts/InventoryContext.tsx`**
   - Expor `productionOrders`, `updateProductionOrder` e `cancelProductionOrder` no contexto

### Fluxo de cancelamento

```text
Usuario clica "Cancelar Producao"
  -> AlertDialog de confirmacao
  -> Para cada movimentacao vinculada:
     -> Incrementa estoque do produto
     -> Cria movimentacao DEVOLUCAO automatica
  -> Status da ordem = CANCELADA
  -> Toast de confirmacao
```

### Cores dos badges de status

- **Incompleta**: Amarelo/warning
- **Concluida**: Verde/success
- **Estocada**: Azul/info
- **Cancelada**: Vermelho/destructive
