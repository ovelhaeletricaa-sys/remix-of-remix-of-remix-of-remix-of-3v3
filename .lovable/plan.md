

# Modulo de Inventarios

## Visao Geral

Criar uma nova pagina `/inventarios` com funcionalidades completas de contagem de estoque, incluindo sugestoes automaticas, metodos flexiveis, cronogramas rotativos e acompanhamento de divergencias.

---

## Estrutura de Dados

### Novos tipos em `src/types/inventory.ts`

```text
InventoryCount (registro de inventario)
  - id, code, name
  - method: CONTAGEM_RAPIDA | CONTAGEM_CEGA | DUPLA_CONFERENCIA | RASTREABILIDADE_COMPLETA
  - status: PLANEJADO | EM_ANDAMENTO | CONTAGEM_FINALIZADA | AJUSTADO | CANCELADO
  - scope: GERAL | SETOR | CURVA_ABC | PRODUTOS_ESPECIFICOS
  - sectorFilter?: string (shelf/category filter)
  - curveFilter?: 'A' | 'B' | 'C'
  - items: InventoryCountItem[]
  - collaborator: string
  - scheduledDate?: string
  - startedAt?, completedAt?
  - observations?: string
  - createdAt, updatedAt

InventoryCountItem (item individual da contagem)
  - productId, productCode, productDescription
  - expectedQty (estoque fisico atual no momento da contagem)
  - expectedQtyOmie (estoque OMIE)
  - countedQty?: number (preenchido pelo operador)
  - secondCountQty?: number (para dupla conferencia)
  - divergence?: number (countedQty - expectedQty)
  - divergencePercent?: number
  - adjustmentApplied: boolean
  - causeAnalysis?: string (para metodo completo)
  - status: PENDENTE | CONTADO | DIVERGENTE | AJUSTADO

InventoryMethod (enum)
  - CONTAGEM_RAPIDA: operador ve qtd atual e ajusta
  - CONTAGEM_CEGA: operador nao ve qtd, conta "no escuro"
  - DUPLA_CONFERENCIA: duas contagens independentes, compara
  - RASTREABILIDADE_COMPLETA: contagem cega + analise de causa + log

InventorySuggestion (sugestao automatica)
  - productId, productCode
  - reason: CURVA_A | TEMPO_SEM_CONTAGEM | DIVERGENCIA_HISTORICA | SETOR_CRITICO
  - priority: ALTA | MEDIA | BAIXA
  - lastCountDate?: string
  - divergenceHistory: number
```

### Nova chave em `src/lib/storage.ts`

- `INVENTORY_COUNTS: 'inventory_counts'`

---

## Nova Pagina: `src/pages/Inventarios.tsx`

### Layout com Tabs

1. **Sugestoes** - Cards com sugestoes automaticas de contagem
2. **Nova Contagem** - Formulario para criar inventario
3. **Em Andamento** - Contagens ativas para preenchimento
4. **Historico** - Lista de contagens finalizadas/canceladas

### Tab 1: Sugestoes Automaticas

Motor de sugestoes baseado em:

- **Curva A**: Produtos classificados como curva A que nao foram contados nos ultimos 30 dias
- **Tempo sem contagem**: Qualquer produto sem contagem nos ultimos 90 dias
- **Divergencias historicas**: Produtos que tiveram divergencia OMIE > 20% ou divergencias em contagens anteriores
- **Setores criticos**: Enderecos com alertas ativos (capacidade excedida, multiplos locais)

Cada sugestao mostra: produto, motivo, prioridade, ultima contagem, e botao "Iniciar Contagem"

### Tab 2: Nova Contagem

Formulario com campos selecionaveis (seguindo padrao do sistema):

- **Metodo**: Dropdown com os 4 metodos (com descricao)
- **Escopo**: GERAL | Por Setor (seleciona estante) | Por Curva ABC (A/B/C) | Produtos especificos (multi-select)
- **Data programada**: Opcional, para cronograma
- **Observacoes**: Campo de texto

Ao criar, o sistema pre-carrega os `InventoryCountItem` baseados no escopo selecionado, capturando `expectedQty` = `currentStock` e `expectedQtyOmie` = `stockOmie` naquele momento.

### Tab 3: Em Andamento

Lista de contagens com status EM_ANDAMENTO ou PLANEJADO.

Ao clicar em uma contagem, abre um dialog/painel com:

- **Contagem Rapida**: Tabela editavel com coluna "Qtd Contada" visivel ao lado de "Qtd Esperada"
- **Contagem Cega**: Tabela com coluna "Qtd Contada" mas SEM mostrar "Qtd Esperada" (oculta ate finalizar)
- **Dupla Conferencia**: Duas etapas - primeira contagem, depois segunda contagem por outro operador; compara as duas
- **Rastreabilidade Completa**: Contagem cega + campo "Analise de Causa" para cada divergencia

Acoes:
- "Finalizar Contagem" - calcula divergencias, muda status
- "Aplicar Ajustes" - atualiza `currentStock` dos produtos divergentes e gera movimentacoes de tipo AJUSTE
- "Cancelar"

### Tab 4: Historico

Tabela com contagens finalizadas. Filtros por data, metodo, escopo. Expansivel para ver itens e divergencias.

---

## Integracao com o Sistema

### `src/hooks/useInventory.ts`

Novas funcoes:
- `addInventoryCount()` - cria contagem
- `updateInventoryCount()` - atualiza contagem em andamento
- `finalizeInventoryCount()` - calcula divergencias, muda status
- `applyInventoryAdjustments()` - para cada item divergente:
  - Atualiza `product.currentStock` = `countedQty`
  - Cria `Movement` tipo AJUSTE com quantidade = diferenca
- `cancelInventoryCount()`
- `getInventorySuggestions()` - motor de sugestoes

### `src/App.tsx`

- Nova rota: `/inventarios` -> `<Inventarios />`

### `src/components/layout/Sidebar.tsx`

- Novo item: "Inventarios" com icone `ClipboardCheck`, posicionado entre "Alertas" e "Relatorios"

---

## Detalhes Tecnicos

### Arquivos novos

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Inventarios.tsx` | Pagina principal com 4 tabs |
| `src/components/inventory/InventoryCountDialog.tsx` | Dialog para executar contagem (preencher quantidades) |
| `src/components/inventory/InventorySuggestions.tsx` | Componente de sugestoes automaticas |

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/types/inventory.ts` | Novos tipos: InventoryCount, InventoryCountItem, etc. |
| `src/lib/storage.ts` | Nova chave INVENTORY_COUNTS |
| `src/hooks/useInventory.ts` | Novas funcoes de inventario + estado inventoryCounts |
| `src/App.tsx` | Rota `/inventarios` |
| `src/components/layout/Sidebar.tsx` | Link "Inventarios" no menu |

### Logica de ajuste de estoque

Quando o operador aplica ajustes apos finalizar contagem:

```text
Para cada item com divergencia:
  diferenca = countedQty - expectedQty
  Se diferenca > 0: Movement tipo ENTRADA, purpose AJUSTE
  Se diferenca < 0: Movement tipo SAIDA, purpose AJUSTE
  Atualiza product.currentStock = countedQty
```

### Cronograma rotativo

Na tab de sugestoes, o sistema calcula automaticamente quais produtos precisam de contagem com base em:
- Curva A: a cada 30 dias
- Curva B: a cada 60 dias
- Curva C: a cada 90 dias
- Sem curva definida: a cada 90 dias

A data da ultima contagem e extraida do historico de `InventoryCount` para cada produto.

