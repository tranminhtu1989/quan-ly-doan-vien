import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, where } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import './firebase-config.js';
import { SEED_STUDENTS } from './seed-students.js';

const ADDRESSES=['Xã Hòa Phú','Phường Buôn Ma Thuột','Xã Ea Na','Xã Ea Nuôl','Xã Tân Lập','Xã Tân An','Phường Thành Nhất','Khác'];
const POSITIONS=['','Bí thư Chi đoàn','Phó Bí thư Chi đoàn','Ủy viên BCH Chi đoàn'];
let db=null;
let mode='local';
let state={years:['2026-2027'],year:'2026-2027',students:[],history:[]};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

try{
  const c=window.FIREBASE_CONFIG||{};
  if(c.apiKey&&c.projectId){ db=getFirestore(initializeApp(c)); mode='firebase'; }
}catch(e){ console.warn('Firebase chưa cấu hình, chạy Local Demo.',e); }

const key=()=>`doanvien_${state.year}`;
async function load(){
  if(mode==='firebase'){
    const snap=await getDocs(collection(db,'unionStudents'));
    state.students=snap.docs.map(d=>({id:d.id,...d.data()}));
    const hs=await getDocs(collection(db,'unionHistory')); state.history=hs.docs.map(d=>({id:d.id,...d.data()}));
    const ys=await getDocs(collection(db,'unionYears')); state.years=ys.docs.map(d=>d.id).sort();
    if(!state.years.length){state.years=['2026-2027']; await setDoc(doc(db,'unionYears','2026-2027'),{createdAt:Date.now()});}
  }else{
    const saved=localStorage.getItem(key());
    if(saved){ state.students=JSON.parse(saved); }
    else if(state.year==='2026-2027' && SEED_STUDENTS.length){ state.students=SEED_STUDENTS.map(s=>({...s})); localStorage.setItem(key(),JSON.stringify(state.students)); }
    else state.students=[];
    const years=JSON.parse(localStorage.getItem('doan_years')||'null'); if(years) state.years=years;
    if(!years && state.year==='2026-2027'){ localStorage.setItem('doan_years',JSON.stringify(state.years)); }
    state.history=JSON.parse(localStorage.getItem('doan_history')||'[]');
  }
  if(!state.years.includes(state.year)) state.year=state.years[0];
  renderAll();
}
async function saveStudent(s){
  if(mode==='firebase') await setDoc(doc(db,'unionStudents',s.id),s);
  else{const arr=state.students.filter(x=>x.id!==s.id);arr.push(s);state.students=arr;localStorage.setItem(key(),JSON.stringify(arr));}
}
async function removeStudent(id){
  if(mode==='firebase') await deleteDoc(doc(db,'unionStudents',id));
  state.students=state.students.filter(s=>s.id!==id); if(mode==='local') localStorage.setItem(key(),JSON.stringify(state.students));
}
async function saveHistory(h){
  if(mode==='firebase') await setDoc(doc(db,'unionHistory',h.id),h);
  state.history.unshift(h); if(mode==='local') localStorage.setItem('doan_history',JSON.stringify(state.history));
}
async function saveYear(y){
  if(mode==='firebase') await setDoc(doc(db,'unionYears',y),{createdAt:Date.now()});
  if(!state.years.includes(y)) state.years.push(y); localStorage.setItem('doan_years',JSON.stringify(state.years));
}
function uid(){return crypto.randomUUID?crypto.randomUUID():`id_${Date.now()}_${Math.random().toString(36).slice(2)}`}
function classes(){return [...new Set(state.students.map(s=>s.className).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi',{numeric:true}));}
function formatDate(v){if(!v)return '';const [y,m,d]=v.split('-');return d&&m&&y?`${d}/${m}/${y}`:v}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function renderSelects(){
  const cs=classes();
  const opts='<option value="">Tất cả lớp</option>'+cs.map(c=>`<option>${esc(c)}</option>`).join('');
  ['searchClass'].forEach(id=>$(('#'+id)).innerHTML=opts);
  ['classSelect','reportClass'].forEach(id=>{const el=$('#'+id);const current=el.value;el.innerHTML=cs.map(c=>`<option>${esc(c)}</option>`).join('');if(current&&cs.includes(current))el.value=current;});
  $('#fClass').innerHTML=cs.map(c=>`<option>${esc(c)}</option>`).join('');
  $('#moveClass').innerHTML=cs.map(c=>`<option>${esc(c)}</option>`).join('');
  const ao='<option value="">Tất cả địa chỉ</option>'+ADDRESSES.map(a=>`<option>${esc(a)}</option>`).join('');
  $('#searchAddress').innerHTML=ao;$('#reportAddress').innerHTML=ADDRESSES.map(a=>`<option>${esc(a)}</option>`).join('');$('#fAddress').innerHTML='<option value="">Chưa cập nhật</option>'+ADDRESSES.map(a=>`<option>${esc(a)}</option>`).join('');
}
function renderYears(){
  $('#yearSelect').innerHTML=state.years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('');$('#yearSelect').value=state.year;
}
function currentStudents(){return state.students.filter(s=>s.year===state.year);}
function renderDashboard(){
  const arr=currentStudents(), members=arr.filter(s=>s.status==='member');
  $('#totalStudents').textContent=arr.length;$('#totalMembers').textContent=members.length;$('#totalYouth').textContent=arr.filter(s=>s.status!=='member').length;$('#totalMale').textContent=arr.filter(s=>s.gender==='Nam').length;$('#totalFemale').textContent=arr.filter(s=>s.gender==='Nữ').length;
  const byClass={};arr.forEach(s=>{byClass[s.className]=(byClass[s.className]||0)+(s.status==='member'?1:0)}); const max=Math.max(1,...Object.values(byClass));
  $('#classStats').innerHTML=Object.keys(byClass).sort((a,b)=>a.localeCompare(b,'vi',{numeric:true})).map(c=>`<div class="stat-row"><div>${esc(c)}<div class="bar"><i style="width:${byClass[c]/max*100}%"></i></div></div><b>${byClass[c]}</b></div>`).join('')||'<div class="empty">Chưa có dữ liệu</div>';
  const byAddress={};members.forEach(s=>{const a=s.address||'Chưa cập nhật';byAddress[a]=(byAddress[a]||0)+1});const maxA=Math.max(1,...Object.values(byAddress));
  $('#addressStats').innerHTML=Object.keys(byAddress).sort((a,b)=>byAddress[b]-byAddress[a]).map(a=>`<div class="stat-row"><div>${esc(a)}<div class="bar"><i style="width:${byAddress[a]/maxA*100}%"></i></div></div><b>${byAddress[a]}</b></div>`).join('')||'<div class="empty">Chưa có dữ liệu</div>';
}
function renderStudents(){
  const cls=$('#classSelect').value || classes()[0] || ''; if(cls) $('#classSelect').value=cls;
  const arr=currentStudents().filter(s=>s.className===cls).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  $('#classSummary').textContent=`Năm học ${state.year} · ${cls||'Chưa chọn lớp'} · ${arr.length} học sinh · ${arr.filter(s=>s.status==='member').length} đoàn viên`;
  $('#studentTable').innerHTML=arr.map((s,i)=>`<tr><td>${i+1}</td><td><b>${esc(s.name)}</b></td><td>${formatDate(s.dob)}</td><td>${esc(s.gender)}</td><td><span class="badge ${s.status==='member'?'member':'youth'}">${s.status==='member'?'Đoàn viên':'Thanh niên'}</span></td><td>${formatDate(s.admissionDate)}</td><td>${esc(s.position||'Không giữ chức vụ')}</td><td>${esc(s.address||'')}</td><td><div class="action-group"><button class="small" data-edit="${s.id}">Sửa</button><button class="small" data-move="${s.id}">Chuyển</button><button class="small danger" data-remove="${s.id}">Xóa khỏi lớp</button></div></td></tr>`).join('')||'<tr><td colspan="9" class="empty">Lớp chưa có học sinh. Có thể bấm “Thêm học sinh” để bổ sung.</td></tr>';
}
function renderSearch(){
  const q=$('#searchText').value.trim().toLowerCase(), cls=$('#searchClass').value, gender=$('#searchGender').value,status=$('#searchStatus').value,address=$('#searchAddress').value,pos=$('#searchPosition').value;
  let arr=currentStudents().filter(s=>(!q||s.name.toLowerCase().includes(q))&&(!cls||s.className===cls)&&(!gender||s.gender===gender)&&(!status||s.status===status)&&(!address||(s.address||'')===address)&&(!pos||(s.position||'')===pos));
  $('#searchTable').innerHTML=arr.sort((a,b)=>a.name.localeCompare(b.name,'vi')).map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td>${esc(s.className)}</td><td>${formatDate(s.dob)}</td><td>${esc(s.gender)}</td><td><span class="badge ${s.status==='member'?'member':'youth'}">${s.status==='member'?'Đoàn viên':'Thanh niên'}</span></td><td>${formatDate(s.admissionDate)}</td><td>${esc(s.address||'')}</td><td>${esc(s.position||'Không giữ chức vụ')}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">Không tìm thấy dữ liệu.</td></tr>';
}
function renderHistory(){
  const hs=state.history.filter(h=>h.year===state.year||h.toYear===state.year).slice(0,100);
  $('#historyTable').innerHTML=hs.map(h=>`<div class="history-item"><b>${esc(h.name)}</b> · ${esc(h.fromClass||'')} → ${esc(h.toClass||'')} · ${esc(h.reason||'')}</div>`).join('')||'<div class="empty">Chưa có lịch sử.</div>';
}
function renderAll(){renderYears();renderSelects();renderDashboard();renderStudents();renderSearch();renderHistory();}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function openModal(id){$('#'+id).classList.remove('hidden')};function closeModals(){$$('.modal').forEach(m=>m.classList.add('hidden'))}
function openStudent(s=null){
  $('#studentModal').classList.remove('hidden');$('#modalTitle').textContent=s?'Sửa thông tin học sinh':'Thêm học sinh';$('#studentId').value=s?.id||'';$('#fName').value=s?.name||'';$('#fDob').value=s?.dob||'';$('#fGender').value=s?.gender||'';$('#fStatus').value=s?.status||'youth';$('#fAdmission').value=s?.admissionDate||'';$('#fAddress').value=s?.address||'';$('#fPhone').value=s?.phone||'';$('#fPosition').value=s?.position||'';$('#fClass').value=s?.className||$('#classSelect').value||classes()[0]||'';
}
function download(rows,filename){const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DanhSach');XLSX.writeFile(wb,filename)}
function exportRows(arr){return arr.map((s,i)=>({STT:i+1,'Họ và tên':s.name,'Ngày sinh':formatDate(s.dob),'Giới tính':s.gender,'Lớp':s.className,'Trạng thái':s.status==='member'?'Đoàn viên':'Thanh niên','Ngày kết nạp':formatDate(s.admissionDate),'Địa chỉ thường trú':s.address||'','Số điện thoại':s.phone||'','Chức vụ Đoàn':s.position||'Không giữ chức vụ','Năm học':s.year}))}

$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active');});
$('#yearSelect').onchange=async e=>{state.year=e.target.value;await load()};
$('#classSelect').onchange=renderStudents;
['searchText','searchClass','searchGender','searchStatus','searchAddress','searchPosition'].forEach(id=>$('#'+id).addEventListener('input',renderSearch));
$('#addStudentBtn').onclick=()=>openStudent();$$('[data-close]').forEach(b=>b.onclick=closeModals);
$('#studentForm').onsubmit=async e=>{e.preventDefault();const id=$('#studentId').value||uid();const s={id,name:$('#fName').value.trim(),dob:$('#fDob').value,gender:$('#fGender').value,className:$('#fClass').value,status:$('#fStatus').value,admissionDate:$('#fStatus').value==='member'?$('#fAdmission').value:'',address:$('#fAddress').value,phone:$('#fPhone').value.trim(),position:$('#fPosition').value,year:state.year,updatedAt:Date.now()};await saveStudent(s);closeModals();toast('Đã lưu thông tin');renderAll()};
$('#studentTable').onclick=async e=>{const edit=e.target.closest('[data-edit]'),remove=e.target.closest('[data-remove]'),move=e.target.closest('[data-move]');if(edit){openStudent(state.students.find(s=>s.id===edit.dataset.edit));return}if(remove){const s=state.students.find(s=>s.id===remove.dataset.remove);if(confirm(`Xóa ${s.name} khỏi danh sách lớp? Dữ liệu lịch sử năm học hiện tại sẽ không còn hiển thị.`)){await removeStudent(s.id);toast('Đã xóa khỏi lớp');renderAll()}}if(move){const s=state.students.find(s=>s.id===move.dataset.move);$('#moveStudentId').value=s.id;$('#moveClass').value=s.className;openModal('moveModal')}};
$('#confirmMove').onclick=async()=>{const s=state.students.find(x=>x.id===$('#moveStudentId').value),to=$('#moveClass').value,reason=$('#moveReason').value;if(!s||!to||to===s.className){closeModals();return}const old=s.className;s.className=to;s.updatedAt=Date.now();await saveStudent(s);await saveHistory({id:uid(),name:s.name,year:state.year,fromClass:old,toClass:to,reason,createdAt:Date.now()});closeModals();toast(`Đã chuyển ${s.name} sang ${to}`);renderAll()};
$('#importBtn').onclick=()=>$('#excelInput').click();
$('#excelInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;const data=await file.arrayBuffer();const wb=XLSX.read(data,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:''});let n=0;for(const r of rows){const name=r['Họ và tên']||r['Ho va ten']||r['Họ tên']||r['HoTen'];if(!name)continue;const cls=r['Lớp']||r['Lop']||$('#classSelect').value||'';const dob=excelDate(r['Ngày sinh']||r['Ngay sinh']||'');const gender=r['Giới tính']||r['Gioi tinh']||'';const existing=state.students.find(s=>s.year===state.year&&s.name.toLowerCase()===String(name).toLowerCase()&&s.className===cls);const s=existing||{id:uid(),year:state.year};Object.assign(s,{name:String(name).trim(),dob,gender:String(gender),className:cls,status:r['Trạng thái']==='Đoàn viên'?'member':'youth',admissionDate:excelDate(r['Ngày kết nạp']||''),address:r['Địa chỉ thường trú']||'',phone:String(r['Số điện thoại']||''),position:r['Chức vụ Đoàn']||''});await saveStudent(s);n++}e.target.value='';toast(`Đã nhập ${n} học sinh`);renderAll()};
function excelDate(v){if(!v)return '';if(typeof v==='number'){const d=XLSX.SSF.parse_date_code(v);return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`}const m=String(v).match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:String(v)}
$('#exportMembers').onclick=()=>download(exportRows(currentStudents().filter(s=>s.status==='member')),`DoanVien_${state.year}.xlsx`);
$('#exportAll').onclick=()=>download(exportRows(currentStudents()),`HocSinh_${state.year}.xlsx`);
$('#exportClass').onclick=()=>{const c=$('#reportClass').value;download(exportRows(currentStudents().filter(s=>s.className===c)),`DoanVien_${c}_${state.year}.xlsx`)};
$('#exportAddress').onclick=()=>{const a=$('#reportAddress').value;download(exportRows(currentStudents().filter(s=>s.status==='member'&&s.address===a)),`DoanVien_${a}_${state.year}.xlsx`)};
$('#createYearBtn').onclick=async()=>{const y=$('#newYear').value.trim();if(!/^\d{4}-\d{4}$/.test(y)){alert('Nhập năm học theo dạng 2027-2028');return}if(state.years.includes(y)){alert('Năm học đã tồn tại');return}await saveYear(y);state.year=y;await load();toast('Đã tạo năm học mới')};
$('#promoteBtn').onclick=async()=>{const newYear=$('#newYear').value.trim();if(!/^\d{4}-\d{4}$/.test(newYear)){alert('Nhập năm học mới ở ô trên, ví dụ 2027-2028');return}if(state.years.includes(newYear)){alert('Năm học mới đã tồn tại');return}if(!confirm(`Tạo ${newYear} và tự động lên lớp từ ${state.year}?`))return;const old=state.year;await saveYear(newYear);const arr=currentStudents();for(const s of arr){const g=String(s.className).match(/^(10|11|12)(.*)$/i);if(!g||g[1]==='12')continue;const ns={...s,id:uid(),year:newYear,className:`${Number(g[1])+1}${g[2]}`,createdFrom:s.id};await saveStudent(ns);await saveHistory({id:uid(),name:s.name,year:old,toYear:newYear,fromClass:s.className,toClass:ns.className,reason:'Lên lớp tự động',createdAt:Date.now()})}state.year=newYear;await load();toast(`Đã tạo ${newYear} và lên lớp tự động`)};

load().catch(err=>{console.error(err);toast('Có lỗi khi tải dữ liệu. Nếu dùng Firebase, hãy kiểm tra cấu hình.');});
