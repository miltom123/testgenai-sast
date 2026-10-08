const fs = require('node:fs');
const url = process.env.SONAR_HOST_URL;
const token = process.env.SONAR_TOKEN;
if (!url || !token) throw new Error('Falta conexión SonarQube');
const headers = {Authorization: 'Basic ' + Buffer.from(token + ':').toString('base64')};
async function get(endpoint) {
  const response = await fetch(url + endpoint, {headers});
  if (!response.ok) throw new Error('SonarQube HTTP ' + response.status);
  return response.json();
}
async function pages(endpoint, field) {
  const items = [];
  for (let p = 1; ; p++) {
    const result = await get(endpoint + '&ps=500&p=' + p);
    items.push(...(result[field] || []));
    const total = result.total ?? result.paging?.total ?? items.length;
    if (items.length >= total) return {total, [field]: items};
    if (!(result[field] || []).length) throw new Error('Paginación incompleta de SonarQube');
  }
}
(async () => {
  fs.mkdirSync('reports', {recursive:true});
  const report = fs.readFileSync('.scannerwork/report-task.txt', 'utf8');
  const ceTaskId = report.match(/^ceTaskId=(.+)$/m)?.[1];
  if (!ceTaskId) throw new Error('No se encontró la tarea de análisis');
  let complete = false;
  for (let attempt=0; attempt<120; attempt++) {
    const {task} = await get('/api/ce/task?id=' + encodeURIComponent(ceTaskId));
    if (task.status === 'SUCCESS') {complete=true;break;}
    if (task.status === 'FAILED' || task.status === 'CANCELED') throw new Error('Análisis SonarQube ' + task.status);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  if (!complete) throw new Error('Tiempo agotado esperando SonarQube');
  const issues = await pages('/api/issues/search?componentKeys=testgenai-group11&types=BUG,VULNERABILITY', 'issues');
  const hotspots = await pages('/api/hotspots/search?projectKey=testgenai-group11', 'hotspots');
  const gate = await get('/api/qualitygates/project_status?projectKey=testgenai-group11');
  fs.writeFileSync('reports/sonar-issues.json', JSON.stringify(issues,null,2));
  fs.writeFileSync('reports/sonar-hotspots.json', JSON.stringify(hotspots,null,2));
  fs.writeFileSync('reports/sonar-qualitygate.json', JSON.stringify(gate,null,2));
  const summary = `## SonarQube\n\nBugs y vulnerabilidades reportadas: ${issues.total}\n\nHotspots pendientes de revisión: ${hotspots.total}\n\nQuality Gate: ${gate.projectStatus.status}\n\nLa ejecución de análisis no declara todos los hallazgos resueltos.\n`;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
})().catch(error => {console.error(error.message);process.exit(1);});
