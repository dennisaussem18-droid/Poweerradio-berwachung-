import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getStorage,ref as storageRef,uploadBytes,getDownloadURL} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,collection,onSnapshot,addDoc,updateDoc,deleteDoc,doc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config={apiKey:'AIzaSyBE6tRuluvkrClC3GfR1rV9HbZCYshY5RU',authDomain:'power-radio-ccac6.firebaseapp.com',projectId:'power-radio-ccac6',appId:'1:152541059221:web:eaf366af3ba47a20ac639c',storageBucket:'power-radio-ccac6.firebasestorage.app'};
const app=getApps().find(x=>x.name==='power-radio-admin')||initializeApp(config,'power-radio-admin');
const auth=getAuth(app),db=getFirestore(app),storage=getStorage(app),owner='CB6ieDKUIIPq0gLKPyUsKej9lw52';
const el=id=>document.getElementById(id);let unsubscribe=()=>{};
const safeUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:null}catch{return null}};
const feedback=msg=>el('prTvFeedback').textContent=msg;
onAuthStateChanged(auth,user=>{unsubscribe();el('prTvAdmin').hidden=!user||user.uid!==owner;el('prTvItems').replaceChildren();if(!user||user.uid!==owner)return;unsubscribe=onSnapshot(collection(db,'tvAds'),snapshot=>{const items=el('prTvItems');items.replaceChildren();if(snapshot.empty){items.textContent='Noch keine Werbung eingetragen.';return}snapshot.docs.sort((a,b)=>(a.data().order||0)-(b.data().order||0)).forEach(entry=>{const data=entry.data(),li=document.createElement('li');li.style.padding='12px 0';const name=document.createElement('strong');name.textContent=(data.title||'Werbung')+' · '+(data.active?'Aktiv':'Pausiert');const desc=document.createElement('div');desc.textContent=(data.category||'')+' · '+(data.seconds||10)+' Sekunden'+(data.endDate?' · bis '+data.endDate:'');const toggle=document.createElement('button');toggle.type='button';toggle.textContent=data.active?'Pausieren':'Aktivieren';toggle.onclick=async()=>{toggle.disabled=true;try{await updateDoc(doc(db,'tvAds',entry.id),{active:!data.active})}catch(e){feedback('Änderung fehlgeschlagen: '+e.code)}finally{toggle.disabled=false}};const del=document.createElement('button');del.type='button';del.textContent='Löschen';del.style.marginLeft='8px';del.onclick=async()=>{if(!confirm('Werbung wirklich löschen?'))return;del.disabled=true;try{await deleteDoc(doc(db,'tvAds',entry.id))}catch(e){feedback('Löschen fehlgeschlagen: '+e.code);del.disabled=false}};li.append(name,desc,toggle,del);items.append(li)})},e=>feedback('Firestore-Regeln für TV-Werbung fehlen noch: '+e.code))});
el('prTvForm').addEventListener('submit',async e=>{
 e.preventDefault();if(auth.currentUser?.uid!==owner)return;
 const f=e.currentTarget,btn=el('prTvSubmit'),title=el('prTvTitle').value.trim(),file=el('prTvFile').files[0],description=el('prTvDescription').value.trim(),category=el('prTvCategory').value,seconds=Number(el('prTvSeconds').value),startDate=el('prTvStart').value,endDate=el('prTvEnd').value;
 let imageUrl=safeUrl(el('prTvImage').value.trim());
 if(!title||(!file&&!imageUrl)||!Number.isInteger(seconds)||seconds<5||seconds>60||(endDate&&startDate&&endDate<startDate)){feedback('Bitte Titel, Bild und Anzeigedauer (5–60 Sekunden) prüfen.');return}
 if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)){feedback('Bitte JPG, PNG oder WebP mit höchstens 5 MB auswählen.');return}
 btn.disabled=true;
 try{
  if(file){
   feedback('Bild wird hochgeladen …');
   const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
   const path='tvAds/'+crypto.randomUUID()+'.'+ext;
   const target=storageRef(storage,path);
   await uploadBytes(target,file,{contentType:file.type});
   imageUrl=await getDownloadURL(target);
  }
  await addDoc(collection(db,'tvAds'),{title:title.slice(0,90),imageUrl,description:description.slice(0,200),category,seconds,startDate,endDate,active:true,createdAt:serverTimestamp()});
  f.reset();feedback('Werbung gespeichert und aktiviert.');
 }catch(err){feedback('Speichern fehlgeschlagen: '+(err.code||err.message)+'. Bitte Firebase Storage und Firestore-Regeln prüfen.')}finally{btn.disabled=false}
});
