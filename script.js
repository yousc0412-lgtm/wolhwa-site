const $ = (s) => document.querySelector(s);
const grid = $("#calculatorGrid");
const dialog = $("#calculatorDialog");
const content = $("#calculatorContent");
const resultValue = $("#resultValue");
const resultNote = $("#resultNote");
const disclaimer = $("#dialogDisclaimer");
let activeTool = "";

$("#year").textContent = new Date().getFullYear();

const specs = {
  percent: {title:"퍼센트 계산기", fields:[
    {id:"base",label:"기준 숫자",type:"number",value:100,step:"any"},
    {id:"rate",label:"퍼센트 (%)",type:"number",value:15,step:"any"}], note:"입력한 기준 숫자의 해당 비율을 계산합니다."},
  discount: {title:"할인 계산기", fields:[
    {id:"price",label:"원래 가격 (원)",type:"number",value:50000,min:0},
    {id:"rate",label:"할인율 (%)",type:"number",value:20,min:0,max:100,step:"any"}], note:"할인 금액과 할인 후 가격을 계산합니다."},
  vat: {title:"부가세 계산기", fields:[
    {id:"amount",label:"금액 (원)",type:"number",value:110000,min:0},
    {id:"mode",label:"입력 금액 기준",type:"select",options:[["included","부가세 포함 금액"],["excluded","부가세 별도 공급가액"]]}], note:"일반적인 10% 부가세율을 가정한 참고 계산입니다."},
  loan: {title:"대출 상환 계산기", fields:[
    {id:"principal",label:"대출 원금 (원)",type:"number",value:10000000,min:0},
    {id:"rate",label:"연 이자율 (%)",type:"number",value:5,min:0,step:"any"},
    {id:"months",label:"상환 기간 (개월)",type:"number",value:36,min:1,max:600}], note:"원리금균등상환을 가정합니다. 실제 금융기관의 수수료·상환 조건은 반영되지 않습니다."},
  savings: {title:"저축 계산기", fields:[
    {id:"monthly",label:"매월 저축액 (원)",type:"number",value:300000,min:0},
    {id:"months",label:"저축 기간 (개월)",type:"number",value:12,min:1,max:1200},
    {id:"rate",label:"연 이자율 (%)",type:"number",value:3,min:0,step:"any"}], note:"매월 말에 저축하고 월복리로 계산한 단순 추정치이며 세금은 제외합니다."},
  convert: {title:"단위 변환기", fields:[
    {id:"amount",label:"변환할 값",type:"number",value:100,step:"any"},
    {id:"unit",label:"변환 종류",type:"select",options:[["cm-m","센티미터 → 미터"],["m-cm","미터 → 센티미터"],["m-km","미터 → 킬로미터"],["km-m","킬로미터 → 미터"],["g-kg","그램 → 킬로그램"],["kg-g","킬로그램 → 그램"],["inch-cm","인치 → 센티미터"],["pyeong-m2","평 → 제곱미터"],["m2-pyeong","제곱미터 → 평"]]}], note:"평과 제곱미터는 1평 = 약 3.305785㎡ 기준입니다."},
  age: {title:"만 나이 계산기", fields:[
    {id:"birth",label:"생년월일",type:"date",value:""}], note:"오늘 날짜 기준으로 만 나이를 계산합니다."},
  salary: {title:"급여 환산 계산기", fields:[
    {id:"amount",label:"급여 금액 (원)",type:"number",value:2500000,min:0},
    {id:"mode",label:"입력 기준",type:"select",options:[["monthly","월급 → 연봉 환산"],["annual","연봉 → 월급 환산"]]}], note:"세금과 4대 보험을 공제하기 전의 단순 환산이며 실수령액이 아닙니다."}
};

