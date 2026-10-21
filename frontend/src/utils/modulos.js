// Funcionalidades de um evento. As obrigatórias existem em todo evento;
// as opcionais são escolhidas na criação.
export const MODULOS_OBRIGATORIOS = [
  { chave: 'convidados', nome: 'Convidados', descricao: 'Lista e confirmações', icone: 'usuarios' },
  { chave: 'financeiro', nome: 'Financeiro', descricao: 'Orçamento e despesas', icone: 'carteira' },
  { chave: 'checklist', nome: 'Checklist', descricao: 'Tarefas até o dia', icone: 'check' },
]

export const MODULOS_OPCIONAIS = [
  { chave: 'presentes', nome: 'Lista de presentes', descricao: 'Convidados escolhem e reservam presentes pelo site.', icone: 'presente' },
  { chave: 'site', nome: 'Site do evento', descricao: 'Página pública com as informações do evento.', icone: 'globo' },
]

// Os módulos escolhidos ficam na coluna `evento.modulos`. Eventos criados
// antes da escolha existir têm tudo ativo (é o padrão da coluna).
const PADRAO = { presentes: true, site: true }

export function lerModulos(evento) {
  return { ...PADRAO, ...evento?.modulos }
}
