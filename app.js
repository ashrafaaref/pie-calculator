'use strict';
const $=id=>document.getElementById(id);
const defs=[['currency','Currency','EUR',['EUR','GBP','USD','EGP']],['orientation','Pie orientation','Dividend oriented',['Dividend oriented','Growth oriented']],['pie','Screening version','A — Strict',['A — Strict','B — Tolerant']],['initial','Initial investment',12000],['monthly','Monthly investment',1000],['increase','Yearly monthly-payment increase',200],['increaseYears','Increase through year',10],['contributeYears','Contribute for (years)',15],['years','Project for (years)',15],['reinvestYears','Reinvest dividends for (years)',15],['yield','Annual dividend yield (%)',2],['inflation','Annual inflation (%)',2.5]];
const rates=[['low','Lower total return (%)',-2],['mid','Central total return (%)',6],['high','Upper total return (%)',10]];
for(const [key,title,value,options] of [...defs,...rates]){
 const label=document.createElement('label');label.textContent=title;
 const el=document.createElement(options?'select':'input');el.id=key;el.name=key;
 if(options)options.forEach(x=>el.add(new Option(x,x)));else{el.type='number';el.required=true;el.step=key.includes('Years')||key==='years'?'1':'any';el.min=['low','mid','high'].includes(key)?'-99.99':'0';el.max=key.includes('Years')||key==='years'?'60':['low','mid','high'].includes(key)?'50':['yield','inflation'].includes(key)?'25':'1000000000';}
 el.value=value;label.append(el);$(['low','mid','high'].includes(key)?'assumptions':['orientation','pie','initial','monthly','years'].includes(key)?'fields':'advanced-fields').append(label);
}
let current,baseline=null,mode='simple';
function syncDividendMode(){const n=Number($('reinvestYears').value),years=Number($('years').value);$('dividend-mode').value=n>=years?'reinvest':n===0?'cash':'custom';}
function settingsNote(){const p=read();$('settings-note').textContent=`${p.currency} · Monthly payment rises by ${money(p.increase,p.currency)} yearly through year ${p.increaseYears}. Contributions stop after ${p.contributeYears} years. Returns: ${p.low}% / ${p.mid}% / ${p.high}%.`+(mode==='simple'?' Adjust these in Advanced.':'');}
function setMode(next){mode=next;for(const name of ['simple','advanced']){const active=name===next;$(name+'-panel').hidden=!active;$(name+'-tab').setAttribute('aria-selected',String(active));$(name+'-tab').tabIndex=active?0:-1;}for(const id of ['real-control','export'])$(id).hidden=next!=='advanced';syncDividendMode();try{settingsNote();}catch(e){/* Keep validation in the form. */}}
for(const name of ['simple','advanced']){$(name+'-tab').onclick=()=>setMode(name);$(name+'-tab').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'simple':e.key==='End'?'advanced':mode==='simple'?'advanced':'simple';setMode(next);$(next+'-tab').focus();}};}
$('dividend-mode').onchange=()=>{if($('dividend-mode').value!=='custom')$('reinvestYears').value=$('dividend-mode').value==='reinvest'?$('years').value:0;};
$('years').onchange=()=>{if($('dividend-mode').value==='reinvest')$('reinvestYears').value=$('years').value;};
$('reinvestYears').onchange=syncDividendMode;

