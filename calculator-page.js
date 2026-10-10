const tool = document.body.dataset.tool;
const specs = {
percent:{title:"퍼센트 계산기",fields:[["base","기준 숫자","number","100"],["rate","퍼센트 (%)","number","15"]],note:"입력한 기준 숫자의 해당 비율을 계산합니다."},
discount:{title:"할인 계산기",fields:[["price","원래 가격 (원)","number","50000"],["rate","할인율 (%)","number","20"]],note:"할인 금액과 할인 후 가격을 계산합니다."},
vat:{title:"부가세 계산기",fields:[["amount","금액 (원)","number","110000"]],note:"일반적인 10% 부가세율을 가정한 참고 계산입니다."},
loan:{title:"대출 상환 계산기",fields:[["principal","대출 원금 (원)","number","10000000"],["rate","연 이자율 (%)","number","5"],["months","상환 기간 (개월)","number","36"]],note:"원리금균등상환을 가정합니다. 실제 금융기관의 수수료·상환 조건은 반영되지 않습니다."},
savings:{title:"저축 계산기",fields:[["monthly","매월 저축액 (원)","number","300000"],["months","저축 기간 (개월)","number","12"],["rate","연 이자율 (%)","number","3"]],note:"매월 말에 저축하고 월복리로 계산한 단순 추정치이며 세금은 제외합니다."},
convert:{title:"단위 변환기",fields:[["amount","변환할 값","number","100"]],note:"평과 제곱미터는 1평 = 약 3.305785㎡ 기준입니다."},
age:{title:"만 나이 계산기",fields:[["birth","생년월일","date",""]],note:"오늘 날짜 기준으로 만 나이를 계산합니다."},
salary:{title:"급여 환산 계산기",fields:[["amount","급여 금액 (원)","number","2500000"]],note:"세금과 4대 보험을 공제하기 전의 단순 환산이며 실수령액이 아닙니다."},
smartstore:{title:"스마트스토어 수수료 계산기",fields:[["amount","판매금액 (원)","number","50000"],["rate","예상 수수료율 (%)","number","5.5"]],note:"입력한 판매금액과 예상 수수료율을 기준으로 수수료와 수수료 차감 후 금액을 계산합니다. 실제 적용 수수료율은 판매 조건에 따라 확인해 주세요."}
};
const spec=specs[tool];
document.title=spec.title+" | 월화 계산기";
document.querySelector("#title").textContent=spec.title;
document.querySelector("#note").textContent=spec.note;
const form=document.querySelector("#form");
form.innerHTML=spec.fields.map(([id,label,type,value])=>`<label>${label}<input id="${id}" type="${type}" value="${value}" required></label>`).join("");
if(tool==="vat")form.insertAdjacentHTML("beforeend",`<label>입력 금액 기준<select id="mode"><option value="included">부가세 포함 금액</option><option value="excluded">부가세 별도 공급가액</option></select></label>`);
if(tool==="convert")form.insertAdjacentHTML("beforeend",`<label>변환 종류<select id="unit"><option value="cm-m">센티미터 → 미터</option><option value="m-cm">미터 → 센티미터</option><option value="m-km">미터 → 킬로미터</option><option value="km-m">킬로미터 → 미터</option><option value="g-kg">그램 → 킬로그램</option><option value="kg-g">킬로그램 → 그램</option><option value="inch-cm">인치 → 센티미터</option><option value="pyeong-m2">평 → 제곱미터</option><option value="m2-pyeong">제곱미터 → 평</option></select></label>`);
if(tool==="salary")form.insertAdjacentHTML("beforeend",`<label>입력 기준<select id="mode"><option value="monthly">월급 → 연봉 환산</option><option value="annual">연봉 → 월급 환산</option></select></label>`);
function n(id){return Number(document.querySelector("#"+id).value)}
function won(v){return Math.round(v).toLocaleString("ko-KR")+"원"}
function nice(v){return Number(v.toFixed(6)).toLocaleString("ko-KR",{maximumFractionDigits:6})}
function show(v,n=""){document.querySelector("#result").textContent=v;document.querySelector("#resultNote").textContent=n}
form.addEventListener("submit",e=>{e.preventDefault();
try{
switch(tool){
case"percent":show(n("base")*n("rate")/100+"",`${nice(n("base"))}의 ${nice(n("rate"))}%`);break;
case"discount":{let p=n("price"),r=n("rate");if(p<0||r<0||r>100)return show("입력값을 확인해 주세요.","가격은 0 이상, 할인율은 0~100%로 입력하세요.");show(won(p*(1-r/100)),`할인 금액 ${won(p*r/100)} · 할인 전 ${won(p)}`);break}
case"vat":{let a=n("amount");if(a<0)return show("0 이상의 금액을 입력해 주세요.");if(document.querySelector("#mode").value==="included")show("공급가액 "+won(a/1.1),`부가세 ${won(a-a/1.1)} · 합계 ${won(a)}`);else show("합계 "+won(a*1.1),`공급가액 ${won(a)} · 부가세 ${won(a*.1)}`);break}
case"loan":{let p=n("principal"),annual=n("rate"),m=Math.floor(n("months"));if(p<0||annual<0||m<1||m>600)return show("입력값을 확인해 주세요.","원금과 이율은 0 이상, 기간은 1~600개월로 입력하세요.");let r=annual/1200,pay=r===0?p/m:p*r/(1-Math.pow(1+r,-m));show(won(pay),`총 납입액 약 ${won(pay*m)} · 총 이자 약 ${won(pay*m-p)}`);break}
case"savings":{let m=n("monthly"),months=Math.floor(n("months")),r=n("rate")/1200;if(m<0||months<1||months>1200||r<0)return show("입력값을 확인해 주세요.");let total=m*months,f=r===0?total:m*(Math.pow(1+r,months)-1)/r;show(won(f),`납입 원금 ${won(total)} · 예상 이자 ${won(f-total)} (세금 제외)`);break}
case"convert":{let a=n("amount"),map={"cm-m":[.01,"m"],"m-cm":[100,"cm"],"m-km":[.001,"km"],"km-m":[1000,"m"],"g-kg":[.001,"kg"],"kg-g":[1000,"g"],"inch-cm":[2.54,"cm"],"pyeong-m2":[3.305785,"㎡"],"m2-pyeong":[1/3.305785,"평"]},x=map[document.querySelector("#unit").value];show(nice(a*x[0])+" "+x[1]);break}
case"age":{let s=document.querySelector("#birth").value;if(!s)return show("생년월일을 선택해 주세요.");let b=new Date(s+"T00:00:00"),d=new Date(),a=d.getFullYear()-b.getFullYear();if(d.getMonth()<b.getMonth()||(d.getMonth()===b.getMonth()&&d.getDate()<b.getDate()))a--;if(a<0)return show("미래 날짜는 입력할 수 없어요.");show(a+"세","오늘 날짜 기준 만 나이입니다.");break}
case"salary":{let a=n("amount");if(a<0)return show("0 이상의 금액을 입력해 주세요.");if(document.querySelector("#mode").value==="monthly")show("연봉 "+won(a*12),`월 급여 ${won(a)} 기준 · 세전 단순 환산`);else show("월급 "+won(a/12),`연봉 ${won(a)} 기준 · 세전 단순 환산`);break}
case"smartstore":{let a=n("amount"),r=n("rate");if(a<0||r<0||r>100)return show("입력값을 확인해 주세요.","판매금액은 0원 이상, 수수료율은 0~100%로 입력해 주세요.");show(won(a*(1-r/100)),`예상 수수료 ${won(a*r/100)} · 판매금액 ${won(a)} · 적용 수수료율 ${nice(r)}%`);break}
}
}catch(err){show("입력값을 확인해 주세요.","숫자를 올바르게 입력해 주세요.")}});
