import { useState } from 'react'
import { CATEGORIAS_PRESENTE } from '../utils/categorias'
import Icone from './Icone'

const TAMANHO_MAX_IMAGEM = 2 * 1024 * 1024

function ModalCadastrarPresente({ aberto, aoFechar, aoCadastrar }) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [imagem, setImagem] = useState(null)
  const [erro, setErro] = useState(null)

  if (!aberto) return null

  function limpar() {
    setNome('')
    setValor('')
    setDescricao('')
    setCategoria('')
    setQuantidade(1)
    setImagem(null)
    setErro(null)
  }

  function fechar() {
    limpar()
    aoFechar()
  }

  function escolherImagem(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      setErro('Escolha um arquivo de imagem.')
      return
    }
    if (arquivo.size > TAMANHO_MAX_IMAGEM) {
      setErro('A imagem deve ter no máximo 2 MB.')
      return
    }
    setErro(null)
    const leitor = new FileReader()
    leitor.onload = () => setImagem(leitor.result)
    leitor.readAsDataURL(arquivo)
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

    aoCadastrar({
      nome: nome.trim(),
      valor: valorNum,
      descricao: descricao.trim() || null,
      categoria: categoria || null,
      quantidade: qtd,
      imagem,
    })
    fechar()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <form className="popup" onSubmit={handleCadastrar} role="dialog" aria-modal="true" aria-labelledby="novo-presente-titulo">
        <h2 id="novo-presente-titulo" className="popup-title titulo">Novo <em>presente</em></h2>
        <p className="popup-sub">Ele aparece na lista assim que for cadastrado.</p>

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
          <span className="label">Imagem <span className="muted">(opcional)</span></span>
          {imagem ? (
            <div className="pres-upload-preview">
              <img src={imagem} alt="Prévia da imagem do presente" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImagem(null)}>
                <Icone nome="lixeira" tamanho={14} /> Remover
              </button>
            </div>
          ) : (
            <label className="pres-upload">
              <input type="file" accept="image/*" onChange={escolherImagem} />
              <Icone nome="imagem" tamanho={18} />
              <span>Escolher imagem <span className="muted">· até 2 MB</span></span>
            </label>
          )}
        </div>

        {erro && <p className="erro-msg">{erro}</p>}

        <div className="popup-actions">
          <button type="button" className="btn btn-ghost" onClick={fechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Cadastrar presente</button>
        </div>
      </form>
    </div>
  )
}

export default ModalCadastrarPresente
