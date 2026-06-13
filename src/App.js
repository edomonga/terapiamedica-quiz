import React, { useState, useCallback } from 'react';
import domande, { argomenti } from './domande';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const APP_PASSWORD = 'medicina2025'; // ← CAMBIA QUI la password condivisa
const EXAM_QUESTIONS = 23;

// ─── HELPERS ───────────────────────────────────────────────────────────────
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

async function correggiRisposta(apiKey, domanda, risposta, rispostaCorretta) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `Sei un professore di Terapia Medica all'Università Vita-Salute San Raffaele. Correggi la risposta dello studente confrontandola con la risposta corretta della dispensa.
Rispondi SOLO con un oggetto JSON valido, senza markdown, senza backtick, nessun testo fuori dal JSON.
Formato esatto:
{
  "voto": "OTTIMO" | "BUONO" | "SUFFICIENTE" | "INSUFFICIENTE",
  "punteggio": <numero 0-10>,
  "feedback": "<3-5 righe: cosa era corretto, cosa mancava, concetti chiave della risposta ideale>",
  "concetti": ["<concetto1>", "<concetto2>", "<concetto3>"]
}
Sii preciso ma incoraggiante. Se la risposta è vuota, dai punteggio 0.`,
      messages: [{
        role: 'user',
        content: `DOMANDA: ${domanda}\n\nRISPOSTA STUDENTE: ${risposta || "(nessuna risposta)"}\n\nRISPOSTA CORRETTA DALLA DISPENSA: ${rispostaCorretta}`
      }]
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Errore API: ${response.status}`);
  }
  const data = await response.json();
  const text = data.content.map(b => b.text || '').join('');
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ─── THEME ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#F6F7F9',
  white: '#FFFFFF',
  ink: '#0D1117',
  ink2: '#374151',
  ink3: '#6B7280',
  ink4: '#9CA3AF',
  border: '#E5E7EB',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  green: '#16A34A',
  greenLight: '#F0FDF4',
  greenBorder: '#BBF7D0',
  yellow: '#D97706',
  yellowLight: '#FFFBEB',
  yellowBorder: '#FDE68A',
  red: '#DC2626',
  redLight: '#FEF2F2',
  redBorder: '#FECACA',
};

const T = {
  display: "'Inter', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

// ─── VOTE MAPS ─────────────────────────────────────────────────────────────
const voteStyle = {
  OTTIMO: { bg: C.greenLight, border: C.greenBorder, color: C.green, icon: '✓' },
  BUONO: { bg: C.blueLight, border: C.blueBorder, color: C.blue, icon: '~' },
  SUFFICIENTE: { bg: C.yellowLight, border: C.yellowBorder, color: C.yellow, icon: '△' },
  INSUFFICIENTE: { bg: C.redLight, border: C.redBorder, color: C.red, icon: '✗' },
};

const voteScore = { OTTIMO: 4, BUONO: 3, SUFFICIENTE: 2, INSUFFICIENTE: 0 };

// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = 'primary', disabled, style = {} }) => {
  const base = {
    fontFamily: T.display, fontSize: 14, fontWeight: 600, borderRadius: 10,
    padding: '11px 22px', cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'opacity .15s, transform .1s',
    opacity: disabled ? .5 : 1, display: 'inline-flex', alignItems: 'center', gap: 7,
    ...style,
  };
  const vars = {
    primary: { backgroundColor: C.blue, color: '#fff' },
    secondary: { backgroundColor: C.white, color: C.ink2, border: `1.5px solid ${C.border}` },
    ghost: { backgroundColor: 'transparent', color: C.ink3, border: `1.5px solid ${C.border}` },
    danger: { backgroundColor: C.red, color: '#fff' },
  };
  return <button style={{ ...base, ...vars[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Spinner = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ animation: 'spin .7s linear infinite' }}>
    <circle cx={8} cy={8} r={6} stroke="rgba(255,255,255,.3)" strokeWidth={2.5} />
    <path d="M8 2a6 6 0 0 1 6 6" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

// ─── SCREENS ───────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const attempt = () => {
    if (pwd === APP_PASSWORD) onLogin();
    else { setErr('Password errata. Riprova.'); setPwd(''); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.display }}>
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: '48px 44px', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🩺</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-.02em', color: C.ink }}>Terapia Medica</h1>
        <p style={{ fontSize: 14, color: C.ink3, margin: '0 0 32px', lineHeight: 1.5 }}>Inserisci la password per accedere al quiz.</p>
        <input
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${err ? C.red : C.border}`, fontSize: 15, fontFamily: T.mono, outline: 'none', boxSizing: 'border-box', marginBottom: 8, backgroundColor: C.bg, color: C.ink }}
        />
        {err && <p style={{ color: C.red, fontSize: 13, margin: '0 0 12px' }}>{err}</p>}
        <Btn onClick={attempt} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Accedi →</Btn>
      </div>
    </div>
  );
}

