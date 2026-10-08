const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const ts = require('../backend/node_modules/typescript');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/generated');
fs.mkdirSync(out, { recursive: true });
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const schema = fs.readFileSync(path.join(root, 'backend/prisma/schema.prisma'), 'utf8');
const models = [...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map(m => ({
  name: m[1], body: m[2], fields: m[2].split('\n').map(x => x.trim()).filter(x => x && !x.startsWith('//') && !x.startsWith('@@')).map(x => {
    const parts = x.split(/\s+/); return {name: parts[0], type: parts[1], constraints: parts.slice(2).join(' ')};
  }),
}));
const modelNames = new Set(models.map(x => x.name));
let dictionary = '# Diccionario de datos\n\nGenerado desde `backend/prisma/schema.prisma`. Los campos de relación de Prisma se distinguen de las columnas persistidas.\n';
let er = 'erDiagram\n';
const relations = new Set();
for (const model of models) {
  dictionary += `\n## ${model.name}\n\n| Campo | Tipo Prisma | Restricciones |\n|---|---|---|\n`;
  er += `  ${model.name} {\n`;
  for (const field of model.fields) {
    dictionary += `| ${field.name} | ${field.type} | ${field.constraints.replace(/\|/g, '\\|')} |\n`;
    const base = field.type.replace(/[?\[\]]/g, '');
    if (modelNames.has(base)) {
      if (field.constraints.includes('@relation')) relations.add(`  ${model.name} }o--${field.type.endsWith('?') ? 'o|' : '||'} ${base} : "${field.name}"`);
    } else er += `    ${base} ${field.name}\n`;
  }
  er += '  }\n';
}
er += [...relations].join('\n') + '\n';
fs.writeFileSync(path.join(out, 'DICCIONARIO_DATOS.md'), dictionary);
fs.writeFileSync(path.join(out, 'ENTIDAD_RELACION.mmd'), er);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
}
walk(path.join(root, 'backend/src'));
let api = '# Documentación técnica del código\n\nGenerada desde el árbol de sintaxis TypeScript. Incluye clases, interfaces, funciones, métodos y propiedades declaradas.\n';
let classes = 'classDiagram\n';
let classCount = 0;
for (const file of files.sort()) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const relative = path.relative(root, file).replaceAll('\\', '/');
  let rows = [];
  function visit(node) {
    if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      const name = node.name?.text || 'Anonymous';
      rows.push(`### ${name}\n\n| Miembro | Declaración |\n|---|---|`);
      const domain = relative.includes('/domain/entities/');
      if (ts.isClassDeclaration(node)) classCount++;
      if (domain) classes += `  class ${name} {\n`;
      for (const member of node.members) {
        const memberName = ts.isConstructorDeclaration(member) ? 'constructor' : member.name?.getText(source);
        if (!memberName) continue;
        const declaration = ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)
          ? `${memberName}(${member.parameters.map(p=>p.getText(source)).join(', ')}): ${member.type?.getText(source) || 'retorno inferido'}`
          : `${memberName}: ${member.type?.getText(source) || 'tipo inferido'}`;
        rows.push(`| ${memberName} | \`${declaration.replaceAll('|','\\|').replaceAll('`','\u0027')}\` |`);
        if (domain) classes += `    ${memberName.replace(/[^\w]/g, '_')}${ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member) ? '()' : ''}\n`;
      }
      if (domain) classes += '  }\n';
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      rows.push(`### ${node.name.text}\n\n\`${node.getText(source).split('{')[0].replace(/\s+/g,' ').trim().replaceAll('`','\u0027')}\`\n`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (rows.length) api += `\n## ${relative}\n\n${rows.join('\n')}\n`;
}
const components = 'flowchart LR\n  U[Usuario] --> SPA[Frontend HTML CSS y JavaScript]\n  SPA --> API[Express API v1]\n  API --> UC[Casos de uso]\n  UC --> DOMAIN[Dominio y puertos]\n  UC --> ENGINE[Motor determinista ISTQB]\n  UC --> AI[Adaptadores Gemini y OpenAI]\n  DOMAIN --> PRISMA[Repositorios Prisma]\n  PRISMA --> DB[(PostgreSQL)]\n';
classes += '  ProjectEntity "1" --> "0..*" RequirementEntity : referencia projectId\n  RequirementEntity "1" --> "0..*" TestCaseEntity : referencia requirementId\n  ProjectEntity "1" --> "0..*" TestRunEntity : referencia projectId\n';
const deployment = 'flowchart LR\n  U[Navegador] --> APP[Contenedor Node 24 Express y SPA]\n  APP --> DB[(PostgreSQL 16)]\n  APP --> EXT[APIs de IA opcionales]\n  GH[GitHub] --> CI[GitHub Actions: pruebas y análisis]\n  CI --> IMG[Build Docker]\n';
fs.writeFileSync(path.join(out, 'TECNICA.md'), api);
fs.writeFileSync(path.join(out, 'CLASES.mmd'), classes);
fs.writeFileSync(path.join(out, 'COMPONENTES.mmd'), components);
fs.writeFileSync(path.join(out, 'DESPLIEGUE.mmd'), deployment);
let revision = cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Documentación técnica TestGenAI</title><style>body{max-width:1100px;margin:40px auto;padding:0 24px;font:16px/1.6 system-ui;color:#182235;background:#f8fafc}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:white;border:1px solid #ccd4df;padding:24px}a{color:#1855a3}nav a{margin-right:20px}</style><h1>Documentación técnica TestGenAI</h1><p>Fuente: revisión ${revision}. ${files.length} archivos TypeScript, ${classCount} clases y ${models.length} modelos Prisma.</p><nav><a href="#datos">Diccionario</a><a href="#tecnica">Clases y métodos</a><a href="ENTIDAD_RELACION.mmd">ER</a><a href="CLASES.mmd">Clases</a><a href="COMPONENTES.mmd">Componentes</a><a href="DESPLIEGUE.mmd">Despliegue</a></nav><h2 id="datos">Diccionario de datos</h2><pre>${escape(dictionary)}</pre><h2 id="tecnica">Código técnico</h2><pre>${escape(api)}</pre></html>`;
fs.writeFileSync(path.join(out, 'index.html'), html);
const readmePath = path.join(root, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
const block = `<!-- GENERATED_DOCS_START -->\n## Documentación generada automáticamente\n\nEjecutar \`node scripts/generate-docs.cjs\` desde la raíz. El workflow de documentación regenera los archivos desde el código de la revisión analizada.\n\n- [Diccionario de datos](docs/generated/DICCIONARIO_DATOS.md)\n- [Documentación de clases, interfaces, métodos y propiedades](docs/generated/TECNICA.md)\n- [Entidad relación](docs/generated/ENTIDAD_RELACION.mmd)\n- [Clases de dominio](docs/generated/CLASES.mmd)\n- [Componentes](docs/generated/COMPONENTES.mmd)\n- [Despliegue Docker documentado](docs/generated/DESPLIEGUE.mmd)\n\n### Entidad relación\n\n\`\`\`mermaid\n${er}\`\`\`\n\n### Clases de dominio\n\n\`\`\`mermaid\n${classes}\`\`\`\n\n### Componentes\n\n\`\`\`mermaid\n${components}\`\`\`\n\n### Despliegue\n\n\`\`\`mermaid\n${deployment}\`\`\`\n<!-- GENERATED_DOCS_END -->`;
readme = readme.includes('<!-- GENERATED_DOCS_START -->') ? readme.replace(/<!-- GENERATED_DOCS_START -->[\s\S]*?<!-- GENERATED_DOCS_END -->/, block) : readme + '\n' + block + '\n';
fs.writeFileSync(readmePath, readme);
console.log(JSON.stringify({revision, files:files.length, classes:classCount, models:models.length}));
