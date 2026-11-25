(function(root){
'use strict';
function project(p, annualReturn){
 const keys=['initial','monthly','increase','increaseYears','contributeYears','years','reinvestYears','yield','inflation'];
 for(const k of keys) if(!Number.isFinite(p[k])||p[k]<0) throw Error('Enter valid non-negative numbers.');
 for(const k of ['increaseYears','contributeYears','years','reinvestYears']) if(!Number.isInteger(p[k])) throw Error('Years must be whole numbers.');
 if(p.years<1||p.years>60||p.yield>25||p.inflation>25||!Number.isFinite(annualReturn)||annualReturn<=-100||annualReturn>50) throw Error('Use 1–60 years, returns above −100% and up to 50%, and yield/inflation up to 25%.');
 let balance=p.initial,paid=0,invested=p.initial;
 const monthly=Math.pow(1+annualReturn/100,1/12)-1;
 const dividendRate=p.yield/100/12;
 const rows=[{year:0,balance,paid,invested,wealth:balance}];
 for(let m=0;m<p.years*12;m++){
  const year=Math.floor(m/12);
  // Total return already includes dividends. Withdraw distributions from that return.
  const dividend=year<p.reinvestYears?0:Math.min(balance*(1+monthly),balance*dividendRate);
  balance=balance*(1+monthly)-dividend; paid+=dividend;
  const contribution=year<p.contributeYears?p.monthly+p.increase*Math.min(year,Math.max(0,p.increaseYears-1)):0;
  balance+=contribution;invested+=contribution;
  if((m+1)%12===0) rows.push({year:year+1,balance,paid,invested,wealth:balance+paid});
 }
 return rows;
}
if(typeof module!=='undefined')module.exports={project};else root.InvestmentModel={project};
})(globalThis);