function read(){const p={};for(const [key,,,opts] of [...defs,...rates])p[key]=opts?$(key).value:Number($(key).value);if(!(p.low<=p.mid&&p.mid<=p.high))throw Error('Returns must be ordered: lower ≤ central ≤ upper.');return p;}
function money(v,c=current.currency){return new Intl.NumberFormat('en-GB',{style:'currency',currency:c,minimumFractionDigits:0,maximumFractionDigits:0}).format(v);}
function rows(p){return [p.low,p.mid,p.high].map(r=>InvestmentModel.project(p,r));}
function display(v,y,p){return $('real').checked?v/Math.pow(1+p.inflation/100,y):v;}
function render(){
 const p=read(), all=rows(p);current=p;$('error').textContent='';const ends=all.map(r=>r[r.length-1]);
 $('results').innerHTML=ends.map((v,i)=>`<div class="card ${i===1?'central':''}"><small>${['LOWER','CENTRAL','UPPER'][i]} CASE · ${[p.low,p.mid,p.high][i]}%</small><strong>${money(display(v.balance,p.years,p))}</strong><small>Portfolio after ${p.years} years</small></div>`).join('');
 $('summary').innerHTML=`<p><b>${p.orientation} · ${p.pie}</b></p><p>Contributed: <b>${money(ends[1].invested)}</b> nominal<br>Central dividends taken out: <b>${money(display(ends[1].paid,p.years,p))}</b>${$('real').checked?' (cash total expressed in endpoint purchasing power)':''}</p>`;
 const series=all.map((r,i)=>({r,p,color:['#ac7451','#236950','#78a2be'][i],dash:false,name:['Lower','Central','Upper'][i]}));
 if(baseline){if(baseline.currency!==p.currency)throw Error('Use the comparison currency or remove the comparison; no FX conversion is assumed.');rows(baseline).forEach((r,i)=>series.push({r,p:baseline,color:['#ac7451','#236950','#78a2be'][i],dash:true,name:'Comparison '+['lower','central','upper'][i]}));}
 const maxY=Math.max(1,...[].concat(...series.map(s=>s.r.map(v=>display(v.balance,v.year,s.p)))))*1.1,maxX=Math.max(p.years,(baseline?baseline.years:0)),w=760,h=350,left=85,top=20,pw=650,ph=275;
 let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Portfolio projections over years. Exact values are available in the annual breakdown.">`;
 for(let i=0;i<=4;i++){let y=top+ph-i*ph/4;svg+=`<line x1="${left}" x2="735" y1="${y}" y2="${y}" stroke="#e7ede6"/><text x="77" y="${y+4}" text-anchor="end" fill="#60736c" font-size="11">${money(maxY*i/4)}</text>`;}
 for(let x=0;x<=maxX;x+=Math.max(1,Math.ceil(maxX/6)))svg+=`<text x="${left+x/maxX*pw}" y="320" text-anchor="middle" font-size="12" fill="#60736c">Year ${x}</text>`;
 for(const s of series){svg+=`<polyline fill="none" stroke="${s.color}" stroke-width="2.5" ${s.dash?'stroke-dasharray="6 5"':''} points="${s.r.map(v=>`${left+v.year/maxX*pw},${top+ph-display(v.balance,v.year,s.p)/maxY*ph}`).join(' ')}"/>`;for(const v of s.r)svg+=`<circle cx="${left+v.year/maxX*pw}" cy="${top+ph-display(v.balance,v.year,s.p)/maxY*ph}" r="4" fill="${s.color}"><title>${s.name}, year ${v.year}: ${money(display(v.balance,v.year,s.p))}</title></circle>`;}
 $('chart').innerHTML=svg+'</svg>';$('comparison-legend').hidden=!baseline;$('clear').hidden=!baseline;
 $('compare-note').textContent=baseline?`Dashed: ${baseline.orientation}, ${baseline.pie}, ${money(baseline.initial)} initial, ${money(baseline.monthly)}/month + ${money(baseline.increase)} yearly through year ${baseline.increaseYears}; contributions ${baseline.contributeYears} years; horizon ${baseline.years}; reinvest ${baseline.reinvestYears} years; returns ${baseline.low}/${baseline.mid}/${baseline.high}%; yield ${baseline.yield}%; inflation ${baseline.inflation}%.`:'';
 settingsNote();
 $('table').innerHTML='<table><thead><tr><th>Year</th><th>Contributed*</th><th>Lower</th><th>Central</th><th>Upper</th><th>Central paid out</th></tr></thead><tbody>'+all[0].map((v,i)=>`<tr><td>${v.year}</td><td>${money(v.invested)}</td>${all.map(r=>`<td>${money(display(r[i].balance,v.year,p))}</td>`).join('')}<td>${money(display(all[1][i].paid,v.year,p))}</td></tr>`).join('')+'</tbody></table><p class="note">*Contributed amounts are nominal cash deposits. Comparison values are included in the CSV.</p>';
}
function safeRender(){try{render();}catch(e){$('error').textContent=e.message;$('results').innerHTML='';$('chart').innerHTML='';$('summary').innerHTML='';$('table').innerHTML='';}}
$('form').onsubmit=e=>{e.preventDefault();safeRender();};$('real').onchange=safeRender;
$('compare').onclick=()=>{try{const p=read();rows(p);baseline={...p};safeRender();}catch(e){$('error').textContent=e.message;}};
$('clear').onclick=()=>{baseline=null;safeRender();};
$('export').onclick=()=>{try{const p=read();rows(p);if(baseline&&baseline.currency!==p.currency)throw Error('Comparison currency must match.');let lines=['Plan,Orientation,Screening,Currency,Year,Contributed_nominal,Lower_portfolio,Central_portfolio,Upper_portfolio,Central_dividends_paid,Display_basis'];for(const [name,plan] of [['Current',p],...(baseline?[['Comparison',baseline]]:[])]){const a=rows(plan);a[0].forEach((v,i)=>lines.push([name,plan.orientation,plan.pie,plan.currency,v.year,v.invested,...a.map(r=>display(r[i].balance,v.year,plan)),display(a[1][i].paid,v.year,plan),$('real').checked?'Inflation adjusted':'Nominal'].join(',')));}const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));const link=document.createElement('a');link.href=url;link.download='investment-projection.csv';link.click();URL.revokeObjectURL(url);}catch(e){$('error').textContent=e.message;}};
safeRender();
setMode('simple');
