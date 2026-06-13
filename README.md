# 🩺 Terapia Medica — Quiz UNISR

App per prepararsi all'esame di Terapia Medica (dispensa Piazza, UNISR).  
225 domande da tutti gli appelli, organizzate per argomento, con correzione AI.

---

## Funzionalità

- 🔐 **Accesso con password** condivisa (modifica in `src/App.js`, riga `APP_PASSWORD`)
- 📂 **Selezione argomenti** — scegli uno o più capitoli della dispensa
- 🎲 **Modalità casuale** — mix di tutte le domande
- 📝 **Modalità Esame** — 23 domande estratte a caso, voto finale 18-30
- 🤖 **Correzione AI** — basata sulla risposta della dispensa Piazza
- 📊 **Revisione completa** — rivedi tutte le risposte con feedback a fine sessione

---

## Setup rapido (Vercel, ~10 minuti)

### 1. Personalizza la password
Apri `src/App.js`, riga 8:
```js
const APP_PASSWORD = 'medicina2025'; // ← cambia questa
```

### 2. Pubblica su GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/tuonome/medicina-quiz.git
git push -u origin main
```

### 3. Deploy su Vercel
1. Vai su [vercel.com](https://vercel.com) → New Project
2. Importa il repository GitHub
3. Clicca **Deploy** (Vercel rileva React automaticamente)
4. Condividi il link con i colleghi!

### In alternativa — Vercel CLI
```bash
npm install -g vercel
npm install
vercel
```

---

## Come usare l'app

1. **Apri il link** → inserisci la password condivisa
2. **Inserisci il tuo nome** e la tua **API key Anthropic** (gratuita su [console.anthropic.com](https://console.anthropic.com))
3. **Scegli la modalità**: per argomento, casuale o esame
4. **Rispondi** in 1-2 righe → la correzione AI è immediata
5. A fine sessione, **rivedi tutte le risposte** con feedback dettagliato

---

## Struttura
```
src/
├── App.js       ← logica principale, UI, password
└── domande.js   ← 225 domande da aggiungere/modificare
```

## Aggiungere domande
In `src/domande.js`, aggiungi all'array:
```js
{ id: 226, argomento: "Nome argomento", domanda: "La tua domanda?", risposta: "Risposta dalla dispensa." }
```
Gli argomenti vengono generati automaticamente dall'array.
