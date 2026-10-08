import app from '../src/main';
import { Server } from 'http';

const TEST_PORT = 4005;

async function runTests() {
  console.log('🧪 Iniciando verificación integral de endpoints de la API...\n');

  const server: Server = app.listen(TEST_PORT);
  const baseUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Healthcheck
    console.log('1️⃣ Probando GET /api/health ...');
    const resHealth = await fetch(`${baseUrl}/api/health`);
    const healthData = await resHealth.json();
    if (!resHealth.ok || healthData.status !== 'online') {
      throw new Error(`Healthcheck falló: ${JSON.stringify(healthData)}`);
    }
    console.log('   ✅ Healthcheck OK:', healthData.service);

    // 2. Auth Login
    console.log('\n2️⃣ Probando POST /api/auth/login ...');
    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@testgenai.com',
        password: 'Admin123*TestGenAI',
      }),
    });
    const loginData = await resLogin.json();
    if (!resLogin.ok || !loginData.data?.token) {
      throw new Error(`Login falló: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.data.token;
    console.log('   ✅ Login exitoso. Token JWT generado.');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Auth Me
    console.log('\n3️⃣ Probando GET /api/auth/me ...');
    const resMe = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
    const meData = await resMe.json();
    console.log(`   ✅ Usuario autenticado: ${meData.data.fullName} (${meData.data.role})`);

    // 4. List Projects
    console.log('\n4️⃣ Probando GET /api/projects ...');
    const resProjects = await fetch(`${baseUrl}/api/projects`, { headers: authHeaders });
    const projectsData = await resProjects.json();
    if (!projectsData.data || projectsData.data.length === 0) {
      throw new Error('No se encontraron proyectos');
    }
    const project = projectsData.data[0];
    console.log(`   ✅ Proyecto obtenido: "${project.name}" (ID: ${project.id})`);

    // 5. List Requirements
    console.log('\n5️⃣ Probando GET /api/requirements/project/:id ...');
    const resReqs = await fetch(`${baseUrl}/api/requirements/project/${project.id}`, {
      headers: authHeaders,
    });
    const reqsData = await resReqs.json();
    const req1 = reqsData.data.find((r: any) => r.code === 'REQ-001');
    if (!req1) throw new Error('Requisito REQ-001 no encontrado');
    console.log(`   ✅ Requisito encontrado: [${req1.code}] ${req1.title}`);

    // 6. Generate Test Cases with AI
    console.log('\n6️⃣ Probando POST /api/ai/generate (Motor de IA)...');
    const resAi = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        requirementId: req1.id,
        provider: 'mock',
        model: 'mock-istqb-v1',
      }),
    });
    const aiData = await resAi.json();
    if (!resAi.ok || !aiData.data?.testCases) {
      throw new Error(`Generación falló: ${JSON.stringify(aiData)}`);
    }
    console.log(
      `   ✅ Generados ${aiData.data.testCases.length} casos de prueba con éxito.`
    );
    console.log(
      `   📊 Tokens: ${aiData.data.audit.inputTokens} in / ${aiData.data.audit.outputTokens} out | Latencia: ${aiData.data.audit.responseTimeMs}ms`
    );

    const firstCase = aiData.data.testCases[0];
    console.log(`   📝 Caso muestra [${firstCase.code}]: "${firstCase.title}" (${firstCase.type})`);

    // 6b. Motor Heurístico Determinista SIN IA (0 tokens)
    console.log('\n6️⃣b Probando POST /api/heuristics/generate (Motor Heurístico Determinista SIN IA)...');
    const req2 = reqsData.data.find((r: any) => r.code === 'REQ-002');
    const resHeuristic = await fetch(`${baseUrl}/api/heuristics/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        requirementId: req2 ? req2.id : req1.id,
      }),
    });
    const heuristicData = await resHeuristic.json();
    if (!resHeuristic.ok || heuristicData.data.tokensConsumed !== 0) {
      throw new Error(`Generación heurística falló: ${JSON.stringify(heuristicData)}`);
    }
    console.log(`   ✅ Generados ${heuristicData.data.totalGenerated} casos por reglas deterministas (0 tokens, 100% offline).`);
    console.log(`   📋 Reglas identificadas: ${heuristicData.data.rulesMatched.length} patrones detectados.`);

    // 6b-2. Fórmula A: Parser Determinista BDD / Gherkin (Dado-Cuando-Entonces)
    console.log('\n6️⃣b-2 Probando FÓRMULA A: Parser BDD / Gherkin Formal (REQ-003)...');
    const req3 = reqsData.data.find((r: any) => r.code === 'REQ-003');
    const resGherkin = await fetch(`${baseUrl}/api/heuristics/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        requirementId: req3 ? req3.id : req1.id,
      }),
    });
    const gherkinData = await resGherkin.json();
    if (!resGherkin.ok || gherkinData.data.rulesMatched.every((r: any) => r.ruleType !== 'BDD_GHERKIN')) {
      throw new Error(`Parser BDD falló: ${JSON.stringify(gherkinData)}`);
    }
    console.log(`   ✅ Parser BDD identificó escenarios Dado-Cuando-Entonces y generó ${gherkinData.data.totalGenerated} casos.`);

    // 6c. Creación Manual de Caso por el QA (100% Humano)
    console.log('\n6️⃣c Probando POST /api/test-cases (Creación Manual de Casos sin IA)...');
    const resManual = await fetch(`${baseUrl}/api/test-cases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        requirementId: req1.id,
        type: 'negative',
        title: 'Bloqueo manual por auditoría de seguridad tras inyección SQL en login',
        preconditions: ['Servidor con WAF activo'],
        steps: [
          'Ingresar "\' OR 1=1 --" en el campo de usuario',
          'Ingresar contraseña cualquiera',
          'Hacer clic en Iniciar Sesión',
        ],
        testData: 'input="\' OR 1=1 --"',
        expectedResult: 'El WAF o backend intercepta el ataque, no consulta la BD y rechaza con 400 Bad Request.',
        priority: 'high',
        evidenceStatus: 'derived',
        status: 'APPROVED',
      }),
    });
    const manualData = await resManual.json();
    if (!resManual.ok || manualData.data.source !== 'MANUAL') {
      throw new Error(`Creación manual falló: ${JSON.stringify(manualData)}`);
    }
    console.log(`   ✅ Caso manual [${manualData.data.code}] creado exitosamente con source="MANUAL".`);

    // 6d. Clonación de Caso de Prueba para Creación de Variantes
    console.log('\n6️⃣d Probando POST /api/test-cases/:id/clone (Clonación de casos)...');
    const resClone = await fetch(`${baseUrl}/api/test-cases/${manualData.data.id}/clone`, {
      method: 'POST',
      headers: authHeaders,
    });
    const cloneData = await resClone.json();
    if (!resClone.ok || !cloneData.data.title.includes('[Copia]')) {
      throw new Error(`Clonación falló: ${JSON.stringify(cloneData)}`);
    }
    console.log(`   ✅ Caso clonado como [${cloneData.data.code}] para diseño manual de variantes.`);

    // 6e. Fórmula D: Resilient Cascade Fallback (Conmutación automática ante fallo de IA)
    console.log('\n6️⃣e Probando FÓRMULA D: Resilient Cascade Fallback (Simulando API IA no disponible)...');
    const resFallback = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        requirementId: req1.id,
        provider: 'gemini', // Sin API key en .env -> activa fallback automático
      }),
    });
    const fallbackData = await resFallback.json();
    if (!resFallback.ok || !fallbackData.data?.testCases) {
      throw new Error(`Cascade fallback falló: ${JSON.stringify(fallbackData)}`);
    }
    console.log(`   ✅ Resiliencia confirmada: La API conmutó de forma transparente a ${fallbackData.data.audit.model} (0 errores para el usuario).`);

    // 6f. Control de Concurrencia Optimista (Optimistic Locking)
    console.log('\n6️⃣f Probando Control de Concurrencia Optimista (Detección de 409 Conflict)...');
    const resConflict = await fetch(`${baseUrl}/api/requirements/${req1.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Título con conflicto simulado',
        expectedVersion: 999, // Versión obsoleta deliberada
      }),
    });
    const conflictData = await resConflict.json();
    if (resConflict.status !== 409) {
      throw new Error(`Control de concurrencia falló: se esperaba 409 pero se obtuvo ${resConflict.status}`);
    }
    console.log(`   ✅ Conflicto detectado con éxito (HTTP 409): "${conflictData.error.slice(0, 60)}..."`);

    // 7. Review Test Case (Approve)
    console.log('\n7️⃣ Probando PATCH /api/test-cases/:id/review (Aprobación humana)...');
    const resReview = await fetch(`${baseUrl}/api/test-cases/${firstCase.id}/review`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        decision: 'APPROVED',
        comments: 'Aprobado por el QA Lead. Cumple con todos los criterios de aceptación.',
      }),
    });
    const reviewData = await resReview.json();
    if (!resReview.ok || reviewData.data.testCase.status !== 'APPROVED') {
      throw new Error(`Revisión falló: ${JSON.stringify(reviewData)}`);
    }
    console.log(`   ✅ Caso ${firstCase.code} aprobado y registrado en test_case_reviews.`);

    // 8. Traceability Matrix
    console.log('\n8️⃣ Probando GET /api/traceability/:projectId ...');
    const resTrace = await fetch(`${baseUrl}/api/traceability/${project.id}`, {
      headers: authHeaders,
    });
    const traceData = await resTrace.json();
    console.log(
      `   ✅ Matriz calculada: ${traceData.data.totalRequirements} requisitos, Cobertura: ${traceData.data.coveragePercent}%`
    );

    // 9. Metrics Dashboard
    console.log('\n9️⃣ Probando GET /api/metrics/project/:projectId ...');
    const resMetrics = await fetch(`${baseUrl}/api/metrics/project/${project.id}`, {
      headers: authHeaders,
    });
    const metricsData = await resMetrics.json();
    console.log(`   ✅ Tasa de Aprobación ISTQB: ${metricsData.data.istqbRates.approvalRate}%`);
    console.log(`   ✅ Desglose de Origen: Manuales=${metricsData.data.sourceDistribution.manual.count} (${metricsData.data.sourceDistribution.manual.percent}%), Heurísticos=${metricsData.data.sourceDistribution.ruleBased.count} (${metricsData.data.sourceDistribution.ruleBased.percent}%), IA=${metricsData.data.sourceDistribution.aiGenerated.count} (${metricsData.data.sourceDistribution.aiGenerated.percent}%)`);
    console.log(`   ✅ Calidad de Evidencia: ${metricsData.data.evidenceQuality.derivedPercent}% Derivado`);
    console.log(`   ✅ Costo Total IA: USD $${metricsData.data.aiEconomics.totalCostUsd}`);

    // 10. Export in Markdown
    console.log('\n🔟 Probando GET /api/export/:projectId?format=markdown ...');
    const resExport = await fetch(
      `${baseUrl}/api/export/${project.id}?format=markdown&onlyApproved=false`,
      { headers: authHeaders }
    );
    const exportText = await resExport.text();
    if (!resExport.ok || !exportText.includes('# Especificación de Casos de Prueba')) {
      throw new Error('Exportación falló');
    }
    console.log('   ✅ Exportación Markdown generada correctamente (' + exportText.length + ' caracteres).');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA API PASARON SATISFACTORIAMENTE (10/10)!');
  } finally {
    server.close();
  }
}

runTests().catch((e) => {
  console.error('\n❌ ERROR EN PRUEBAS:', e);
  process.exit(1);
});
