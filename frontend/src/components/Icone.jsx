// Ícones de traço fino, desenhados para combinar com o peso da Inter.
const CAMINHOS = {
  aneis: <><circle cx="9" cy="14" r="5" /><circle cx="15" cy="14" r="5" /><path d="M10.5 5.5 12 4l1.5 1.5L12 7z" /></>,
  bolo: <path d="M4 20h16M5 20v-7h14v7M5 16.5c1.6 1 3.1 1 4.6 0s3.2-1 4.8 0 3 1 4.6 0M12 13v-3M12 7.8c-.9-.7-.9-2 0-3.3.9 1.3.9 2.6 0 3.3z" />,
  capelo: <path d="M2 9.5 12 5l10 4.5L12 14zM6 11.3V16c3.5 2.2 8.5 2.2 12 0v-4.7M22 9.5V15" />,
  chocalho: <><circle cx="9" cy="9" r="5" /><path d="M12.6 12.6 19 19M17 21l4-4M7.5 7.5h.01M10.5 10h.01" /></>,
  panela: <path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM2 10h2M20 10h2M9.5 7c0-1 1-1 1-2.2M13.5 7c0-1 1-1 1-2.2" />,
  maleta: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7M3 12.5h18" /></>,
  brilho: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7zM19 16c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3z" />,
  casa: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H5.5A1.5 1.5 0 0 1 4 19z" />,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  relogio: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  local: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  copiar: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>,
  abrir: <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />,
  lixeira: <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 12.5a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7M10 11v5M14 11v5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  voltar: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  busca: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></>,
  mais: <path d="M12 5v14M5 12h14" />,
  editar: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  sair: <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l4-4-4-4M14 12H4" />,
  presente: <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8C10.5 4.5 7 4.5 7.3 7 7.5 8 12 8 12 8zM12 8c1.5-3.5 5-3.5 4.7-1-.2 1-4.7 1-4.7 1z" /></>,
  imagem: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-9 8" /></>,
  usuarios: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2" /></>,
  carteira: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></>,
  globo: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z" /></>,
}

function Icone({ nome, tamanho = 18, className = '', traco = 1.6, ...resto }) {
  return (
    <svg
      className={`icone ${className}`}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {CAMINHOS[nome] || CAMINHOS.brilho}
    </svg>
  )
}

export default Icone
