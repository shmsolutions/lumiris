# Lumiris — Guia de Marca

> A luz que ilumina o cuidado terapêutico.

Esta é a fonte da verdade pra tudo que envolve a identidade do Lumiris: nome, voz, paleta, tipografia, logo e como aplicá-los em produto, marketing e materiais externos.

---

## 1. Essência

### Nome
**Lumiris** — do português antigo, significa **luz**, **brasa**, **clarão**. É o que a gente acende pra enxergar no escuro. É também o que um terapeuta faz pelo paciente: ilumina caminhos que pareciam fechados.

Pronúncia: `/'lu.mi/` (lú-mi).

### Promessa de marca
**Devolver tempo ao terapeuta.** Lumiris transforma horas de burocracia (anamnese, evolução, relatório) em minutos — sem perder rigor clínico.

### Tagline
**O prontuário que evolui com você.**

Variações curtas pra uso pontual:
- "Iluminando o cuidado terapêutico."
- "Menos papel. Mais paciente."

### Posicionamento
Lumiris é o **assistente clínico inteligente para Terapeutas Ocupacionais** (e, em breve, outras especialidades) que automatiza prontuário e relatórios via IA, sem comprometer a qualidade técnica exigida pelos conselhos (CREFITO, CRP, etc.).

Não somos um ERP. Não somos uma agenda. Somos o **prontuário inteligente** — e tudo gira em volta disso.

### Para quem
- **Persona primária:** TO autônoma, atende 15-40 pacientes/semana, opera sozinha ou em clínica pequena, perde 2-3h por relatório trimestral pro plano de saúde.
- **Persona secundária (V2):** Psicólogo, fonoaudiólogo, fisioterapeuta com a mesma dor.
- **Persona V3:** Clínicas multidisciplinares.

---

## 2. Voz e tom

### Princípios
1. **Calmo e direto.** O usuário tá ocupado. Frase curta, palavra precisa.
2. **Acolhedor, sem ser bobinho.** Sem emojis em produto. Sem "Oi, querida!". Sem infantilização.
3. **Técnico quando precisa.** "Anamnese" é anamnese. "Evolução" é evolução. Não traduzimos jargão clínico — respeitamos.
4. **Brasileiro.** Português do Brasil sempre. Sem "obrigado por aguardar" — é "valeu pela paciência" quando for adequado. Sem formalidade europeia.
5. **Honesto sobre IA.** A gente diz "Lumiris sugere", "Lumiris estruturou um rascunho". A responsabilidade clínica é sempre do terapeuta.

### Faça
- ✅ "Pronto. Sua evolução foi salva."
- ✅ "Lumiris estruturou um rascunho a partir do seu áudio. Revise antes de salvar."
- ✅ "Não foi possível salvar. Tente de novo em alguns segundos."

### Não faça
- ❌ "Oba! Sucesso! 🎉"
- ❌ "Nossa IA revolucionária criou uma evolução perfeita pra você!"
- ❌ "Erro inesperado. Por favor, tente novamente. Caso o erro persista..." (verboso demais)

### Mensagens de erro
- Curtas, sem "tente novamente" repetido, sem culpa no usuário.
- Quando der pra agir: dizer o que fazer.
- Modelo: `[O que aconteceu]. [O que fazer agora, se houver]`.

---

## 3. Paleta

A paleta da Lumiris gira em torno de uma única ideia: **calor controlado**. Âmbar como cor da chama (Lumiris), apoiado em neutros quentes e um teal sereno pra ações secundárias e elementos clínicos.

### Cores principais

| Token | Hex | Uso |
|---|---|---|
| `brand-50`  | `#FEF7ED` | Fundo de destaque suave, badges |
| `brand-100` | `#FDEDD3` | Hover de elementos brand-suave |
| `brand-200` | `#FBD8A5` | Borders ativas, decorativos |
| `brand-300` | `#F7BC74` | Ilustrações |
| `brand-400` | `#F09F43` | Hover de CTA |
| `brand-500` | `#E8923C` | **Cor principal da marca**, CTA primário |
| `brand-600` | `#C7741F` | CTA pressionado, links em fundo claro |
| `brand-700` | `#9E5816` | Texto sobre fundo brand-50 |
| `brand-800` | `#7A4313` | Acento sério |
| `brand-900` | `#5C3210` | Headlines fortes em material impresso |

**Nunca:** usar brand-500 como fundo grande de página. É cor de **ação**, não de **superfície**.

### Neutros (Ink)

Tons quentes pra texto e estrutura. Não use `gray-*` puro — usamos `ink-*`.

| Token | Hex | Uso |
|---|---|---|
| `ink-50`  | `#FAFAF7` | Surface alternativo |
| `ink-100` | `#F4F3EE` | Cards hover |
| `ink-200` | `#E6E5DE` | Borders |
| `ink-300` | `#C9C7BC` | Borders fortes |
| `ink-400` | `#9A988C` | Texto muted |
| `ink-500` | `#6E6D63` | Texto secundário |
| `ink-600` | `#4F4E47` | Texto corpo |
| `ink-700` | `#373730` | Texto principal |
| `ink-800` | `#21211D` | Headlines |
| `ink-900` | `#0F0F0D` | Texto máximo contraste |

### Acento (Teal sereno)

Pra estados informativos, badges clínicos, foco. Não usar como CTA.

| Token | Hex |
|---|---|
| `accent-500` | `#0D9488` |
| `accent-600` | `#0F766E` |
| `accent-50`  | `#F0FDFA` |

### Superfície

