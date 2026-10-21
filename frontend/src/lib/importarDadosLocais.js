import { supabase } from './supabaseClient'
import { ler, apagar } from './armazemLocal'

// Importação única do que ficou no navegador antes de os dados irem para o
// Supabase (módulos do evento, presentes, reservas e chave Pix). Cada chave é
// apagada do localStorage depois de importada. Pode sair do código quando
// ninguém mais tiver dados antigos no navegador.

const chaveModulos = (id) => `hubevent:modulos:${id}`
const chavePresentes = (id) => `hubevent:presentes:${id}`
const chaveRecebimento = (id) => `hubevent:recebimento:${id}`

// Em desenvolvimento o React roda os efeitos duas vezes; a promessa
// compartilhada evita importar os mesmos itens em dobro.
const emAndamento = new Map()

function umaVez(chave, tarefa) {
  if (!emAndamento.has(chave)) emAndamento.set(chave, tarefa())
  return emAndamento.get(chave)
}

// Devolve os módulos a usar: os do navegador, se existirem, já gravados no banco.
export function importarModulos(evento) {
  return umaVez(`modulos:${evento.id}`, async () => {
    const locais = ler(chaveModulos(evento.id), null)
    if (!locais) return evento.modulos
    const modulos = { ...evento.modulos, ...locais }
    const { error } = await supabase.from('evento').update({ modulos }).eq('id', evento.id)
    if (error) return evento.modulos
    apagar(chaveModulos(evento.id))
    return modulos
  })
}

async function fotoParaStorage(eventoId, imagem) {
  if (!imagem?.startsWith('data:')) return imagem || null
  const blob = await (await fetch(imagem)).blob()
  const caminho = `${eventoId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('presentes').upload(caminho, blob, { contentType: blob.type || 'image/jpeg' })
  if (error) return null
  return supabase.storage.from('presentes').getPublicUrl(caminho).data.publicUrl
}

// Os itens de exemplo (id "<evento>-<n>") não são importados: eram só demonstração.
export function importarPresentes(eventoId) {
  return umaVez(`presentes:${eventoId}`, async () => {
    const recebimento = ler(chaveRecebimento(eventoId), null)
    if (recebimento?.chave) {
      const { error } = await supabase
        .from('evento')
        .update({ pix_chave: recebimento.chave, pix_nome: recebimento.nome, pix_cidade: recebimento.cidade || null })
        .eq('id', eventoId)
        .is('pix_chave', null)
      if (!error) apagar(chaveRecebimento(eventoId))
    }

    const itens = ler(chavePresentes(eventoId), null)
    if (!itens) return
    const proprios = itens.filter((p) => !String(p.id).startsWith(`${eventoId}-`))

    for (const p of proprios) {
      const { data, error } = await supabase
        .from('lista_presentes')
        .insert({
          evento_id: eventoId,
          nome: p.nome,
          descricao: p.descricao || null,
          valor: p.valor ?? null,
          categoria: p.categoria || null,
          quantidade: Math.max(p.quantidade || 1, p.reservas?.length || 0),
          link: p.link || null,
          imagem_url: await fotoParaStorage(eventoId, p.imagem),
        })
        .select('id')
        .single()
      if (error) return // tenta de novo na próxima visita, sem apagar nada

      if (p.reservas?.length) {
        await supabase.from('reserva_presente').insert(
          p.reservas.map((r) => ({ presente_id: data.id, nome: r.nome || 'Convidado', forma: r.forma, criado_em: r.em || undefined }))
        )
      }
    }

    apagar(chavePresentes(eventoId))
  })
}
