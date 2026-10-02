import { useState } from 'react'
import { CATEGORIAS_PRESENTE } from '../utils/categorias'
import { comprimirImagem } from '../utils/imagem'
import Icone from './Icone'

const TAMANHO_MAX_IMAGEM = 10 * 1024 * 1024

function linkValido(texto) {
  try {
    return ['http:', 'https:'].includes(new URL(texto).protocol)
  } catch {
    return false
  }
}

// Fotos do iPhone (HEIC) não abrem no navegador do Windows/Android e às vezes
// chegam sem tipo; avisamos com clareza em vez de falhar em silêncio.
function ehHeic(arquivo) {
  return /hei[cf]/i.test(arquivo.type) || /\.hei[cf]$/i.test(arquivo.name)
}

// Sem `presente`, cadastra um novo; com ele, edita o existente.
function ModalCadastrarPresente({ aberto, presente = null, aoFechar, aoSalvar }) {
  const editando = !!presente
  const [nome, setNome] = useState(presente?.nome || '')
  const [valor, setValor] = useState(presente?.valor ?? '')
  const [descricao, setDescricao] = useState(presente?.descricao || '')
  const [categoria, setCategoria] = useState(presente?.categoria || '')
  const [quantidade, setQuantidade] = useState(presente?.quantidade || 1)
  const [imagem, setImagem] = useState(presente?.imagem || null)
  const [link, setLink] = useState(presente?.link || '')
  const [processandoImagem, setProcessandoImagem] = useState(false)
  const [erro, setErro] = useState(null)

  if (!aberto) return null

  function limpar() {
    setNome('')
    setValor('')
    setDescricao('')
    setCategoria('')
    setQuantidade(1)
    setImagem(null)
    setLink('')
    setErro(null)
  }

  function fechar() {
    limpar()
    aoFechar()
  }

  async function escolherImagem(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (ehHeic(arquivo)) {
      setErro('Fotos em HEIC (padrão do iPhone) não abrem no navegador. Envie em JPG ou PNG — no iPhone, Ajustes › Câmera › Formatos › Mais Compatível.')
      return
    }
    if (!arquivo.type.startsWith('image/')) {
      setErro('Escolha uma foto em JPG, PNG ou WebP.')
      return
    }
    if (arquivo.size > TAMANHO_MAX_IMAGEM) {
      setErro('A imagem deve ter no máximo 10 MB.')
      return
    }
    setErro(null)
    setProcessandoImagem(true)
    try {
      setImagem(await comprimirImagem(arquivo))
    } catch (err) {
      setErro(err.message)
    } finally {
      setProcessandoImagem(false)
    }
  }

  function handleCadastrar(e) {
    e.preventDefault()
    const valorNum = valor === '' ? null : Number(valor)
    const qtd = Number(quantidade)

    if (!nome.trim()) {
      setErro('Dê um nome ao presente.')
      return
    }
    if (valorNum !== null && (isNaN(valorNum) || valorNum < 0)) {
      setErro('Informe um valor válido.')
      return
    }
    if (!Number.isInteger(qtd) || qtd < 1) {
      setErro('A quantidade deve ser de pelo menos 1.')
      return
    }
    if (editando && qtd < presente.reservas.length) {
      setErro(`Já há ${presente.reservas.length} reservas para este presente; a quantidade não pode ser menor.`)
      return
    }
    if (link.trim() && !linkValido(link.trim())) {
      setErro('O link da loja deve começar com https://')
      return
    }

    const salvou = aoSalvar({
      nome: nome.trim(),
      valor: valorNum,
      descricao: descricao.trim() || null,
      categoria: categoria || null,
      quantidade: qtd,
      imagem,
      link: link.trim() || null,
    })
    if (salvou === false) {
      setErro('Não foi possível salvar. O armazenamento do navegador está cheio — tente sem foto ou com uma menor.')
      return
    }
    fechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <form className="popup" onSubmit={handleCadastrar} role="dialog" aria-modal="true" aria-labelledby="novo-presente-titulo">
        <h2 id="novo-presente-titulo" className="popup-title titulo">
          {editando ? <>Editar <em>presente</em></> : <>Novo <em>presente</em></>}
        </h2>
        <p className="popup-sub">
          {editando ? 'As mudanças aparecem no site do evento na hora.' : 'Ele aparece no site do evento assim que for cadastrado.'}
        </p>

        <div className="field">
          <label htmlFor="pres-nome">Nome do presente</label>
          <input
            id="pres-nome"
            type="text"
            placeholder="Ex: Jogo de taças de cristal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="pres-valor">Valor estimado <span className="muted">(R$)</span></label>
            <input
              id="pres-valor"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pres-qtd">Quantidade</label>
            <input
              id="pres-qtd"
              type="number"
              min="1"
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pres-cat">Categoria</label>
          <select id="pres-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Sem categoria</option>
            {CATEGORIAS_PRESENTE.map((c) => (
              <option key={c.nome}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="pres-desc">Descrição <span className="muted">(opcional)</span></label>
          <textarea
            id="pres-desc"
            rows={3}
            placeholder="Cor, modelo, loja sugerida…"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="pres-link">Link da loja <span className="muted">(opcional)</span></label>
          <input
            id="pres-link"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <p className="pres-ajuda">Se houver, o convidado pode comprar direto na loja. Sem link, ele presenteia por Pix ou cartão.</p>
        </div>

        <div className="field">
          <span className="label">Foto <span className="muted">(opcional)</span></span>
          {imagem ? (
            <div className="pres-upload-preview">
              <img src={imagem} alt="Prévia da imagem do presente" />
              <label className="btn btn-secondary btn-sm pres-trocar">
                <input type="file" accept="image/*" onChange={escolherImagem} />
                <Icone nome="imagem" tamanho={14} /> {processandoImagem ? 'Preparando…' : 'Trocar foto'}
              </label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImagem(null)}>
                <Icone nome="lixeira" tamanho={14} /> Remover
              </button>
            </div>
          ) : (
            <label className="pres-upload">
              <input type="file" accept="image/*" onChange={escolherImagem} />
              <Icone nome="imagem" tamanho={18} />
              <span>{processandoImagem ? 'Preparando foto…' : <>Escolher foto <span className="muted">· JPG, PNG ou WebP</span></>}</span>
            </label>
          )}
        </div>

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={fechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={processandoImagem}>{editando ? 'Salvar alterações' : 'Cadastrar presente'}</button>
        </div>
      </form>
    </div>
  )
}

export default ModalCadastrarPresente
