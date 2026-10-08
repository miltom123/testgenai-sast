const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = process.env.TESTGENAI_VERIFY_URL || 'http://127.0.0.1:14000';
let token;
const checks = [];
async function request(route, body) {
  const response = await fetch(base + '/api/v1' + route, {
    method: body ? 'POST' : 'GET',
    headers: {'Content-Type':'application/json', ...(token ? {Authorization:'Bearer '+token} : {})},
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  if (!response.ok) throw new Error(route + ' devolvió HTTP ' + response.status);
  const value = await response.json();
  return value.data;
}
(async () => {
  const account = await request('/auth/register', {
    email:'ci-'+Date.now()+'@example.invalid',
    password:'Ci9'+crypto.randomBytes(24).toString('hex'),
    fullName:'Cuenta efímera de verificación',
  });
  token = account.token;
  assert.equal(account.user.role,'QA_TESTER');
  checks.push('Registro y rol de menor privilegio: PASS');
  const project = await request('/projects', {name:'Proyecto de verificación CI',description:'Datos sintéticos de prueba; no usuarios de producción.'});
  checks.push('Persistencia de proyecto: PASS');
  await request('/requirements', {
    projectId:project.id,
    title:'Registrar un requisito',
    description:'El usuario autenticado debe registrar un requisito en su proyecto.',
    acceptanceCriteria:'Cuando guarda un requisito válido, el sistema debe mostrarlo en el proyecto.',
  });
  checks.push('Persistencia de requisito: PASS');
  const metrics = await request('/metrics/project/'+project.id);
  assert.equal(metrics.summary.totalRequirements,1);
  assert.equal(metrics.summary.totalCases,0);
  checks.push('Métricas consultadas desde PostgreSQL: PASS');
  fs.mkdirSync('reports',{recursive:true});
  fs.writeFileSync('reports/functional-tests.json',JSON.stringify({scope:'Entorno efímero con datos sintéticos',checks,metrics},null,2));
  console.log(checks.join('\n'));
})().catch(error=>{console.error(error.message);process.exit(1);});