function fieldMarkup(f) {
  if (f.type === "select") {
    return `<div class="field"><label for="${f.id}">${f.label}</label><select id="${f.id}">${f.options.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join("")}</select></div>`;
  }
  const value = f.value === "" ? "" : `value="${f.value}"`;
  return `<div class="field"><label for="${f.id}">${f.label}</label><input id="${f.id}" type="${f.type}" ${value} ${f.min !== undefined ? `min="${f.min}"` : ""} ${f.max !== undefined ? `max="${f.max}"` : ""} ${f.step ? `step="${f.step}"` : ""} ${f.type === "date" ? 'max="' + new Date().toISOString().slice(0,10) + '"' : ""} required></div>`;
}
function openTool(key) {
  activeTool = key;
  const spec = specs[key];
  $("#dialogTitle").textContent = spec.title;
  content.innerHTML = `<div class="field-row">${spec.fields.map(fieldMarkup).join("")}</div><button class="calc-button" id="calculateButton">계산하기</button>`;
  disclaimer.textContent = spec.note;
  resultValue.textContent = "값을 입력해 주세요.";
  resultNote.textContent = "";
  dialog.showModal();
  $("#calculateButton").addEventListener("click", calculate);
  content.querySelectorAll("input,select").forEach(el => el.addEventListener("keydown", e => {if(e.key==="Enter") calculate();}));
}
function num(id) { const el = $("#"+id); return el ? Number(el.value) : NaN; }
function valid(ids) {
  for (const id of ids) {
    const el = $("#"+id);
    if (!el || el.value.trim()==="" || !Number.isFinite(Number(el.value))) {
      if (el) el.focus();
      resultValue.textContent = "숫자 또는 날짜를 올바르게 입력해 주세요.";
      resultNote.textContent = "";
      return false;
    }
  }
  return true;
}
function won(n) { return Math.round(n).toLocaleString("ko-KR")+"원"; }
function nice(n) { return Number(n.toFixed(6)).toLocaleString("ko-KR",{maximumFractionDigits:6}); }
function show(value,note="") { resultValue.textContent=value; resultNote.textContent=note; }
function calculate() {
  switch(activeTool) {
    case "percent": {
      if(!valid(["base","rate"])) return;
      const b=num("base"), r=num("rate");
      show(nice(b*r/100), `${nice(b)}의 ${nice(r)}%`);
      break;
    }
    case "discount": {
      if(!valid(["price","rate"])) return;
      const p=num("price"), r=num("rate");
      if(p<0||r<0||r>100){show("입력값을 확인해 주세요.","가격은 0 이상, 할인율은 0~100%로 입력하세요.");return;}
      show(won(p*(1-r/100)), `할인 금액 ${won(p*r/100)} · 할인 전 ${won(p)}`);
      break;
    }
    case "vat": {
      if(!valid(["amount"])) return;
      const a=num("amount"), mode=$("#mode").value;
      if(a<0){show("0 이상의 금액을 입력해 주세요.");return;}
      if(mode==="included") show(`공급가액 ${won(a/1.1)}`,`부가세 ${won(a-a/1.1)} · 합계 ${won(a)}`);
      else show(`합계 ${won(a*1.1)}`,`공급가액 ${won(a)} · 부가세 ${won(a*.1)}`);
      break;
    }
    case "loan": {
      if(!valid(["principal","rate","months"])) return;
      const p=num("principal"), annual=num("rate"), months=Math.floor(num("months"));
      if(p<0||annual<0||months<1||months>600){show("입력값을 확인해 주세요.","원금과 이율은 0 이상, 기간은 1~600개월로 입력하세요.");return;}
      const r=annual/1200, pay=r===0?p/months:p*r/(1-Math.pow(1+r,-months));
      show(won(pay),`총 납입액 약 ${won(pay*months)} · 총 이자 약 ${won(pay*months-p)}`);
      break;
    }
    case "savings": {
      if(!valid(["monthly","months","rate"])) return;
      const m=num("monthly"), n=Math.floor(num("months")), r=num("rate")/1200;
      if(m<0||n<1||n>1200||r<0){show("입력값을 확인해 주세요.");return;}
      const total=m*n, future=r===0?total:m*(Math.pow(1+r,n)-1)/r;
      show(won(future),`납입 원금 ${won(total)} · 예상 이자 ${won(future-total)} (세금 제외)`);
      break;
    }
    case "convert": {
      if(!valid(["amount"])) return;
      const a=num("amount"), unit=$("#unit").value;
      const map={"cm-m":[.01,"m"],"m-cm":[100,"cm"],"m-km":[.001,"km"],"km-m":[1000,"m"],"g-kg":[.001,"kg"],"kg-g":[1000,"g"],"inch-cm":[2.54,"cm"],"pyeong-m2":[3.305785,"㎡"],"m2-pyeong":[1/3.305785,"평"]};
      show(`${nice(a*map[unit][0])} ${map[unit][1]}`);
      break;
    }
    case "age": {
      const value=$("#birth").value;
      if(!value){show("생년월일을 선택해 주세요.");return;}
      const b=new Date(value+"T00:00:00"), today=new Date();
      let age=today.getFullYear()-b.getFullYear();
      if(today.getMonth()<b.getMonth()||(today.getMonth()===b.getMonth()&&today.getDate()<b.getDate())) age--;
      if(age<0){show("미래 날짜는 입력할 수 없어요.");return;}
      show(`${age}세`, "오늘 날짜 기준 만 나이입니다.");
      break;
    }
    case "salary": {
      if(!valid(["amount"])) return;
      const a=num("amount"), mode=$("#mode").value;
      if(a<0){show("0 이상의 금액을 입력해 주세요.");return;}
      if(mode==="monthly") show(`연봉 ${won(a*12)}`,`월 급여 ${won(a)} 기준 · 세전 단순 환산`);
      else show(`월급 ${won(a/12)}`,`연봉 ${won(a)} 기준 · 세전 단순 환산`);
      break;
    }
  }
}
grid.addEventListener("click", e => {
  const card=e.target.closest("button[data-tool]");
  if(card) openTool(card.dataset.tool);
});
$("#closeDialog").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
$("#searchInput").addEventListener("input",e=>{
  const q=e.target.value.trim().toLowerCase();
  let visible=0;
  grid.querySelectorAll(".tool-card").forEach(card=>{
    const match=(card.dataset.name+" "+card.innerText).toLowerCase().includes(q);
    card.hidden=!match;if(match)visible++;
  });
  $("#resultCount").textContent=`${visible}개 도구`;
  $("#noResults").hidden=visible!==0;
});
