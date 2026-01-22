import fs from 'fs';
const s = fs.readFileSync('src/frontend/admin-dashboard.jsx','utf8');
const lines = s.split(/\r?\n/);
let bal = 0; let inSingle=false, inDouble=false, inTemplate=false, inBlockComment=false;
for(let i=0;i<lines.length;i++){
  const line = lines[i];
  for(let j=0;j<line.length;j++){
    const ch = line[j];
    const next = line[j+1];
    // crude block comment skip
    if(!inSingle && !inDouble && !inTemplate && ch==='/' && next==='*'){ inBlockComment=true; j++; continue; }
    if(inBlockComment && ch==='*' && next==='/'){ inBlockComment=false; j++; continue; }
    if(inBlockComment) continue;
    if(ch==="'" && !inDouble && !inTemplate) { inSingle = !inSingle; continue; }
    if(ch==='"' && !inSingle && !inTemplate) { inDouble = !inDouble; continue; }
    if(ch==='`' && !inSingle && !inDouble) { inTemplate = !inTemplate; continue; }
    if(inSingle||inDouble||inTemplate) continue;
    if(ch==='<' ) bal++;
    if(ch==='>' ) bal--;
  }
  if((i+1) % 50 === 0 || i+1 > 4200) {
    if(bal !== 0) console.log('Line', i+1, 'balance', bal);
  }
  if(i === 4306) { console.log('At target line', i+1, 'balance', bal); break; }
}
console.log('Done');
