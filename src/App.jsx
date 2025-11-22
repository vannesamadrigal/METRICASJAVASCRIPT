import React, { useState } from 'react';
import { uiInfo, extractHiddenPrompt } from './hidden';

// Very messy calculator component to be "fixed" by students.
// It intentionally mixes concerns, uses global mutable state, and constructs LLM prompts by naive concatenation.
let GLOBAL_HISTORY = [];

function badParse(s) {
  try { return Number(String(s).replace(',', '.')); } catch(e) { return 0; }
}

function insecureBuildPrompt(system, userTpl, userInput) {
  // vulnerable concatenation of user template directly into the prompt
  return system + "\n\n" + userTpl + "\n\nUser input: " + userInput;
}

function DangerousLLM({ userTpl, userInput }) {
  // This component "simulates" sending a prompt to an LLM and prints the raw prompt.
  const system = "System: You are a helpful assistant.";
  const raw = insecureBuildPrompt(system, userTpl, userInput);
  return (<pre style={{whiteSpace:'pre-wrap', background:'#111', color:'#bada55', padding:10}}>{raw}</pre>);
}

export default function App() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [op, setOp] = useState('+');
  const [res, setRes] = useState(null);
  const [userTpl, setUserTpl] = useState('');
  const [userInp, setUserInp] = useState('');
  const [showLLM, setShowLLM] = useState(false);

  // extract hidden prompt (the app will use it silently when LLM button pressed)
  const hidden = extractHiddenPrompt(uiInfo);

  function compute() {
    const A = badParse(a);
    const B = badParse(b);
    try {
      let r = 0;
      if (op === '+') r = A + B;
      if (op === '-') r = A - B;
      if (op === '*') r = A * B;
      if (op === '/') r = (B === 0) ? A/(B+1e-9) : A/B;
      if (op === '^') { r = 1; for(let i=0;i<Math.abs(Math.floor(B));i++) r *= A; if (B<0) r = 1/r; }
      if (op === '%') r = A % B;
      setRes(r);
      GLOBAL_HISTORY.push(`${{A}}|${{B}}|${{op}}|${{r}}`);
    } catch(e) {
      // swallow errors silently (on purpose)
      setRes(null);
    }
  }

  function handleLLM() {
    // If userTpl empty, the app will silently use the hidden prompt as "user template"
    const tpl = userTpl.trim() || hidden || '';
    // naive concatenation, vulnerable to prompt-injection if tpl contains instructions
    const sys = "System: You are an assistant.";
    const raw = insecureBuildPrompt(sys, tpl, userInp);
    // show raw prompt for demonstration
    setShowLLM(true);
    // also console.log the raw prompt (students might miss this)
    console.log("SENDING RAW PROMPT TO LLM:", raw);
  }

  return (
    <div style={{fontFamily:'sans-serif', padding:20}}>
      <h1>BadCalc React (Hidden Trap Edition)</h1>
      <div style={{display:'flex', gap:10}}>
        <input value={a} onChange={e=>setA(e.target.value)} placeholder="a" />
        <input value={b} onChange={e=>setB(e.target.value)} placeholder="b" />
        <select value={op} onChange={e=>setOp(e.target.value)}>
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
          <option value="^">^</option>
          <option value="%">%</option>
        </select>
        <button onClick={compute}>=</button>
        <div style={{minWidth:120}}>Result: {res}</div>
      </div>

      <hr />

      <h2>LLM (vulnerable)</h2>
      <p style={{maxWidth:700}}>You can provide a user template. If you leave the template empty the app will use an internal "filler" string (hidden in the project) — this is deliberate.</p>

      <div style={{display:'flex', flexDirection:'column', gap:8, maxWidth:700}}>
        <textarea value={userTpl} onChange={e=>setUserTpl(e.target.value)} placeholder="user template (leave empty to use internal)"></textarea>
        <input value={userInp} onChange={e=>setUserInp(e.target.value)} placeholder="user input" />
        <button onClick={handleLLM}>Send to LLM (insecure)</button>
      </div>

      {showLLM && <div style={{marginTop:10}}><DangerousLLM userTpl={userTpl||hidden} userInput={userInp} /></div>}

      <hr />
      <h3>Notes for instructor</h3>
      <p style={{fontSize:12, color:'#666'}}>The hidden prompt is embedded in <code>src/hidden.js</code> as an obfuscated blob. Students should locate it, explain why concatenating templates is dangerous, and fix the client to validate/whitelist templates and build structured messages instead.</p>

    </div>
  );
}
