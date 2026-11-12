import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
// Adaptador SQLite usado pelo repositório, com gravações atômicas em batch.
export class SQLite {
 constructor(file=':memory:'){this.raw=new DatabaseSync(file);this.raw.exec(readFileSync(new URL('../../../banco/esquema.sql',import.meta.url),'utf8'));}
 prepare(sql){
  const stmt=this.raw.prepare(sql);
  const bind=(...args)=>({
   first:async()=>stmt.get(...args)||null,
   all:async()=>({results:stmt.all(...args)}),
   run:async()=>stmt.run(...args),
   _run:()=>stmt.run(...args),
  });
  return {...bind(),bind};
 }
 async batch(statements){this.raw.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>s._run());this.raw.exec('COMMIT');return results;}catch(e){this.raw.exec('ROLLBACK');throw e;}}
 close(){this.raw.close();}
}
