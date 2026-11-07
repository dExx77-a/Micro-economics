const app = document.getElementById("app");
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const TABS = [["summary","Summary"],["cards","Flashcards"],["quiz","Multiple choice"],["tf","True or false"]];

function home(){
  app.innerHTML = `<h1>Microeconomics</h1><p class="note">Pick a chapter to read the summary, flip flashcards or take a quiz.</p>
  <div class="chlist">${CHAPTERS.map(c=>{
    const s = ["quiz","tf"].map(k=>store.get(c.id+":"+k)).filter(Boolean);
    return `<a href="#${c.id}/summary"><strong>${c.title}</strong><small>${c.blurb}${s.length?" Best scores saved.":""}</small></a>`;
  }).join("")}</div>`;
}

function chapter(ch, tab){
  app.innerHTML = `<a href="#">All chapters</a><h1>${ch.title}</h1>
  <nav class="tabs">${TABS.map(([k,l])=>`<a href="#${ch.id}/${k}" class="${k===tab?"on":""}">${l}</a>`).join("")}</nav>
  <section class="panel" id="panel"></section>`;
  const panel = document.getElementById("panel");
  if(tab==="cards") cards(ch,panel);
  else if(tab==="quiz") quiz(ch,"quiz",ch.mc,panel);
  else if(tab==="tf") quiz(ch,"tf",ch.tf.map(q=>({q:q.q,options:["True","False"],answer:q.answer?0:1,why:q.why})),panel);
  else summary(ch,panel);
}

function summary(ch,p){
  p.innerHTML = `<h2>Key ideas</h2>${ch.summary.map(t=>`<p>${t}</p>`).join("")}
  <h2>Real-life examples</h2>${ch.examples.map(e=>`<div class="example"><strong>${e.t}</strong><br>${e.d}</div>`).join("")}`;
}

function cards(ch,p){
  let list = ch.cards, i = 0, back = false;
  const draw = () => {
    const c = list[i];
    p.innerHTML = `<p class="count">Card ${i+1} of ${list.length}</p>
    <button class="card ${back?"back":""}" id="flip" aria-label="Flip card">${back?c.a:c.q}</button>
    <p class="note">${back?"Answer":"Question"}. Tap the card to flip it.</p>
    <div class="row"><button id="prev">Previous</button><button id="next" class="primary">Next card</button><button id="shuf">Shuffle</button></div>`;
    document.getElementById("flip").onclick = () => { back=!back; draw(); };
    document.getElementById("prev").onclick = () => { i=(i-1+list.length)%list.length; back=false; draw(); };
    document.getElementById("next").onclick = () => { i=(i+1)%list.length; back=false; draw(); };
    document.getElementById("shuf").onclick = () => { list=shuffle(list); i=0; back=false; draw(); };
  };
  draw();
}

function quiz(ch,kind,pool,p){
  const key = ch.id+":"+kind;
  let list = shuffle(pool), i = 0, score = 0, missed = [], full = true;
  const show = () => {
    if(i>=list.length) return done();
    const q = list[i];
    const base = q.options.map((t,n)=>({t, ok:n===q.answer}));
    const o = kind==="tf" ? base : shuffle(base);
    p.innerHTML = `<p class="count">Question ${i+1} of ${list.length}</p><h2>${q.q}</h2>
    <div class="opts">${o.map((x,n)=>`<button data-n="${n}">${x.t}</button>`).join("")}</div><div id="fb" aria-live="polite"></div>`;
    p.querySelectorAll(".opts button").forEach(b => b.onclick = () => {
      const x = o[b.dataset.n];
      p.querySelectorAll(".opts button").forEach((bb,n)=>{ bb.disabled=true; if(o[n].ok) bb.classList.add("right"); });
      if(x.ok) score++; else { b.classList.add("wrong"); missed.push(q); }
      document.getElementById("fb").innerHTML = `<p><strong>${x.ok?"Correct.":"Not quite."}</strong> ${q.why}</p><button class="primary" id="nx">${i+1<list.length?"Next question":"See score"}</button>`;
      document.getElementById("nx").onclick = () => { i++; show(); };
    });
  };
  const done = () => {
    let best = (store.get(key)||{}).best || 0;
    if(full){ best = Math.max(best,score); store.set(key,{best,total:list.length}); }
    p.innerHTML = `<h2>You got ${score} of ${list.length}</h2>${full?`<p class="note">Best score: ${best} of ${list.length}</p>`:""}
    <div class="row">${missed.length?`<button id="rm" class="primary">Retry the ${missed.length} you missed</button>`:""}<button id="again">Start over</button></div>`;
    if(missed.length) document.getElementById("rm").onclick = () => { list=shuffle(missed); i=0; score=0; missed=[]; full=false; show(); };
    document.getElementById("again").onclick = () => { list=shuffle(pool); i=0; score=0; missed=[]; full=true; show(); };
  };
  show();
}

function route(){
  const [id,tab] = location.hash.slice(1).split("/");
  const ch = CHAPTERS.find(c=>c.id===id);
  ch ? chapter(ch, tab||"summary") : home();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange", route);
route();
