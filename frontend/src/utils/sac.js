// Conteúdo da página de SAC (RF22).
// Os contatos abaixo são fictícios: troque pelos dados reais do suporte
// antes de colocar o sistema em produção.
export const CONTATOS = [
  {
    chave: 'email',
    titulo: 'E-mail',
    descricao: 'Respondemos em até 1 dia útil.',
    valor: 'suporte@hubevent.com.br', // TODO: e-mail real do suporte
    href: 'mailto:suporte@hubevent.com.br',
    icone: 'email',
  },
  {
    chave: 'whatsapp',
    titulo: 'WhatsApp',
    descricao: 'Atendimento rápido pelo celular.',
    valor: '(11) 90000-0000', // TODO: número real do WhatsApp
    href: 'https://wa.me/5511900000000',
    icone: 'conversa',
  },
]

// Perguntas frequentes. Para editar, basta alterar os textos desta lista.
export const PERGUNTAS = [
  {
    pergunta: 'Como criar um evento?',
    resposta: 'Na página Início ou em Meus eventos, clique em “Novo evento”. Informe o nome, o tipo, a data e o local, escolha os módulos que deseja usar e confirme.',
  },
  {
    pergunta: 'Como gerenciar os convidados?',
    resposta: 'Abra o evento e acesse a aba Convidados. Ali você adiciona, edita e remove convidados, além de acompanhar quem já respondeu ao convite.',
  },
  {
    pergunta: 'Como funciona a confirmação de presença?',
    resposta: 'Cada convidado recebe um link próprio de confirmação. Ao abrir o link, ele informa se vai ao evento, e a resposta aparece automaticamente na aba Convidados.',
  },
  {
    pergunta: 'Como funciona a lista de presentes?',
    resposta: 'Ative o módulo Lista de presentes e cadastre os itens na aba correspondente do evento. Os convidados escolhem e reservam os presentes pelo site do evento.',
  },
  {
    pergunta: 'Como editar as informações do meu evento?',
    resposta: 'Abra o evento em Meus eventos e use a opção de edição para alterar nome, data, horário, local e demais informações. As mudanças valem na hora.',
  },
  {
    pergunta: 'Como acessar ou alterar os dados financeiros?',
    resposta: 'Dentro do evento, acesse a aba Financeiro. Nela você define o orçamento, registra despesas e acompanha o pagamento das parcelas.',
  },
  {
    pergunta: 'Como entrar em contato com o suporte?',
    resposta: 'Use um dos canais em “Entre em contato”, nesta mesma página, ou envie uma mensagem pelo formulário. Nossa equipe retorna o quanto antes.',
  },
]
