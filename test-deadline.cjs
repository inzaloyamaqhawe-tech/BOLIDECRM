const fs=require('fs'),ts=require('typescript'),assert=require('assert');
const code=ts.transpileModule(fs.readFileSync('src/lib/proposal.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exportsObject={};new Function('exports',code)(exportsObject);
assert.equal(exportsObject.proposalDue('2026-10-07T08:00:00+02:00'),'2026-10-16');
assert.equal(exportsObject.proposalDue('2026-10-09T08:00:00+02:00'),'2026-10-20');
assert.equal(exportsObject.proposalDue('2026-10-10T08:00:00+02:00'),'2026-10-20');
assert.equal(exportsObject.proposalDue('2026-12-31T08:00:00+02:00'),'2027-01-12');
const deal={createdAt:'2026-10-07T06:00:00Z',stage:'lead'};
assert.match(exportsObject.proposalStatus(deal,new Date('2026-10-07T06:00:00Z')),/7 working days left/);
assert.match(exportsObject.proposalStatus(deal,new Date('2026-10-16T06:00:00Z')),/due today/);
assert.match(exportsObject.proposalStatus(deal,new Date('2026-10-19T06:00:00Z')),/Overdue by 1 working day/);
assert.match(exportsObject.proposalStatus({...deal,stage:'quote'}),/Proposal sent/);
console.log('PASS: weekday deadlines, weekend receipt, year boundary, days remaining, due today, overdue, proposal completion.');

assert.match(exportsObject.proposalStatus({...deal,leadTracker:{source:"tracker",sourceRows:[3]}}),/deadline unavailable/);

assert.equal(exportsObject.proposalDue('2026-09-23T08:00:00+02:00'),'2026-10-05');
assert.equal(exportsObject.proposalDue('2026-04-02T08:00:00+02:00'),'2026-04-15');
assert.equal(exportsObject.proposalDue('2026-08-07T08:00:00+02:00'),'2026-08-19');
assert.equal(exportsObject.isWorkingDay('2026-11-04'),false);
assert.equal(exportsObject.isWorkingDay('2027-12-27'),false);
assert.equal(exportsObject.localDay('2026-10-16T23:30:00Z'),'2026-10-17');
console.log('PASS: public holidays, Easter, observed Monday, proclaimed election holiday and Johannesburg date boundary.');