| Token | Hex | Uso |
|---|---|---|
| `surface` | `#FDFCF8` | Background padrão da app |
| `surface-elevated` | `#FFFFFF` | Cards |

### Semânticos

| Token | Hex | Uso |
|---|---|---|
| `success` | `#15803D` | Confirmação |
| `warning` | `#B45309` | Alerta (use com parcimônia) |
| `danger`  | `#B91C1C` | Erro destrutivo |
| `info`    | `#0369A1` | Estados informativos neutros |

---

## 4. Tipografia

**Família única: Inter** (via `next/font`).

Justificativa: legibilidade clínica em corpo, suporte a português, peso variável, neutralidade visual. Pode ser substituída no futuro por uma display serif (ex.: Fraunces) pra hero de marketing, mas no MVP é Inter pra tudo.

### Escala

| Token Tailwind | Tamanho | Uso |
|---|---|---|
| `text-xs`   | 12px | Metadados, labels técnicos |
| `text-sm`   | 14px | UI padrão, formulários |
| `text-base` | 16px | Corpo |
| `text-lg`   | 18px | Subtítulos |
| `text-xl`   | 20px | Section titles |
| `text-2xl`  | 24px | Page titles |
| `text-3xl`  | 30px | H1 padrão |
| `text-5xl`  | 48px | Hero em desktop |
| `text-6xl`  | 60px | Hero gigante (raro) |

### Pesos
- 400 (regular) — corpo.
- 500 (medium) — labels, links em corpo.
- 600 (semibold) — page titles, ênfase forte.
- 700 (bold) — só hero e CTAs grandes.

Evite 800/900 — fica pesado demais pra contexto clínico.

### Comprimento de linha
- Corpo: `max-w-prose` (~65ch).
- Hero: `max-w-2xl` no headline, `max-w-xl` no parágrafo.

---

## 5. Logo

### Construção
O símbolo é **uma chama dentro de um círculo** — síntese de "Lumiris" (a luz que se contém e ilumina). Wordmark `Lumiris` em lowercase, peso semibold, tracking levemente apertado.

```
   ◉   Lumiris
  (chama)
```

### Variantes
1. **Combinada** (padrão): símbolo + wordmark, alinhados horizontalmente.
2. **Apenas símbolo**: favicon, app icon, contextos pequenos (< 28px).
3. **Apenas wordmark**: rodapé denso, mention em texto.

### Cores
- Sobre fundo claro: símbolo em `brand-500`, wordmark em `ink-800`.
- Sobre fundo escuro: símbolo em `brand-400`, wordmark em `ink-50`.
- Monocromático (impressão): tudo em `ink-900` ou tudo em `ink-50`.

### Espaço de respiro
Mantenha sempre um padding equivalente à altura do "l" do wordmark em volta de toda a logo. Não cole em texto ou bordas.

### Não faça
- ❌ Esticar/deformar.
- ❌ Trocar a cor do símbolo por uma cor fora da paleta.
- ❌ Colocar sobre foto sem overlay.
- ❌ Adicionar sombra, gradiente exagerado, contorno.
- ❌ Mudar capitalização (`Lumiris` no wordmark — só em texto corrido).

---

## 6. Aplicações no produto

### Hierarquia de ações
- **Primária (CTA principal):** `bg-brand-500 text-white hover:bg-brand-600`
- **Secundária:** `bg-ink-100 text-ink-800 hover:bg-ink-200`
- **Terciária / link:** `text-brand-600 hover:text-brand-700 underline-offset-4`
- **Destrutiva:** `bg-danger text-white` — só em confirmação modal, nunca em primeira camada.

### Cards
- Fundo `surface-elevated`, border `ink-200`, radius `rounded-lg`, padding interno generoso.
- Sombra apenas em hover ou em estado ativo. Nada de sombra "decorativa".

### Espaçamento
- Vertical entre seções: múltiplos de 8 (`py-8`, `py-12`, `py-16`, `py-24`).
- Horizontal: container `max-w-6xl mx-auto px-6`.

### Estados
- **Loading**: substitua texto do botão por verbo no gerúndio ("Salvando…"). Não trocar layout.
- **Vazio**: ilustração leve (futuro) + frase de uma linha + CTA.
- **Erro**: texto curto em `text-danger`, sem ícone alarmista.
- **Sucesso**: feedback inline, nunca toast persistente.

---

## 7. Tom em comunicações externas

### E-mail
- Assunto curto, sem emoji, sem "Re:" forçado.
- Saudação: "Oi, [nome]" (sem ponto, sem vírgula seguida de linha em branco).
- Assinatura: "Equipe Lumiris" (não "Atenciosamente").

### Redes sociais
- Mostrar produto, mostrar gente.
- Linguagem coloquial, técnica quando o assunto exige.
- Sem hashtags inflacionadas.

### Material clínico (whitepapers, modelos)
- Tom profissional, referenciado, formatação CREFITO.
- Aqui sim pode ter mais formalidade — é o contexto.

---

## 8. Checklist rápido pra qualquer entrega

- [ ] A frase faz sentido se eu ler em voz alta com pressa?
- [ ] Tem alguma palavra em inglês que tem equivalente óbvio em PT-BR?
- [ ] O CTA principal usa `brand-500`?
- [ ] O texto principal usa `ink-700` ou mais escuro?
- [ ] A largura de leitura tá confortável (< 70 chars)?
- [ ] Se for de IA: o usuário sabe que é sugestão e pode revisar?

---

**Última revisão:** 2026-05-26.
**Mantenedor:** Rian.
