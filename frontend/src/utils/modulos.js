import { ler, gravar } from '../lib/armazemLocal'

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

// Eventos criados antes da escolha de módulos mantêm tudo ativo.
const PADRAO_LEGADO = { presentes: true, site: true }

// Ainda não há coluna para isso no banco: a escolha fica no navegador.
const chave = (eventoId) => `hubevent:modulos:${eventoId}`

export function lerModulos(eventoId) {
  return { ...PADRAO_LEGADO, ...ler(chave(eventoId), {}) }
}

export function salvarModulos(eventoId, modulos) {
  gravar(chave(eventoId), modulos)
}
