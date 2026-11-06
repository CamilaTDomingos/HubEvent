// Símbolo do HubEvent: um calendário (o evento) com os brilhinhos dentro.
// Usa currentColor, então a cor vem do contexto (.marca-simbolo).
function LogoSimbolo({ tamanho = 30 }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="12 12 76 74"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M30 22H70A12 12 0 0 1 82 34V70A12 12 0 0 1 70 82H30A12 12 0 0 1 18 70V34A12 12 0 0 1 30 22Z" />
      <path d="M18 40H82M36 17V28M64 17V28" />
      <g transform="translate(25 38.3) scale(1.91)" strokeWidth="2.3">
        <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7zM19 16c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3z" />
      </g>
    </svg>
  )
}

export default LogoSimbolo