function SetupScreen({ onStart, userName, setUserName, apiKey, setApiKey }) {
  const [mode, setMode] = useState('argomento'); // 'argomento' | 'random' | 'esame'
  const [selectedArgs, setSelectedArgs] = useState([]);
  const [numQ, setNumQ] = useState(10);
  const [err, setErr] = useState('');

  const toggleArg = a => setSelectedArgs(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const allSelected = selectedArgs.length === argomenti.length;
  const toggleAll = () => setSelectedArgs(allSelected ? [] : [...argomenti]);

  const maxQ = mode === 'argomento'
    ? domande.filter(d => selectedArgs.includes(d.argomento)).length
    : domande.length;

  const startable = apiKey.trim() && userName.trim() && (
    mode === 'esame' ||
    (mode === 'random' && numQ >= 1) ||
    (mode === 'argomento' && selectedArgs.length > 0 && numQ >= 1)
  );

  const handleStart = () => {
    if (!apiKey.trim()) { setErr('Inserisci la tua API key Anthropic.'); return; }
    if (!userName.trim()) { setErr('Inserisci il tuo nome.'); return; }

    let pool;
    if (mode === 'esame') {
      pool = shuffle(domande).slice(0, EXAM_QUESTIONS);
    } else if (mode === 'random') {
      pool = shuffle(domande).slice(0, Math.min(numQ, domande.length));
    } else {
      const filtered = domande.filter(d => selectedArgs.includes(d.argomento));
      pool = shuffle(filtered).slice(0, Math.min(numQ, filtered.length));
    }
    onStart({ pool, mode, isExam: mode === 'esame' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: T.display, padding: '40px 20px' }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 38, height: 38, backgroundColor: C.blue, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>T</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Terapia Medica — Quiz UNISR</div>
            <div style={{ fontSize: 12, color: C.ink4 }}>Dispensa Piazza · {domande.length} domande</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 36 }}>

          {/* Nome + API key */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Il tuo nome</label>
              <input
                type="text" placeholder="es. Marco"
                value={userName} onChange={e => { setUserName(e.target.value); setErr(''); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: T.display, outline: 'none', boxSizing: 'border-box', color: C.ink, backgroundColor: C.bg }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>API Key Anthropic</label>
              <input
                type="password" placeholder="sk-ant-..."
                value={apiKey} onChange={e => { setApiKey(e.target.value); setErr(''); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: T.mono, outline: 'none', boxSizing: 'border-box', color: C.ink, backgroundColor: C.bg }}
              />
            </div>
          </div>

          {/* Mode selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>Modalità</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { key: 'argomento', label: 'Per argomento', sub: 'Scegli i capitoli' },
                { key: 'random', label: 'Casuale', sub: 'Mix di tutto' },
                { key: 'esame', label: '📝 Modalità Esame', sub: `${EXAM_QUESTIONS} domande con voto finale` },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)} style={{
                  border: `2px solid ${mode === m.key ? C.blue : C.border}`,
                  backgroundColor: mode === m.key ? C.blueLight : C.white,
                  borderRadius: 10, padding: '12px 10px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all .15s',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: mode === m.key ? C.blue : C.ink, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: C.ink4 }}>{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Argomenti (solo se mode = argomento) */}
          {mode === 'argomento' && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, textTransform: 'uppercase', letterSpacing: '.04em' }}>Argomenti</label>
                <button onClick={toggleAll} style={{ fontSize: 11, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.display, fontWeight: 600 }}>
                  {allSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 260, overflowY: 'auto', padding: '2px 0' }}>
                {argomenti.map(a => {
                  const n = domande.filter(d => d.argomento === a).length;
                  const sel = selectedArgs.includes(a);
                  return (
                    <button key={a} onClick={() => toggleArg(a)} style={{
                      border: `1.5px solid ${sel ? C.blue : C.border}`,
                      backgroundColor: sel ? C.blueLight : C.white,
                      borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                      fontSize: 12, fontFamily: T.display, fontWeight: sel ? 600 : 400,
                      color: sel ? C.blue : C.ink3, transition: 'all .12s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {a}
                      <span style={{ fontSize: 10, color: sel ? C.blue : C.ink4, fontFamily: T.mono }}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Numero domande (non esame) */}
          {mode !== 'esame' && (
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.ink2, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Numero di domande — <span style={{ color: C.blue, fontFamily: T.mono }}>{numQ}</span>
                {mode === 'argomento' && selectedArgs.length > 0 && (
                  <span style={{ color: C.ink4, fontWeight: 400 }}> (max {maxQ})</span>
                )}
              </label>
              <input
                type="range" min={1} max={Math.max(1, maxQ)}
                value={Math.min(numQ, maxQ)} onChange={e => setNumQ(+e.target.value)}
                style={{ width: '100%', accentColor: C.blue }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.ink4, fontFamily: T.mono, marginTop: 4 }}>
                <span>1</span><span>{Math.max(1, maxQ)}</span>
              </div>
            </div>
          )}

          {err && <p style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{err}</p>}

          <Btn onClick={handleStart} disabled={!startable} style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px 24px' }}>
            {mode === 'esame' ? '📝 Inizia simulazione esame' : 'Inizia sessione →'}
          </Btn>

          <p style={{ fontSize: 12, color: C.ink4, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            API key: ottienila gratis su{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: C.blue }}>console.anthropic.com</a>
            {' '}· non viene mai salvata
          </p>
        </div>
      </div>
    </div>
  );
}

function QuizScreen({ pool, isExam, userName, apiKey, onEnd }) {
  const [current, setCurrent] = useState(0);
  const [risposta, setRisposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [err, setErr] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState([]); // { domanda, risposta, feedback }
  const [done, setDone] = useState(false);

  const q = pool[current];
  const progress = ((current) / pool.length) * 100;

  const handleSubmit = async () => {
    setErr(''); setLoading(true); setFeedback(null);
    try {
      const fb = await correggiRisposta(apiKey, q.domanda, risposta, q.risposta);
      setFeedback(fb);
      setResults(prev => [...prev, { q, risposta, fb }]);
    } catch (e) {
      setErr(e.message || 'Errore correzione. Controlla la API key.');
    } finally { setLoading(false); }
  };

  const handleSkip = () => {
    setResults(prev => [...prev, { q, risposta: '(saltata)', fb: { voto: 'INSUFFICIENTE', punteggio: 0, feedback: 'Domanda saltata.', concetti: [] } }]);
    advance();
  };

  const advance = useCallback(() => {
    if (current + 1 >= pool.length) { setDone(true); }
    else { setCurrent(c => c + 1); setRisposta(''); setFeedback(null); setErr(''); setShowHint(false); }
  }, [current, pool.length]);

  if (done) return <ResultsScreen results={results} pool={pool} isExam={isExam} userName={userName} onEnd={onEnd} />;

  const vs = feedback ? (voteStyle[feedback.voto] || voteStyle.SUFFICIENTE) : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: T.display }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}input:focus,textarea:focus{border-color:${C.blue}!important}`}</style>

      {/* Top bar */}
      <div style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, backgroundColor: C.blue, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>T</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{isExam ? '📝 Simulazione Esame' : 'Sessione di studio'}</span>
          {isExam && <span style={{ fontSize: 11, backgroundColor: C.yellowLight, color: C.yellow, border: `1px solid ${C.yellowBorder}`, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>ESAME</span>}
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C.ink3, fontFamily: T.mono }}>{current + 1}/{pool.length}</span>
          <span style={{ fontSize: 13, color: C.ink4 }}>{userName}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, backgroundColor: C.border }}>
        <div style={{ height: '100%', backgroundColor: C.blue, width: `${progress}%`, transition: 'width .4s ease' }} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>

        {/* Question card */}
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: C.blueLight, color: C.blue, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.06em' }}>{q.argomento}</span>
            <span style={{ fontSize: 11, color: C.ink4, fontFamily: T.mono }}>#{q.id}</span>
          </div>

          <p style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.55, color: C.ink, margin: '0 0 20px', letterSpacing: '-.01em' }}>{q.domanda}</p>

          {!showHint
            ? <button onClick={() => setShowHint(true)} style={{ fontSize: 12, color: C.ink4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: T.display, textDecoration: 'underline', marginBottom: 14 }}>Mostra risposta di riferimento</button>
            : (
              <div style={{ backgroundColor: '#FAFAFA', border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.ink4, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Risposta dalla dispensa</div>
                <p style={{ fontSize: 13, color: C.ink2, margin: 0, lineHeight: 1.6 }}>{q.risposta}</p>
              </div>
            )
          }

          <textarea
            value={risposta}
            onChange={e => setRisposta(e.target.value)}
            disabled={!!feedback || loading}
            placeholder="Scrivi la tua risposta (max 2 righe)…"
            rows={3}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontFamily: T.display, color: C.ink, resize: 'vertical', outline: 'none', lineHeight: 1.6, backgroundColor: feedback ? '#FAFAFA' : C.white }}
          />
          <div style={{ fontSize: 11, color: C.ink4, textAlign: 'right', marginTop: 4, fontFamily: T.mono }}>{risposta.length} car.</div>

          {err && <p style={{ color: C.red, fontSize: 13, marginTop: 8 }}>{err}</p>}

          {!feedback && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={handleSubmit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? <><Spinner /> Correzione in corso…</> : 'Correggi risposta'}
              </Btn>
              {!isExam && (
                <Btn variant="ghost" onClick={handleSkip} disabled={loading}>Salta</Btn>
              )}
            </div>
          )}
        </div>

        {/* Feedback card */}
        {feedback && vs && (
          <div style={{ backgroundColor: vs.bg, border: `1px solid ${vs.border}`, borderRadius: 16, padding: 28, animation: 'fadeUp .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: vs.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: vs.color, flexShrink: 0 }}>{vs.icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: vs.color }}>{feedback.voto}</div>
                <div style={{ fontSize: 13, color: vs.color, opacity: .85 }}>{feedback.punteggio}/10</div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: C.ink2, margin: '0 0 14px', borderTop: `1px solid ${vs.border}`, paddingTop: 14 }}>{feedback.feedback}</p>
            {feedback.concetti?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                {feedback.concetti.map((c, i) => (
                  <span key={i} style={{ backgroundColor: vs.border, color: vs.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{c}</span>
                ))}
              </div>
            )}
            <Btn onClick={advance} style={{ width: '100%', justifyContent: 'center', backgroundColor: C.ink, color: '#fff' }}>
              {current + 1 >= pool.length ? 'Vedi risultati →' : 'Prossima domanda →'}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsScreen({ results, pool, isExam, userName, onEnd }) {
  const [showReview, setShowReview] = useState(false);

  const counts = { OTTIMO: 0, BUONO: 0, SUFFICIENTE: 0, INSUFFICIENTE: 0 };
  let totalScore = 0;
  results.forEach(r => {
    if (r.fb) {
      counts[r.fb.voto] = (counts[r.fb.voto] || 0) + 1;
      totalScore += voteScore[r.fb.voto] || 0;
    }
  });
  const maxScore = pool.length * 4;
  const pct = Math.round((totalScore / maxScore) * 100);

  // Exam grade (Italian university scale 18-30)
  const examGrade = isExam ? Math.min(30, Math.round(18 + (pct / 100) * 12)) : null;
  const passed = examGrade >= 18;

  const emoji = pct >= 80 ? '🎯' : pct >= 60 ? '📚' : '💪';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: T.display, padding: '40px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '40px 36px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{emoji}</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-.02em', color: C.ink }}>
            {isExam ? (passed ? 'Esame superato!' : 'Esame non superato') : 'Sessione completata!'}
          </h2>
          <p style={{ fontSize: 15, color: C.ink3, margin: '0 0 32px' }}>
            {userName} · {pool.length} domande
          </p>

          {isExam && (
            <div style={{ backgroundColor: passed ? C.greenLight : C.redLight, border: `2px solid ${passed ? C.greenBorder : C.redBorder}`, borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: passed ? C.green : C.red, lineHeight: 1, marginBottom: 4, fontFamily: T.mono }}>{examGrade}/30</div>
              <div style={{ fontSize: 14, color: passed ? C.green : C.red, fontWeight: 600 }}>{passed ? 'Voto sufficiente' : 'Voto insufficiente'}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Ottimo', val: counts.OTTIMO, ...voteStyle.OTTIMO },
              { label: 'Buono', val: counts.BUONO, ...voteStyle.BUONO },
              { label: 'Sufficiente', val: counts.SUFFICIENTE, ...voteStyle.SUFFICIENTE },
              { label: 'Insufficiente', val: counts.INSUFFICIENTE, ...voteStyle.INSUFFICIENTE },
            ].map(x => (
              <div key={x.label} style={{ backgroundColor: x.bg, border: `1px solid ${x.border}`, borderRadius: 12, padding: '14px 8px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: x.color, lineHeight: 1, marginBottom: 4, fontFamily: T.mono }}>{x.val}</div>
                <div style={{ fontSize: 10, color: x.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{x.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn onClick={() => setShowReview(!showReview)} variant="secondary">
              {showReview ? 'Nascondi revisione' : '🔍 Rivedi le risposte'}
            </Btn>
            <Btn onClick={onEnd}>← Nuova sessione</Btn>
          </div>
        </div>

        {/* Review section */}
        {showReview && results.map((r, i) => {
          const vs = r.fb ? (voteStyle[r.fb.voto] || voteStyle.SUFFICIENTE) : voteStyle.INSUFFICIENTE;
          return (
            <div key={i} style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 12, animation: 'fadeUp .2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ backgroundColor: vs.bg, border: `1px solid ${vs.border}`, borderRadius: 8, padding: '3px 8px', fontSize: 12, fontWeight: 700, color: vs.color, flexShrink: 0 }}>
                  {r.fb?.voto || '—'} {r.fb?.punteggio}/10
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.5 }}>{r.q.domanda}</p>
              </div>
              <div style={{ fontSize: 13, color: C.ink3, backgroundColor: C.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                <strong style={{ color: C.ink4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Tua risposta: </strong>{r.risposta}
              </div>
              {r.fb?.feedback && (
                <p style={{ fontSize: 13, color: C.ink2, margin: 0, lineHeight: 1.6, borderLeft: `3px solid ${vs.border}`, paddingLeft: 12 }}>{r.fb.feedback}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState('setup'); // setup | quiz
  const [userName, setUserName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [session, setSession] = useState(null);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  if (screen === 'quiz' && session) {
    return <QuizScreen {...session} userName={userName} apiKey={apiKey} onEnd={() => { setSession(null); setScreen('setup'); }} />;
  }

  return (
    <SetupScreen
      userName={userName} setUserName={setUserName}
      apiKey={apiKey} setApiKey={setApiKey}
      onStart={s => { setSession(s); setScreen('quiz'); }}
    />
  );
}
