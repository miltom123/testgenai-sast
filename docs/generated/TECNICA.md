# Documentación técnica del código

Generada desde el árbol de sintaxis TypeScript. Incluye clases, interfaces, funciones, métodos y propiedades declaradas.

## backend/src/application/use-cases/clone-test-case.use-case.ts

### CloneTestCaseInputDTO

| Miembro | Declaración |
|---|---|
| testCaseId | `testCaseId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| replaceFind | `replaceFind: string` |
| replaceWith | `replaceWith: string` |
### CloneTestCaseUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: CloneTestCaseInputDTO): retorno inferido` |

## backend/src/application/use-cases/create-manual-test-case.use-case.ts

### CreateManualTestCaseInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| type | `type: 'positive' \| 'negative' \| 'alternative' \| 'boundary' \| 'validation'` |
| title | `title: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: 'high' \| 'medium' \| 'low'` |
### CreateManualTestCaseUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: CreateManualTestCaseInputDTO): retorno inferido` |

## backend/src/application/use-cases/create-test-case-from-bug.use-case.ts

### CreateFromBugInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| defectTitle | `defectTitle: string` |
| stepsToReproduce | `stepsToReproduce: string[]` |
| actualBehavior | `actualBehavior: string` |
| expectedBehavior | `expectedBehavior: string` |
| severity | `severity: 'high' \| 'medium' \| 'low'` |
### CreateTestCaseFromBugUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: CreateFromBugInputDTO): retorno inferido` |

## backend/src/application/use-cases/derive-test-cases.use-case.ts

### DeriveTestCasesInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| depth | `depth: DerivationDepth` |
### DeriveTestCasesOutputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| requirementCode | `requirementCode: string` |
| depth | `depth: DerivationDepth` |
| derived | `derived: number` |
| inserted | `inserted: number` |
| omittedAsExisting | `omittedAsExisting: number` |
| techniques | `techniques: Record<string, number>` |
| cases | `cases: Array<Record<string, unknown>>` |
| duplicateWarnings | `duplicateWarnings: DuplicateCandidate[]` |
### DerivationHints

| Miembro | Declaración |
|---|---|
| variables | `variables: BvaVariableInput[]` |
| templateCategory | `templateCategory: string \| null` |
| priority | `priority: 'high' \| 'medium' \| 'low'` |
### DeriveTestCasesUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: DeriveTestCasesInputDTO): Promise<DeriveTestCasesOutputDTO>` |

## backend/src/application/use-cases/generate-from-bva.use-case.ts

### GenerateFromBvaInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| variable | `variable: BvaVariableInput` |
| userId | `userId: string` |
| userRole | `userRole: string` |
### GenerateFromBvaUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: GenerateFromBvaInputDTO): retorno inferido` |

## backend/src/application/use-cases/generate-from-formal.use-case.ts

### GenerateFromFormalInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| method | `method: FormalMethodType` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| payload | `payload: {
    conditions?: DecisionCondition[];
    actions?: DecisionAction[];
    states?: string[];
    validTransitions?: StateTransition[];
    parameters?: ParameterOption[];
    classes?: ClassificationClass[];
    useCase?: UseCaseInput;
    entityName?: string;
  }` |
### GenerateFromFormalUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: GenerateFromFormalInputDTO): retorno inferido` |

## backend/src/application/use-cases/generate-from-template.use-case.ts

### GenerateFromTemplateInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| templateCategory | `templateCategory: string` |
### GenerateFromTemplateOutputDTO

| Miembro | Declaración |
|---|---|
| cases | `cases: Array<Record<string, unknown>>` |
| templateUsed | `templateUsed: {
    category: string;
    name: string;
    casesGenerated: number;
  }` |
| duplicateWarnings | `duplicateWarnings: DuplicateCandidate[]` |
### GenerateFromTemplateUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: GenerateFromTemplateInputDTO): Promise<GenerateFromTemplateOutputDTO>` |

## backend/src/application/use-cases/generate-project-spec.use-case.ts

### GenerateProjectSpecInputDTO

| Miembro | Declaración |
|---|---|
| projectId | `projectId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| name | `name: string` |
| description | `description: string` |
| depth | `depth: DerivationDepth` |
| includeNonFunctional | `includeNonFunctional: boolean` |
| includeEntityCrud | `includeEntityCrud: boolean` |
### GeneratedUseCaseSummary

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| code | `code: string` |
| name | `name: string` |
| actor | `actor: string` |
| moduleKey | `moduleKey: string` |
| moduleName | `moduleName: string` |
| requirementCount | `requirementCount: number` |
### GeneratedRequirementSummary

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| code | `code: string` |
| title | `title: string` |
| kind | `kind: 'functional' \| 'non_functional'` |
| useCaseCode | `useCaseCode: string \| null` |
| testCasesCreated | `testCasesCreated: number` |
### GenerateProjectSpecOutputDTO

| Miembro | Declaración |
|---|---|
| generationId | `generationId: string` |
| engineVersion | `engineVersion: string` |
| depth | `depth: DerivationDepth` |
| summary | `summary: ProjectSpecification['summary']` |
| actors | `actors: ProjectSpecification['actors']` |
| modules | `modules: ProjectSpecification['modules']` |
| entities | `entities: ProjectSpecification['entities']` |
| warnings | `warnings: string[]` |
| created | `created: { useCases: number; requirements: number; testCases: number }` |
| skipped | `skipped: { useCases: number; requirements: number }` |
| useCases | `useCases: GeneratedUseCaseSummary[]` |
| requirements | `requirements: GeneratedRequirementSummary[]` |
| durationMs | `durationMs: number` |
### GenerateProjectSpecUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: GenerateProjectSpecInputDTO): Promise<GenerateProjectSpecOutputDTO>` |

## backend/src/application/use-cases/generate-test-cases.use-case.ts

### GenerateTestCasesInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| provider | `provider: 'gemini' \| 'openai'` |
| model | `model: string` |
| temperature | `temperature: number` |
| useCache | `useCache: boolean` |
### GenerateTestCasesOutputDTO

| Miembro | Declaración |
|---|---|
| cases | `cases: Array<Record<string, unknown>>` |
| generation | `generation: {
    id: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number \| null;
    responseTimeMs: number;
    cached: boolean;
  }` |
| duplicateWarnings | `duplicateWarnings: DuplicateCandidate[]` |
### GenerateTestCasesUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: GenerateTestCasesInputDTO): Promise<GenerateTestCasesOutputDTO>` |

## backend/src/application/use-cases/get-projects-with-metrics.use-case.ts

### GetProjectsInputDTO

| Miembro | Declaración |
|---|---|
| userId | `userId: string` |
| userRole | `userRole: string` |
| skip | `skip: number` |
| take | `take: number` |
### ProjectStatsDTO

| Miembro | Declaración |
|---|---|
| requirementsCount | `requirementsCount: number` |
| totalTestCases | `totalTestCases: number` |
| approvedTestCases | `approvedTestCases: number` |
| coveragePercent | `coveragePercent: number` |
| totalCostUsd | `totalCostUsd: number \| null` |
### ProjectDTO

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| name | `name: string` |
| description | `description: string \| null` |
| status | `status: string` |
| budgetUsd | `budgetUsd: number \| null` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
| stats | `stats: ProjectStatsDTO` |
### GetProjectsOutputDTO

| Miembro | Declaración |
|---|---|
| items | `items: ProjectDTO[]` |
| total | `total: number` |
### GetProjectsWithMetricsUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: GetProjectsInputDTO): Promise<GetProjectsOutputDTO>` |

## backend/src/application/use-cases/import-test-cases.use-case.ts

### RawImportCaseDTO

| Miembro | Declaración |
|---|---|
| title | `title: string` |
| type | `type: 'positive' \| 'negative' \| 'alternative' \| 'boundary' \| 'validation'` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: 'high' \| 'medium' \| 'low'` |
### ImportTestCasesInputDTO

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| userId | `userId: string` |
| userRole | `userRole: string` |
| cases | `cases: RawImportCaseDTO[]` |
### ImportTestCasesUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: ImportTestCasesInputDTO): retorno inferido` |

## backend/src/application/use-cases/review-test-case.use-case.ts

### ReviewTestCaseInputDTO

| Miembro | Declaración |
|---|---|
| testCaseId | `testCaseId: string` |
| reviewerId | `reviewerId: string` |
| reviewerRole | `reviewerRole: string` |
| decision | `decision: 'APPROVED' \| 'MODIFIED' \| 'REJECTED'` |
| comments | `comments: string` |
| justification | `justification: string` |
| expectedVersion | `expectedVersion: number` |
| updates | `updates: {
    title?: string;
    preconditions?: string[];
    steps?: string[];
    testData?: string \| null;
    expectedResult?: string;
    priority?: 'high' \| 'medium' \| 'low';
    evidenceStatus?: 'derived' \| 'suggested' \| 'ambiguous' \| 'conflict' \| 'pending';
    evidenceText?: string \| null;
  }` |
### ReviewTestCaseUseCase

| Miembro | Declaración |
|---|---|
| execute | `execute(input: ReviewTestCaseInputDTO): retorno inferido` |

## backend/src/common/cache/lru-cache.ts

### CacheEntry

| Miembro | Declaración |
|---|---|
| value | `value: T` |
| expiresAt | `expiresAt: number` |
### LruCache

| Miembro | Declaración |
|---|---|
| capacity | `capacity: number` |
| defaultTtlMs | `defaultTtlMs: number` |
| cache | `cache: Map<string, CacheEntry<T>>` |
| constructor | `constructor(capacity = 500, defaultTtlSeconds = 300): retorno inferido` |
| get | `get(key: string): T \| null` |
| set | `set(key: string, value: T, ttlSeconds?: number): void` |
| invalidate | `invalidate(key: string): void` |
| clear | `clear(): void` |
| size | `size(): number` |

## backend/src/common/errors/api-error.ts

### ApiError

| Miembro | Declaración |
|---|---|
| statusCode | `statusCode: number` |
| isOperational | `isOperational: boolean` |
| constructor | `constructor(statusCode: number, message: string, isOperational = true): retorno inferido` |
| badRequest | `badRequest(msg = 'Solicitud inválida'): retorno inferido` |
| unauthorized | `unauthorized(msg = 'No autenticado'): retorno inferido` |
| forbidden | `forbidden(msg = 'Acceso denegado'): retorno inferido` |
| notFound | `notFound(msg = 'Recurso no encontrado'): retorno inferido` |
| conflict | `conflict(msg = 'Conflicto con el estado actual del recurso'): retorno inferido` |
| unprocessableEntity | `unprocessableEntity(msg = 'Entidad no procesable'): retorno inferido` |
| badGateway | `badGateway(msg = 'Error al comunicarse con el servicio upstream'): retorno inferido` |
| serviceUnavailable | `serviceUnavailable(msg = 'Servicio no disponible'): retorno inferido` |
| gatewayTimeout | `gatewayTimeout(msg = 'Tiempo de espera agotado con el proveedor upstream'): retorno inferido` |

## backend/src/common/middleware/async-handler.ts

### asyncHandler

`export function asyncHandler(fn: RequestHandler): RequestHandler`


## backend/src/common/middleware/auth.middleware.ts

### UserTokenPayload

| Miembro | Declaración |
|---|---|
| userId | `userId: string` |
| email | `email: string` |
| role | `role: string` |
### Request

| Miembro | Declaración |
|---|---|
| user | `user: UserTokenPayload` |
### signAccessToken

`export function signAccessToken(payload: UserTokenPayload): string`

### signRefreshToken

`export function signRefreshToken(payload: UserTokenPayload): string`

### verifyRefreshToken

`export function verifyRefreshToken(token: string): UserTokenPayload`

### issueTokenPair

`export function issueTokenPair(payload: UserTokenPayload)`

### signToken

`export function signToken(payload: UserTokenPayload): string`

### authenticateJWT

`export function authenticateJWT(req: Request, res: Response, next: NextFunction)`

### requireRoles

`export function requireRoles(allowedRoles: string[])`


## backend/src/common/middleware/error-handler.ts

### notFoundHandler

`export function notFoundHandler(req: Request, res: Response)`

### errorHandler

`export function errorHandler( err: unknown, req: Request, res: Response, // eslint-disable-next-line @typescript-eslint/no-unused-vars _next: NextFunction )`


## backend/src/common/middleware/request-id.ts

### Request

| Miembro | Declaración |
|---|---|
| id | `id: string` |
### requestId

`export function requestId(req: Request, res: Response, next: NextFunction)`


## backend/src/common/security/cookie-session.ts

### CookieSessionManager

| Miembro | Declaración |
|---|---|
| setAuthCookie | `setAuthCookie(res: Response, token: string): void` |
| setRefreshCookie | `setRefreshCookie(res: Response, refreshToken: string): void` |
| clearAuthCookies | `clearAuthCookies(res: Response): void` |
| extractToken | `extractToken(req: Request): string \| null` |
| extractRefreshToken | `extractRefreshToken(req: Request): string \| null` |
| verifyMutationOrigin | `verifyMutationOrigin(req: Request, _res: Response, next: NextFunction): void` |

## backend/src/common/security/crypto-vault.ts

### CryptoVault

| Miembro | Declaración |
|---|---|
| getKey | `getKey(): Buffer` |
| encrypt | `encrypt(plainText: string): string` |
| decrypt | `decrypt(cipherTextBase64: string): string` |

## backend/src/common/security/pii-masker.ts

### MaskingResult

| Miembro | Declaración |
|---|---|
| maskedText | `maskedText: string` |
| piiFound | `piiFound: boolean` |
| totalMasked | `totalMasked: number` |
| maskMap | `maskMap: Map<string, string>` |
### MultiMaskingResult

| Miembro | Declaración |
|---|---|
| maskedFields | `maskedFields: T` |
| piiFound | `piiFound: boolean` |
| totalMasked | `totalMasked: number` |
| maskMap | `maskMap: Map<string, string>` |
### PIIMasker

| Miembro | Declaración |
|---|---|
| EMAIL_REGEX | `EMAIL_REGEX: tipo inferido` |
| CREDIT_CARD_REGEX | `CREDIT_CARD_REGEX: tipo inferido` |
| PHONE_REGEX | `PHONE_REGEX: tipo inferido` |
| API_KEY_REGEX | `API_KEY_REGEX: tipo inferido` |
| DNI_REGEX | `DNI_REGEX: tipo inferido` |
| IP_REGEX | `IP_REGEX: tipo inferido` |
| mask | `mask(text: string): MaskingResult` |
| maskMultiple | `maskMultiple(fields: T): MultiMaskingResult<T>` |
| maskWithMap | `maskWithMap(text: string, maskMap: Map<string, string>, state: { counter: number }): { masked: string; maskMap: Map<string, string> }` |
| unmask | `unmask(maskedText: string, maskMap: Map<string, string>): string` |

## backend/src/common/security/prompt-guard.ts

### PromptGuardResult

| Miembro | Declaración |
|---|---|
| isSafe | `isSafe: boolean` |
| riskScore | `riskScore: number` |
| threatsDetected | `threatsDetected: string[]` |
| sanitizedText | `sanitizedText: string` |
### PromptGuard

| Miembro | Declaración |
|---|---|
| INJECTION_PATTERNS | `INJECTION_PATTERNS: tipo inferido` |
| inspect | `inspect(input: string): PromptGuardResult` |
| assertSafe | `assertSafe(input: string, threshold: number = 40): string` |

## backend/src/common/security/rbac.ts

### RBACManager

| Miembro | Declaración |
|---|---|
| ROLE_PERMISSIONS | `ROLE_PERMISSIONS: Record<UserRole, Set<Permission>>` |
| can | `can(role: string, permission: Permission): boolean` |
| requirePermission | `requirePermission(permission: Permission): retorno inferido` |

## backend/src/common/security/secure-random.ts

### secureRandomFraction

`export function secureRandomFraction(): number`


## backend/src/common/security/session.service.ts

### SessionService

| Miembro | Declaración |
|---|---|
| hashToken | `hashToken(token: string): string` |
| createSession | `createSession(params: {
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<string>` |
| rotateSession | `rotateSession(params: {
    oldRefreshToken: string;
    newRefreshToken: string;
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<boolean>` |
| revokeSession | `revokeSession(refreshToken: string): Promise<void>` |

## backend/src/common/utils/api-response.ts

### ApiResponse

| Miembro | Declaración |
|---|---|
| success | `success: boolean` |
| data | `data: T` |
| message | `message: string` |
| error | `error: string` |
### PaginationMeta

| Miembro | Declaración |
|---|---|
| page | `page: number` |
| pageSize | `pageSize: number` |
| total | `total: number` |
| totalPages | `totalPages: number` |
### sendSuccess

`export function sendSuccess<T>( res: Response, data: T, message = 'Operación exitosa', statusCode = 200 ): Response`

### sendError

`export function sendError(res: Response, error: string, statusCode = 400): Response`

### sendPaginated

`export function sendPaginated<T>( res: Response, items: T[], meta: PaginationMeta, message = 'Operación exitosa' ): Response`

### getPagination

`export function getPagination(req: Request):`

### buildPaginationMeta

`export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta`


## backend/src/common/utils/audit.ts

### audit

`export function audit(req: Request, action: AuditAction, details: Record<string, unknown> =`


## backend/src/common/utils/json.ts

### safeJsonArray

`export function safeJsonArray(raw: unknown): unknown[]`

### safeJsonObject

`export function safeJsonObject(raw: unknown): Record<string, unknown> | null`


## backend/src/common/utils/ownership.ts

### isAdmin

`function isAdmin(role?: string): boolean`

### assertProjectAccess

`export async function assertProjectAccess(projectId: string, userId: string, role?: string)`

### assertRequirementAccess

`export async function assertRequirementAccess(requirementId: string, userId: string, role?: string)`

### assertTestCaseAccess

`export async function assertTestCaseAccess(testCaseId: string, userId: string, role?: string)`


## backend/src/common/utils/retry.ts

### RetryOptions

| Miembro | Declaración |
|---|---|
| retries | `retries: number` |
| timeoutMs | `timeoutMs: number` |
| label | `label: string` |
### withRetry

`export async function withRetry<T>( fn: (signal: AbortSignal) => Promise<T>,`


## backend/src/config/ai-pricing.ts

### ModelPricing

| Miembro | Declaración |
|---|---|
| inputPerMillion | `inputPerMillion: number` |
| outputPerMillion | `outputPerMillion: number` |
### calculateAICost

`export function calculateAICost( model: string, inputTokens: number, outputTokens: number ): number | null`


## backend/src/config/env.ts

### getCorsOrigins

`export function getCorsOrigins(): string[] | '*'`


## backend/src/config/prisma.ts

### initDatabaseConnection

`export async function initDatabaseConnection(): Promise<boolean>`

### disconnectDatabase

`export async function disconnectDatabase(): Promise<void>`


## backend/src/config/swagger.ts

### mountSwagger

`export function mountSwagger(app: Express)`


## backend/src/core/adapters/gemini.adapter.ts

### GeminiAdapter

| Miembro | Declaración |
|---|---|
| providerName | `providerName: tipo inferido` |
| generateTestCases | `generateTestCases(requirementCode: string, requirementTitle: string, description: string, acceptanceCriteria: string, options?: GenerateOptions): Promise<AIGenerationResult>` |

## backend/src/core/adapters/openai.adapter.ts

### OpenAIAdapter

| Miembro | Declaración |
|---|---|
| providerName | `providerName: tipo inferido` |
| generateTestCases | `generateTestCases(requirementCode: string, requirementTitle: string, description: string, acceptanceCriteria: string, options?: GenerateOptions): Promise<AIGenerationResult>` |

## backend/src/core/ai.factory.ts

### AIFactory

| Miembro | Declaración |
|---|---|
| registry | `registry: Map<string, AIProviderFactoryFn>` |
| instances | `instances: Map<string, IAIProvider>` |
| registerProvider | `registerProvider(name: string, factoryFn: AIProviderFactoryFn): void` |
| getProvider | `getProvider(providerName?: string): IAIProvider` |
| hasProvider | `hasProvider(name: string): boolean` |
| getAvailableProviders | `getAvailableProviders(): string[]` |

## backend/src/core/domain/entities/project.entity.ts

### ProjectEntityProps

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| name | `name: string` |
| description | `description: string \| null` |
| ownerId | `ownerId: string` |
| status | `status: 'ACTIVE' \| 'ARCHIVED'` |
| budgetUsd | `budgetUsd: number \| null` |
| nextRequirementNumber | `nextRequirementNumber: number` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
### ProjectEntity

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| _name | `_name: string` |
| _description | `_description: string \| null` |
| ownerId | `ownerId: string` |
| _status | `_status: 'ACTIVE' \| 'ARCHIVED'` |
| _budgetUsd | `_budgetUsd: number \| null` |
| _nextRequirementNumber | `_nextRequirementNumber: number` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
| constructor | `constructor(props: ProjectEntityProps): retorno inferido` |
| name | `name: string` |
| description | `description: string \| null` |
| status | `status: 'ACTIVE' \| 'ARCHIVED'` |
| budgetUsd | `budgetUsd: number \| null` |
| nextRequirementNumber | `nextRequirementNumber: number` |
| isActive | `isActive(): boolean` |
| isArchived | `isArchived(): boolean` |
| archive | `archive(): void` |
| reactivate | `reactivate(): void` |
| updateDetails | `updateDetails(name: string, description?: string \| null, budgetUsd?: number \| null): void` |
| allocateNextRequirementCode | `allocateNextRequirementCode(): string` |

## backend/src/core/domain/entities/requirement.entity.ts

### RequirementEntityProps

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| projectId | `projectId: string` |
| code | `code: string` |
| title | `title: string` |
| description | `description: string` |
| acceptanceCriteria | `acceptanceCriteria: string` |
| version | `version: number` |
| status | `status: 'READY_FOR_AI' \| 'GENERATED' \| 'OBSOLETE'` |
| nextCaseNumber | `nextCaseNumber: number` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
### RequirementEntity

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| projectId | `projectId: string` |
| code | `code: string` |
| _title | `_title: string` |
| _description | `_description: string` |
| _acceptanceCriteria | `_acceptanceCriteria: string` |
| _version | `_version: number` |
| _status | `_status: 'READY_FOR_AI' \| 'GENERATED' \| 'OBSOLETE'` |
| _nextCaseNumber | `_nextCaseNumber: number` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
| constructor | `constructor(props: RequirementEntityProps): retorno inferido` |
| title | `title: string` |
| description | `description: string` |
| acceptanceCriteria | `acceptanceCriteria: string` |
| version | `version: number` |
| status | `status: 'READY_FOR_AI' \| 'GENERATED' \| 'OBSOLETE'` |
| nextCaseNumber | `nextCaseNumber: number` |
| updateContent | `updateContent(title: string, description: string, acceptanceCriteria: string): void` |
| markAsGenerated | `markAsGenerated(): void` |
| markAsObsolete | `markAsObsolete(): void` |
| allocateNextCaseCode | `allocateNextCaseCode(): string` |

## backend/src/core/domain/entities/test-case.entity.ts

### TestCaseProps

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| requirementId | `requirementId: string` |
| code | `code: TestCaseCode` |
| type | `type: ISTQBTechnique` |
| title | `title: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: TestCasePriority` |
| status | `status: TestCaseStatus` |
| version | `version: number` |
| source | `source: 'MANUAL' \| 'RULE_BASED' \| 'AI_GENERATED'` |
| evidenceStatus | `evidenceStatus: 'derived' \| 'suggested' \| 'ambiguous' \| 'conflict'` |
| evidenceText | `evidenceText: string \| null` |
| isObsolete | `isObsolete: boolean` |
| generationId | `generationId: string \| null` |
| requirementVersion | `requirementVersion: number` |
| originalContent | `originalContent: Record<string, unknown> \| null` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
### TestCaseEntity

| Miembro | Declaración |
|---|---|
| props | `props: TestCaseProps` |
| constructor | `constructor(props: TestCaseProps): retorno inferido` |
| id | `id: string` |
| requirementId | `requirementId: string` |
| code | `code: TestCaseCode` |
| type | `type: ISTQBTechnique` |
| title | `title: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: TestCasePriority` |
| status | `status: TestCaseStatus` |
| version | `version: number` |
| source | `source: string` |
| evidenceStatus | `evidenceStatus: string` |
| evidenceText | `evidenceText: string \| null` |
| isObsolete | `isObsolete: boolean` |
| generationId | `generationId: string \| null` |
| requirementVersion | `requirementVersion: number` |
| originalContent | `originalContent: Record<string, unknown> \| null` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
| approve | `approve(reviewerId: string, _comments?: string): void` |
| reject | `reject(reviewerId: string, reason: string): void` |
| modify | `modify(updates: Partial<Omit<TestCaseProps, 'id' \| 'requirementId' \| 'code' \| 'version'>>): void` |
| assertVersionMatch | `assertVersionMatch(expectedVersion?: number): void` |
| toJSON | `toJSON(): Record<string, unknown>` |

## backend/src/core/domain/entities/test-run.entity.ts

### TestExecutionResultProps

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| testRunId | `testRunId: string` |
| testCaseId | `testCaseId: string` |
| code | `code: string` |
| title | `title: string` |
| status | `status: ExecutionStatus` |
| durationSeconds | `durationSeconds: number` |
| executedAt | `executedAt: Date \| null` |
| executedBy | `executedBy: string \| null` |
| evidenceText | `evidenceText: string \| null` |
| defectNotes | `defectNotes: string \| null` |
| defectLogged | `defectLogged: boolean` |
### TestRunEntityProps

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| projectId | `projectId: string` |
| name | `name: string` |
| environment | `environment: string` |
| status | `status: 'IN_PROGRESS' \| 'COMPLETED'` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
| executions | `executions: TestExecutionResultProps[]` |
### TestRunEntity

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| projectId | `projectId: string` |
| _name | `_name: string` |
| _environment | `_environment: string` |
| _status | `_status: 'IN_PROGRESS' \| 'COMPLETED'` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
| _executions | `_executions: TestExecutionResultProps[]` |
| constructor | `constructor(props: TestRunEntityProps): retorno inferido` |
| name | `name: string` |
| environment | `environment: string` |
| status | `status: 'IN_PROGRESS' \| 'COMPLETED'` |
| executions | `executions: ReadonlyArray<TestExecutionResultProps>` |
| complete | `complete(): void` |
| getMetrics | `getMetrics(): retorno inferido` |

## backend/src/core/domain/mappers/test-case.mapper.ts

### PrismaTestCaseRow

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| requirementId | `requirementId: string` |
| code | `code: string` |
| type | `type: string` |
| title | `title: string` |
| preconditions | `preconditions: unknown` |
| steps | `steps: unknown` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: string` |
| status | `status: string` |
| version | `version: number` |
| source | `source: string` |
| evidenceStatus | `evidenceStatus: string` |
| evidenceText | `evidenceText: string \| null` |
| isObsolete | `isObsolete: boolean` |
| generationId | `generationId: string \| null` |
| requirementVersion | `requirementVersion: number` |
| originalContent | `originalContent: unknown` |
| createdAt | `createdAt: Date` |
| updatedAt | `updatedAt: Date` |
| reviews | `reviews: Array<{
    id: string;
    decision: string;
    comments: string \| null;
    previousContent: unknown;
    newContent: unknown;
    createdAt: Date;
    reviewer?: { id: string; fullName: string; role: string };
  }>` |
### TestCaseMapper

| Miembro | Declaración |
|---|---|
| toDomain | `toDomain(row: PrismaTestCaseRow): TestCaseEntity` |
| toPersistence | `toPersistence(entity: TestCaseEntity): retorno inferido` |
| toDTO | `toDTO(row: PrismaTestCaseRow): retorno inferido` |

## backend/src/core/domain/security/security-policy.ts

### DomainSecurityException

| Miembro | Declaración |
|---|---|
| constructor | `constructor(message: string, public readonly code: string = 'FORBIDDEN'): retorno inferido` |
### ResourceNotFoundDomainException

| Miembro | Declaración |
|---|---|
| constructor | `constructor(message: string): retorno inferido` |
### SecurityUserContext

| Miembro | Declaración |
|---|---|
| userId | `userId: string` |
| role | `role: string` |
### SecurityPolicy

| Miembro | Declaración |
|---|---|
| isAdmin | `isAdmin(role: string): boolean` |
| canAccessProject | `canAccessProject(projectOwnerId: string, user: SecurityUserContext): boolean` |
| assertProjectAccess | `assertProjectAccess(projectOwnerId: string, user: SecurityUserContext, projectName: string = 'proyecto'): void` |
| canExecuteTestCaseReview | `canExecuteTestCaseReview(user: SecurityUserContext): boolean` |
| assertCanReview | `assertCanReview(user: SecurityUserContext): void` |

## backend/src/core/domain/services/requirement-fingerprint.service.ts

### FingerprintInputs

| Miembro | Declaración |
|---|---|
| code | `code: string` |
| title | `title: string` |
| description | `description: string` |
| acceptanceCriteria | `acceptanceCriteria: string` |
| provider | `provider: string` |
| model | `model: string` |
### IFingerprintStrategy

| Miembro | Declaración |
|---|---|
| compute | `compute: string` |
### Sha256FingerprintStrategy

| Miembro | Declaración |
|---|---|
| compute | `compute(inputs: FingerprintInputs): string` |
### RequirementFingerprintService

| Miembro | Declaración |
|---|---|
| defaultStrategy | `defaultStrategy: IFingerprintStrategy` |
| setStrategy | `setStrategy(strategy: IFingerprintStrategy): void` |
| compute | `compute(inputs: FingerprintInputs): string` |

## backend/src/core/domain/value-objects/entity-codes.vo.ts

### TestCasePriority

| Miembro | Declaración |
|---|---|
| HIGH | `HIGH: tipo inferido` |
| MEDIUM | `MEDIUM: tipo inferido` |
| LOW | `LOW: tipo inferido` |
| constructor | `constructor(private readonly level: PriorityLevel): retorno inferido` |
| from | `from(raw?: string \| null): TestCasePriority` |
| getLevel | `getLevel(): PriorityLevel` |
| getNumericWeight | `getNumericWeight(): number` |
| isHigh | `isHigh(): boolean` |
| equals | `equals(other: TestCasePriority): boolean` |
| toString | `toString(): string` |
### TestCaseCode

| Miembro | Declaración |
|---|---|
| constructor | `constructor(private readonly code: string): retorno inferido` |
| from | `from(raw: string): TestCaseCode` |
| getValue | `getValue(): string` |
| equals | `equals(other: TestCaseCode): boolean` |
| toString | `toString(): string` |
### RequirementCode

| Miembro | Declaración |
|---|---|
| constructor | `constructor(private readonly code: string): retorno inferido` |
| from | `from(raw: string): RequirementCode` |
| getValue | `getValue(): string` |
| equals | `equals(other: RequirementCode): boolean` |
| toString | `toString(): string` |

## backend/src/core/domain/value-objects/istqb-technique.vo.ts

### ISTQBTechnique

| Miembro | Declaración |
|---|---|
| VALID_TECHNIQUES | `VALID_TECHNIQUES: Set<string>` |
| POSITIVE | `POSITIVE: tipo inferido` |
| NEGATIVE | `NEGATIVE: tipo inferido` |
| BOUNDARY | `BOUNDARY: tipo inferido` |
| VALIDATION | `VALIDATION: tipo inferido` |
| ALTERNATIVE | `ALTERNATIVE: tipo inferido` |
| DECISION_TABLE | `DECISION_TABLE: tipo inferido` |
| STATE_TRANSITION | `STATE_TRANSITION: tipo inferido` |
| PAIRWISE | `PAIRWISE: tipo inferido` |
| CTM | `CTM: tipo inferido` |
| ERROR_GUESSING | `ERROR_GUESSING: tipo inferido` |
| constructor | `constructor(private readonly value: ISTQBTechniqueType): retorno inferido` |
| from | `from(raw: string): ISTQBTechnique` |
| getValue | `getValue(): ISTQBTechniqueType` |
| isBoundary | `isBoundary(): boolean` |
| isCombinatorial | `isCombinatorial(): boolean` |
| isStateTransition | `isStateTransition(): boolean` |
| isSecurityOrNegative | `isSecurityOrNegative(): boolean` |
| isBlackBox | `isBlackBox(): boolean` |
| isExperienceBased | `isExperienceBased(): boolean` |
| equals | `equals(other: ISTQBTechnique): boolean` |
| toString | `toString(): string` |

## backend/src/core/domain/value-objects/test-case-status.vo.ts

### TestCaseStatus

| Miembro | Declaración |
|---|---|
| VALID_STATUSES | `VALID_STATUSES: Set<TestCaseStatusType>` |
| PENDING | `PENDING: tipo inferido` |
| APPROVED | `APPROVED: tipo inferido` |
| MODIFIED | `MODIFIED: tipo inferido` |
| REJECTED | `REJECTED: tipo inferido` |
| constructor | `constructor(private readonly value: TestCaseStatusType): retorno inferido` |
| from | `from(raw: string): TestCaseStatus` |
| getValue | `getValue(): TestCaseStatusType` |
| isApproved | `isApproved(): boolean` |
| isPending | `isPending(): boolean` |
| isRejected | `isRejected(): boolean` |
| isModified | `isModified(): boolean` |
| canTransitionTo | `canTransitionTo(next: TestCaseStatus): boolean` |
| equals | `equals(other: TestCaseStatus): boolean` |
| toString | `toString(): string` |

## backend/src/core/interfaces/ai-provider.interface.ts

### RawGeneratedCase

| Miembro | Declaración |
|---|---|
| type | `type: TestCaseType` |
| title | `title: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: PriorityLevel` |
| evidenceStatus | `evidenceStatus: EvidenceStatus` |
| evidenceText | `evidenceText: string \| null` |
### AIGenerationResult

| Miembro | Declaración |
|---|---|
| provider | `provider: 'gemini' \| 'openai'` |
| model | `model: string` |
| promptVersion | `promptVersion: string` |
| inputTokens | `inputTokens: number` |
| outputTokens | `outputTokens: number` |
| responseTimeMs | `responseTimeMs: number` |
| estimatedCost | `estimatedCost: number \| null` |
| cases | `cases: RawGeneratedCase[]` |
### GenerateOptions

| Miembro | Declaración |
|---|---|
| model | `model: string` |
| temperature | `temperature: number` |
| maxOutputTokens | `maxOutputTokens: number` |
### IAIProvider

| Miembro | Declaración |
|---|---|
| providerName | `providerName: 'gemini' \| 'openai'` |
| generateTestCases | `generateTestCases: Promise<AIGenerationResult>` |

## backend/src/core/ports/project-repository.port.ts

### ProjectFilter

| Miembro | Declaración |
|---|---|
| ownerId | `ownerId: string` |
| status | `status: string` |
| search | `search: string` |
### IProjectRepository

| Miembro | Declaración |
|---|---|
| findById | `findById: Promise<ProjectEntity \| null>` |
| findByOwner | `findByOwner: Promise<PaginatedResult<ProjectEntity>>` |
| create | `create: Promise<ProjectEntity>` |
| update | `update: Promise<ProjectEntity>` |
| archive | `archive: Promise<boolean>` |
| delete | `delete: Promise<boolean>` |

## backend/src/core/ports/requirement-repository.port.ts

### RequirementFilter

| Miembro | Declaración |
|---|---|
| projectId | `projectId: string` |
| status | `status: string` |
| search | `search: string` |
### IRequirementRepository

| Miembro | Declaración |
|---|---|
| findById | `findById: Promise<RequirementEntity \| null>` |
| findByProjectId | `findByProjectId: Promise<PaginatedResult<RequirementEntity>>` |
| save | `save: Promise<void>` |
| createVersion | `createVersion: Promise<number>` |
| delete | `delete: Promise<boolean>` |

## backend/src/core/ports/test-case-repository.port.ts

### TestCaseFilter

| Miembro | Declaración |
|---|---|
| requirementId | `requirementId: string` |
| projectId | `projectId: string` |
| status | `status: string` |
| search | `search: string` |
### PaginationOptions

| Miembro | Declaración |
|---|---|
| skip | `skip: number` |
| take | `take: number` |
| page | `page: number` |
| pageSize | `pageSize: number` |
### PaginatedResult

| Miembro | Declaración |
|---|---|
| items | `items: T[]` |
| total | `total: number` |
### ITestCaseRepository

| Miembro | Declaración |
|---|---|
| findById | `findById: Promise<TestCaseEntity \| null>` |
| findByRequirementId | `findByRequirementId: Promise<TestCaseEntity[]>` |
| findByProjectId | `findByProjectId: Promise<PaginatedResult<TestCaseEntity>>` |
| save | `save: Promise<void>` |
| saveBatch | `saveBatch: Promise<void>` |
| delete | `delete: Promise<boolean>` |

## backend/src/core/ports/test-run-repository.port.ts

### ITestRunRepository

| Miembro | Declaración |
|---|---|
| findById | `findById: Promise<TestRunEntity \| null>` |
| findByProjectId | `findByProjectId: Promise<TestRunEntity[]>` |
| create | `create: Promise<TestRunEntity>` |
| recordExecution | `recordExecution: Promise<TestExecutionResultProps>` |
| logDefect | `logDefect: Promise<TestExecutionResultProps>` |

## backend/src/core/prompts/prompt-builder.ts

### PromptPayload

| Miembro | Declaración |
|---|---|
| systemPrompt | `systemPrompt: string` |
| userPrompt | `userPrompt: string` |
| version | `version: string` |
### buildPromptForRequirement

`export function buildPromptForRequirement( code: string, title: string, description: string, acceptanceCriteria: string ): PromptPayload`


## backend/src/core/spec-engine/catalog/actors.ts

### findActor

`export function findActor(key: string): ActorDefinition | undefined`


## backend/src/core/spec-engine/catalog/entities.ts

### findEntity

`export function findEntity(key: string): EntityDefinition | undefined`


## backend/src/core/spec-engine/catalog/index.ts

### findModule

`export function findModule(key: string): DomainModule | undefined`

### NonFunctionalTemplate

| Miembro | Declaración |
|---|---|
| requiresModules | `requiresModules: string[]` |
| template | `template: RequirementTemplate` |
### EntityWords

| Miembro | Declaración |
|---|---|
| singular | `singular: string` |
| plural | `plural: string` |
| singularCap | `singularCap: string` |
| pluralCap | `pluralCap: string` |
| art | `art: string` |
| arts | `arts: string` |
| un | `un: string` |
| nuevo | `nuevo: string` |
| registrado | `registrado: string` |
| lo | `lo: string` |
### entityWords

`function entityWords(entity: EntitySpec): EntityWords`

### sampleValue

`function sampleValue(field: EntityField, words: EntityWords): string`

### fieldConstraint

`function fieldConstraint(field: EntityField): string`

### toVariable

`function toVariable(field: EntityField): BvaVariableInput | null`

### buildEntityCrudUseCase

`export function buildEntityCrudUseCase(entity: EntitySpec): UseCaseTemplate`

### getCatalogStats

`export function getCatalogStats()`


## backend/src/core/spec-engine/project-spec-engine.ts

### SpecEngineInput

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| description | `description: string` |
### SpecEngineOptions

| Miembro | Declaración |
|---|---|
| depth | `depth: DerivationDepth` |
| includeNonFunctional | `includeNonFunctional: boolean` |
| includeEntityCrud | `includeEntityCrud: boolean` |
| maxModules | `maxModules: number` |
| maxEntities | `maxEntities: number` |
### HydrationContext

| Miembro | Declaración |
|---|---|
| actor | `actor: string` |
| admin | `admin: string` |
| project | `project: string` |
### ScoredModule

| Miembro | Declaración |
|---|---|
| module | `module: DomainModule` |
| score | `score: number` |
| matched | `matched: string[]` |
| implied | `implied: boolean` |
| order | `order: number` |
### ProjectSpecEngine

| Miembro | Declaración |
|---|---|
| analyze | `analyze(input: SpecEngineInput, options: SpecEngineOptions = {}): ProjectSpecification` |
| hydrate | `hydrate(text: string, ctx: HydrationContext): string` |
| detectActors | `detectActors(normalized: string): Array<ActorDefinition & { score: number }>` |
| detectModules | `detectModules(normalized: string, maxModules: number, warnings: string[]): ScoredModule[]` |
| detectEntities | `detectEntities(normalized: string, covered: Set<string>, detectedModuleTerms: Set<string>, maxEntities: number): EntitySpec[]` |
| guessGender | `guessGender(word: string): 'm' \| 'f'` |

## backend/src/core/spec-engine/spec-types.ts

### ScenarioTemplate

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| type | `type: ScenarioType` |
| given | `given: string[]` |
| when | `when: string[]` |
| then | `then: string[]` |
### RequirementTemplate

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| title | `title: string` |
| description | `description: string` |
| priority | `priority: Priority` |
| kind | `kind: RequirementKind` |
| scenarios | `scenarios: ScenarioTemplate[]` |
| variables | `variables: BvaVariableInput[]` |
| templateCategory | `templateCategory: string` |
### FlowAlternative

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| condition | `condition: string` |
| steps | `steps: string[]` |
### FlowException

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| trigger | `trigger: string` |
| steps | `steps: string[]` |
| expectedError | `expectedError: string` |
### UseCaseTemplate

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| name | `name: string` |
| actor | `actor: ActorRole` |
| priority | `priority: Priority` |
| description | `description: string` |
| preconditions | `preconditions: string[]` |
| mainFlow | `mainFlow: string[]` |
| alternativeFlows | `alternativeFlows: FlowAlternative[]` |
| exceptionFlows | `exceptionFlows: FlowException[]` |
| postconditions | `postconditions: string[]` |
| requirements | `requirements: RequirementTemplate[]` |
### KeywordRule

| Miembro | Declaración |
|---|---|
| term | `term: string` |
| weight | `weight: number` |
### DomainModule

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| name | `name: string` |
| icon | `icon: string` |
| description | `description: string` |
| keywords | `keywords: KeywordRule[]` |
| preferredActors | `preferredActors: string[]` |
| secondaryActors | `secondaryActors: string[]` |
| coveredEntities | `coveredEntities: string[]` |
| implies | `implies: string[]` |
| templateCategory | `templateCategory: string` |
| useCases | `useCases: UseCaseTemplate[]` |
### ActorDefinition

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| label | `label: string` |
| description | `description: string` |
| keywords | `keywords: string[]` |
| isAdmin | `isAdmin: boolean` |
### EntityField

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| type | `type: EntityFieldType` |
| required | `required: boolean` |
| unique | `unique: boolean` |
| min | `min: number` |
| max | `max: number` |
| unit | `unit: string` |
| options | `options: string[]` |
| example | `example: string` |
### EntityDefinition

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| singular | `singular: string` |
| plural | `plural: string` |
| gender | `gender: 'm' \| 'f'` |
| keywords | `keywords: string[]` |
| fields | `fields: EntityField[]` |
### ActorSpec

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| label | `label: string` |
| description | `description: string` |
| isAdmin | `isAdmin: boolean` |
| source | `source: 'detected' \| 'default'` |
| score | `score: number` |
### ModuleSpec

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| name | `name: string` |
| icon | `icon: string` |
| description | `description: string` |
| score | `score: number` |
| matchedKeywords | `matchedKeywords: string[]` |
| implied | `implied: boolean` |
### EntitySpec

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| singular | `singular: string` |
| plural | `plural: string` |
| gender | `gender: 'm' \| 'f'` |
| score | `score: number` |
| source | `source: 'catalog' \| 'pattern'` |
| fields | `fields: EntityField[]` |
### UseCaseSpec

| Miembro | Declaración |
|---|---|
| code | `code: string` |
| key | `key: string` |
| name | `name: string` |
| actor | `actor: string` |
| moduleKey | `moduleKey: string` |
| moduleName | `moduleName: string` |
| priority | `priority: Priority` |
| description | `description: string` |
| preconditions | `preconditions: string[]` |
| mainFlow | `mainFlow: string[]` |
| alternativeFlows | `alternativeFlows: FlowAlternative[]` |
| exceptionFlows | `exceptionFlows: FlowException[]` |
| postconditions | `postconditions: string[]` |
| requirementCodes | `requirementCodes: string[]` |
### RequirementSpec

| Miembro | Declaración |
|---|---|
| code | `code: string` |
| key | `key: string` |
| title | `title: string` |
| description | `description: string` |
| acceptanceCriteria | `acceptanceCriteria: string` |
| priority | `priority: Priority` |
| kind | `kind: RequirementKind` |
| moduleKey | `moduleKey: string` |
| useCaseCode | `useCaseCode: string \| null` |
| scenarios | `scenarios: ScenarioTemplate[]` |
| variables | `variables: BvaVariableInput[]` |
| templateCategory | `templateCategory: string \| null` |
| estimatedTestCases | `estimatedTestCases: number` |
### SpecificationSummary

| Miembro | Declaración |
|---|---|
| engineVersion | `engineVersion: string` |
| depth | `depth: DerivationDepth` |
| actorsDetected | `actorsDetected: number` |
| modulesDetected | `modulesDetected: number` |
| entitiesDetected | `entitiesDetected: number` |
| totalUseCases | `totalUseCases: number` |
| totalRequirements | `totalRequirements: number` |
| functionalRequirements | `functionalRequirements: number` |
| nonFunctionalRequirements | `nonFunctionalRequirements: number` |
| estimatedTestCases | `estimatedTestCases: number` |
### ProjectSpecification

| Miembro | Declaración |
|---|---|
| project | `project: { name: string; description: string }` |
| summary | `summary: SpecificationSummary` |
| actors | `actors: ActorSpec[]` |
| modules | `modules: ModuleSpec[]` |
| entities | `entities: EntitySpec[]` |
| useCases | `useCases: UseCaseSpec[]` |
| requirements | `requirements: RequirementSpec[]` |
| warnings | `warnings: string[]` |

## backend/src/core/spec-engine/test-deriver.ts

### DerivationInput

| Miembro | Declaración |
|---|---|
| code | `code: string` |
| title | `title: string` |
| description | `description: string` |
| acceptanceCriteria | `acceptanceCriteria: string` |
| priority | `priority: Priority` |
| variables | `variables: BvaVariableInput[]` |
| templateCategory | `templateCategory: string \| null` |
| useCase | `useCase: UseCaseInput \| null` |
| useCaseCode | `useCaseCode: string \| null` |
| depth | `depth: DerivationDepth` |
### DerivedTestCase

| Miembro | Declaración |
|---|---|
| type | `type: ScenarioType` |
| title | `title: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: Priority` |
| evidenceStatus | `evidenceStatus: 'derived' \| 'suggested'` |
| evidenceText | `evidenceText: string \| null` |
| technique | `technique: string` |
### DeterministicTestDeriver

| Miembro | Declaración |
|---|---|
| derive | `derive(input: DerivationInput): DerivedTestCase[]` |
| estimate | `estimate(input: DerivationInput): number` |
| buildUseCaseInput | `buildUseCaseInput(uc: {
    name: string;
    actor: string;
    mainFlow: string[];
    alternativeFlows: FlowAlternative[];
    exceptionFlows: FlowException[];
  }): UseCaseInput` |
| fromGherkin | `fromGherkin(input: DerivationInput): DerivedTestCase[]` |
| fromUseCase | `fromUseCase(input: DerivationInput): DerivedTestCase[]` |
| fromVariables | `fromVariables(input: DerivationInput, depth: DerivationDepth): DerivedTestCase[]` |
| fromTemplate | `fromTemplate(input: DerivationInput): DerivedTestCase[]` |
| fromErrorGuessing | `fromErrorGuessing(input: DerivationInput): DerivedTestCase[]` |
| fallbackCases | `fallbackCases(input: DerivationInput): DerivedTestCase[]` |
| collectVariables | `collectVariables(input: DerivationInput, max: number): BvaVariableInput[]` |
| priorityFor | `priorityFor(type: ScenarioType, base?: Priority): Priority` |
| stripNumbering | `stripNumbering(step: string): string` |
| dedupe | `dedupe(cases: DerivedTestCase[]): DerivedTestCase[]` |

## backend/src/core/spec-engine/text-normalizer.ts

### TextNormalizer

| Miembro | Declaración |
|---|---|
| STOPWORDS | `STOPWORDS: ReadonlySet<string>` |
| stripAccents | `stripAccents(input: string): string` |
| normalize | `normalize(input: string): string` |
| tokenize | `tokenize(input: string): string[]` |
| countOccurrences | `countOccurrences(normalizedText: string, phrase: string): number` |
| singularize | `singularize(word: string): string` |
| pluralize | `pluralize(word: string): string` |
| capitalize | `capitalize(input: string): string` |
| comparisonKey | `comparisonKey(input: string): string` |

## backend/src/core/templates/istqb-templates.ts

### TemplateCase

| Miembro | Declaración |
|---|---|
| type | `type: 'positive' \| 'negative' \| 'alternative' \| 'boundary' \| 'validation'` |
| titleTemplate | `titleTemplate: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| expectedResultTemplate | `expectedResultTemplate: string` |
| priority | `priority: 'high' \| 'medium' \| 'low'` |
| evidenceStatus | `evidenceStatus: 'derived' \| 'suggested'` |
### TemplateCategory

| Miembro | Declaración |
|---|---|
| key | `key: string` |
| name | `name: string` |
| description | `description: string` |
| icon | `icon: string` |
| cases | `cases: TemplateCase[]` |
### hydrateTemplate

`export function hydrateTemplate(template: TemplateCase, reqTitle: string): TemplateCase`


## backend/src/core/test-design/bva-engine.ts

### BvaVariableInput

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| type | `type: BvaVariableType` |
| min | `min: number` |
| max | `max: number` |
| unit | `unit: string` |
| decimals | `decimals: number` |
### BvaCalculatedCase

| Miembro | Declaración |
|---|---|
| type | `type: 'positive' \| 'negative' \| 'boundary' \| 'validation'` |
| title | `title: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string` |
| expectedResult | `expectedResult: string` |
| priority | `priority: 'high' \| 'medium' \| 'low'` |
| tag | `tag: string` |
| testValue | `testValue: string \| number` |
### BvaEngine

| Miembro | Declaración |
|---|---|
| calculate | `calculate(variable: BvaVariableInput): BvaCalculatedCase[]` |
| calculateMultivariate | `calculateMultivariate(varA: { name: string; value: number; label: string }, varB: { name: string; value: number; label: string }, relation: 'LESS_THAN' \| 'LESS_EQUAL' \| 'SUM_LESS_EQUAL', limit?: number): BvaCalculatedCase[]` |
| calculateStringLengthBva | `calculateStringLengthBva(variable: BvaVariableInput): BvaCalculatedCase[]` |

## backend/src/core/test-design/formal-methods.ts

### FormalGeneratedCase

| Miembro | Declaración |
|---|---|
| type | `type: 'positive' \| 'negative' \| 'alternative' \| 'boundary' \| 'validation'` |
| title | `title: string` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| testData | `testData: string` |
| expectedResult | `expectedResult: string` |
| priority | `priority: 'high' \| 'medium' \| 'low'` |
| technique | `technique: string` |
### DecisionCondition

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| label | `label: string` |
### DecisionAction

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| label | `label: string` |
### DecisionTableEngine

| Miembro | Declaración |
|---|---|
| generate | `generate(conditions: DecisionCondition[], actions: DecisionAction[], requirementTitle = 'Requisito'): FormalGeneratedCase[]` |
### StateTransition

| Miembro | Declaración |
|---|---|
| from | `from: string` |
| to | `to: string` |
| event | `event: string` |
| action | `action: string` |
### StateTransitionEngine

| Miembro | Declaración |
|---|---|
| generate | `generate(states: string[], validTransitions: StateTransition[], requirementTitle = 'Entidad'): FormalGeneratedCase[]` |
### ParameterOption

| Miembro | Declaración |
|---|---|
| param | `param: string` |
| values | `values: string[]` |
### PairwiseEngine

| Miembro | Declaración |
|---|---|
| generate | `generate(parameters: ParameterOption[], requirementTitle = 'Configuración'): FormalGeneratedCase[]` |
### ErrorGuessingEngine

| Miembro | Declaración |
|---|---|
| generate | `generate(entityName: string): FormalGeneratedCase[]` |
### ClassificationClass

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| elements | `elements: string[]` |
### ClassificationTreeEngine

| Miembro | Declaración |
|---|---|
| generate | `generate(classes: ClassificationClass[], requirementTitle = 'Funcionalidad'): FormalGeneratedCase[]` |
### UseCaseInput

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| actor | `actor: string` |
| happyPathSteps | `happyPathSteps: string[]` |
| alternativeFlows | `alternativeFlows: { name: string; condition: string; steps: string[] }[]` |
| exceptionFlows | `exceptionFlows: { name: string; trigger: string; steps: string[]; expectedError: string }[]` |
### UseCaseEngine

| Miembro | Declaración |
|---|---|
| generate | `generate(uc: UseCaseInput): FormalGeneratedCase[]` |

## backend/src/core/test-design/gherkin-compiler.ts

### GherkinScenarioBlock

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| given | `given: string[]` |
| when | `when: string[]` |
| then | `then: string[]` |
| typeHint | `typeHint: ScenarioType \| null` |
| rawText | `rawText: string` |
### CompiledScenarioCase

| Miembro | Declaración |
|---|---|
| title | `title: string` |
| type | `type: ScenarioType` |
| preconditions | `preconditions: string[]` |
| steps | `steps: string[]` |
| expectedResult | `expectedResult: string` |
| evidenceText | `evidenceText: string` |
### GherkinFormatScenario

| Miembro | Declaración |
|---|---|
| name | `name: string` |
| type | `type: ScenarioType` |
| given | `given: string[]` |
| when | `when: string[]` |
| then | `then: string[]` |
### GherkinCompiler

| Miembro | Declaración |
|---|---|
| SCENARIO_REGEX | `SCENARIO_REGEX: tipo inferido` |
| GIVEN_REGEX | `GIVEN_REGEX: tipo inferido` |
| WHEN_REGEX | `WHEN_REGEX: tipo inferido` |
| THEN_REGEX | `THEN_REGEX: tipo inferido` |
| AND_REGEX | `AND_REGEX: tipo inferido` |
| TYPE_COMMENT_REGEX | `TYPE_COMMENT_REGEX: tipo inferido` |
| parse | `parse(text: string, fallbackName = 'Escenario principal'): GherkinScenarioBlock[]` |
| inferType | `inferType(block: GherkinScenarioBlock): ScenarioType` |
| compile | `compile(text: string, options: { titlePrefix?: string; fallbackName?: string } = {}): CompiledScenarioCase[]` |
| format | `format(scenarios: GherkinFormatScenario[]): string` |
| sentence | `sentence(fragment: string): string` |

## backend/src/core/test-design/requirements-quality-gate.ts

### AmbiguityMatch

| Miembro | Declaración |
|---|---|
| term | `term: string` |
| category | `category: 'subjective_adjective' \| 'vague_adverb' \| 'open_clause' \| 'non_verifiable'` |
| suggestion | `suggestion: string` |
| foundIn | `foundIn: 'title' \| 'description' \| 'acceptanceCriteria'` |
### QualityGateEvaluation

| Miembro | Declaración |
|---|---|
| testabilityScore | `testabilityScore: number` |
| testabilityLevel | `testabilityLevel: 'EXCELLENT' \| 'GOOD' \| 'NEEDS_IMPROVEMENT' \| 'POOR'` |
| recommendedTechnique | `recommendedTechnique: {
    key: 'BVA' \| 'DECISION_TABLE' \| 'STATE_TRANSITION' \| 'EQUIVALENCE_PARTITIONING' \| 'TEMPLATE';
    name: string;
    rationale: string;
  }` |
| syntaxAnalysis | `syntaxAnalysis: {
    hasActor: boolean;
    hasAction: boolean;
    hasOutcome: boolean;
    hasGivenWhenThen: boolean;
    hasQuantitativeCriteria: boolean;
  }` |
| ambiguities | `ambiguities: AmbiguityMatch[]` |
| strengths | `strengths: string[]` |
| improvements | `improvements: string[]` |
### RequirementsQualityGate

| Miembro | Declaración |
|---|---|
| VAGUE_TERMS_CATALOG | `VAGUE_TERMS_CATALOG: Array<{
    regex: RegExp;
    term: string;
    category: AmbiguityMatch['category'];
    suggestion: string;
  }>` |
| evaluate | `evaluate(requirement: {
    title: string;
    description?: string \| null;
    acceptanceCriteria?: string \| null;
  }): QualityGateEvaluation` |
| parseEarsSyntax | `parseEarsSyntax(text: string): {
    pattern: 'UBIQUITOUS' \| 'EVENT_DRIVEN' \| 'STATE_DRIVEN' \| 'UNWANTED_BEHAVIOUR' \| 'OPTIONAL' \| 'NON_EARS';
    clause: string;
    action: string;
  }` |
| compileGherkinToTestCases | `compileGherkinToTestCases(gherkinText: string, reqTitle = 'Requisito'): Array<{
    title: string;
    preconditions: string[];
    steps: string[];
    expectedResult: string;
    type: 'positive' \| 'negative';
  }>` |
| extractDeterministicVariables | `extractDeterministicVariables(text: string): Array<{
    name: string;
    type: 'integer' \| 'decimal' \| 'string_length';
    min: number;
    max: number;
    unit?: string;
  }>` |
| analyzeRfc2119Priority | `analyzeRfc2119Priority(text: string): 'high' \| 'medium' \| 'low'` |
| detectCrossRequirementDependencies | `detectCrossRequirementDependencies(text: string): string[]` |
| transformUserStoryToRoleMatrix | `transformUserStoryToRoleMatrix(userStory: string): Array<{
    role: string;
    isAuthorized: boolean;
    title: string;
    expectedStatus: number;
    description: string;
  }>` |

## backend/src/core/test-design/shared-steps.ts

### SharedStepsEngine

| Miembro | Declaración |
|---|---|
| SHARED_BLOCKS | `SHARED_BLOCKS: Record<string, string[]>` |
| expandSteps | `expandSteps(steps: string[]): string[]` |
| listAvailableSharedSteps | `listAvailableSharedSteps(): Array<{ macro: string; steps: string[] }>` |

## backend/src/core/test-design/synthetic-data.ts

### SyntheticDataEngine

| Miembro | Declaración |
|---|---|
| validateLuhn | `validateLuhn(cardNumber: string): boolean` |
| generateLuhnCard | `generateLuhnCard(brand: 'visa' \| 'mastercard' \| 'amex' \| 'diners' \| 'jcb' = 'visa', isValid = true): { cardNumber: string; brand: string; isValid: boolean; expDate: string; cvv: string }` |
| generateDni | `generateDni(isValid = true): { dni: string; isValid: boolean }` |
| validateRuc | `validateRuc(ruc: string): boolean` |
| generateRuc | `generateRuc(type: 'natural' \| 'juridica' = 'juridica', isValid = true): { ruc: string; type: string; isValid: boolean; description: string }` |
| validateRutChile | `validateRutChile(rut: string): boolean` |
| generateRutChile | `generateRutChile(isValid = true): { rut: string; isValid: boolean }` |
| generateRfcMexico | `generateRfcMexico(type: 'fisica' \| 'moral' = 'moral', isValid = true): { rfc: string; isValid: boolean }` |
| generateCurpMexico | `generateCurpMexico(isValid = true): { curp: string; isValid: boolean }` |
| validateCuitArgentina | `validateCuitArgentina(cuit: string): boolean` |
| generateCuitArgentina | `generateCuitArgentina(isValid = true): { cuit: string; isValid: boolean }` |
| validateNifSpain | `validateNifSpain(nif: string): boolean` |
| generateNifSpain | `generateNifSpain(isValid = true): { nif: string; isValid: boolean }` |
| getCriticalBoundaryDates | `getCriticalBoundaryDates(): Record<string, { label: string; value: string; type: string; description: string }>` |
| getPassiveSecurityPayloads | `getPassiveSecurityPayloads(): Record<string, { label: string; payload: string; category: string; description: string }>` |
| getBoundaryDataSet | `getBoundaryDataSet(maxLength = 255): Record<string, { label: string; value: string; type: string; purpose: string }>` |
| getBoundaryGeoCoordinates | `getBoundaryGeoCoordinates(): Record<string, { label: string; lat: number; lng: number; isValid: boolean; description: string }>` |
| getSyntheticFiles | `getSyntheticFiles(): Record<string, { filename: string; mimeType: string; sizeBytes: number; base64: string; purpose: string }>` |
| getNetworkData | `getNetworkData(): Record<string, { label: string; value: string; family: 'IPv4' \| 'IPv6'; type: string; purpose: string }>` |
| getSyntheticEmail | `getSyntheticEmail(isValid = true): string` |

## backend/src/core/validation/ai-output.validator.ts

### validateAIResponse

`export function validateAIResponse(jsonText: string): ValidatedAIOutput`


## backend/src/infrastructure/importers/openapi-importer.service.ts

### OpenApiEndpointCase

| Miembro | Declaración |
|---|---|
| endpoint | `endpoint: string` |
| method | `method: string` |
| summary | `summary: string` |
| expectedStatus | `expectedStatus: string` |
| title | `title: string` |
| type | `type: 'positive' \| 'negative' \| 'boundary'` |
### OpenApiImporterService

| Miembro | Declaración |
|---|---|
| importOpenApiSpec | `importOpenApiSpec(projectId: string, openApiJson: Record<string, unknown>): retorno inferido` |

## backend/src/infrastructure/repositories/prisma-project.repository.ts

### PrismaProjectRepository

| Miembro | Declaración |
|---|---|
| findById | `findById(id: string): Promise<ProjectEntity \| null>` |
| findByOwner | `findByOwner(ownerId: string, options?: PaginationOptions): Promise<PaginatedResult<ProjectEntity>>` |
| create | `create(project: ProjectEntity): Promise<ProjectEntity>` |
| update | `update(id: string, data: Partial<ProjectEntity>): Promise<ProjectEntity>` |
| archive | `archive(id: string): Promise<boolean>` |
| delete | `delete(id: string): Promise<boolean>` |

## backend/src/infrastructure/repositories/prisma-requirement.repository.ts

### PrismaRequirementRepository

| Miembro | Declaración |
|---|---|
| findById | `findById(id: string): Promise<RequirementEntity \| null>` |
| findByProjectId | `findByProjectId(projectId: string, options?: PaginationOptions, statusFilter?: string): Promise<PaginatedResult<RequirementEntity>>` |
| save | `save(requirement: RequirementEntity): Promise<void>` |
| createVersion | `createVersion(requirementId: string, authorId: string, summary: string): Promise<number>` |
| delete | `delete(id: string): Promise<boolean>` |

## backend/src/infrastructure/repositories/prisma-test-case.repository.ts

### PrismaTestCaseRepository

| Miembro | Declaración |
|---|---|
| reviewsInclude | `reviewsInclude: tipo inferido` |
| findById | `findById(id: string): Promise<TestCaseEntity \| null>` |
| findByRequirementId | `findByRequirementId(requirementId: string): Promise<TestCaseEntity[]>` |
| findByProjectId | `findByProjectId(projectId: string, options?: PaginationOptions): Promise<PaginatedResult<TestCaseEntity>>` |
| save | `save(testCase: TestCaseEntity): Promise<void>` |
| saveBatch | `saveBatch(testCases: TestCaseEntity[]): Promise<void>` |
| delete | `delete(id: string): Promise<boolean>` |

## backend/src/infrastructure/repositories/prisma-test-run.repository.ts

### PrismaTestRunRepository

| Miembro | Declaración |
|---|---|
| findById | `findById(id: string): Promise<TestRunEntity \| null>` |
| findByProjectId | `findByProjectId(projectId: string): Promise<TestRunEntity[]>` |
| create | `create(run: TestRunEntity, initialCases: Array<{ testCaseId: string; code: string; title: string }>): Promise<TestRunEntity>` |
| recordExecution | `recordExecution(runId: string, caseId: string, status: string, durationSeconds: number, evidenceText?: string, executedBy?: string): Promise<TestExecutionResultProps>` |
| logDefect | `logDefect(runId: string, caseId: string, defectNotes: string): Promise<TestExecutionResultProps>` |

## backend/src/infrastructure/webhooks/webhook.service.ts

### WebhookEventPayload

| Miembro | Declaración |
|---|---|
| event | `event: 'REQUIREMENT_APPROVED_100' \| 'TEST_RUN_COMPLETED' \| 'DEFECT_LOGGED'` |
| projectId | `projectId: string` |
| projectName | `projectName: string` |
| summary | `summary: string` |
| details | `details: Record<string, unknown>` |
| timestamp | `timestamp: string` |
### OutgoingWebhookService

| Miembro | Declaración |
|---|---|
| isSafeUrl | `isSafeUrl(targetUrl: string): boolean` |
| dispatch | `dispatch(url: string, payload: WebhookEventPayload): Promise<boolean>` |

## backend/src/modules/export/export.service.ts

### ExportTestCase

| Miembro | Declaración |
|---|---|
| code | `code: string` |
| type | `type: string` |
| title | `title: string` |
| preconditions | `preconditions: unknown` |
| steps | `steps: unknown` |
| testData | `testData: string \| null` |
| expectedResult | `expectedResult: string` |
| priority | `priority: string` |
| evidenceStatus | `evidenceStatus: string` |
| evidenceText | `evidenceText: string \| null` |
| status | `status: string` |
| version | `version: number` |
| requirementVersion | `requirementVersion: number` |
### ExportRequirement

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| code | `code: string` |
| title | `title: string` |
| description | `description: string` |
| acceptanceCriteria | `acceptanceCriteria: string` |
| version | `version: number` |
| testCases | `testCases: ExportTestCase[]` |
### ExportProject

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| name | `name: string` |
| description | `description: string \| null` |
| requirements | `requirements: ExportRequirement[]` |
### parseArray

`function parseArray(val: unknown): string[]`

### calculateSuiteSha256

`export function calculateSuiteSha256(project: ExportProject): string`

### buildCsv

`export function buildCsv(project: ExportProject): string`

### buildMarkdown

`export function buildMarkdown(project: ExportProject): string`

### buildJson

`export function buildJson(project: ExportProject)`

### buildGherkin

`export function buildGherkin(project: ExportProject): string`

### buildXrayJson

`export function buildXrayJson(project: ExportProject)`

### buildTestRailCsv

`export function buildTestRailCsv(project: ExportProject): string`

### buildIEEE829TestPlan

`export function buildIEEE829TestPlan(project: ExportProject): string`

### buildReportHtml

`export function buildReportHtml(project: ExportProject): string`

### safeFilename

`export function safeFilename(name: string): string`


## backend/src/modules/metrics/metrics.service.ts

### TestCaseMetricInput

| Miembro | Declaración |
|---|---|
| status | `status: string` |
| evidenceStatus | `evidenceStatus: string` |
| type | `type: string` |
| source | `source: string` |
| isObsolete | `isObsolete: boolean` |
### AiGenerationMetricInput

| Miembro | Declaración |
|---|---|
| inputTokens | `inputTokens: number` |
| outputTokens | `outputTokens: number` |
| estimatedCost | `estimatedCost: number \| null` |
| responseTimeMs | `responseTimeMs: number` |
| status | `status: string` |
| requirementId | `requirementId: string` |
### RequirementMetricInput

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| status | `status: string` |
| testCases | `testCases: TestCaseMetricInput[]` |
| aiGenerations | `aiGenerations: AiGenerationMetricInput[]` |
### ProjectMetricInput

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| name | `name: string` |
| requirements | `requirements: RequirementMetricInput[]` |
### computeProjectMetrics

`export function computeProjectMetrics(project: ProjectMetricInput)`


## backend/src/modules/requirements/ambiguity-detector.ts

### AmbiguityIssue

| Miembro | Declaración |
|---|---|
| rule | `rule: string` |
| category | `category: 'VAGUE_TERM' \| 'UNVERIFIABLE' \| 'COMPOUND' \| 'MISSING_ACTOR'` |
| severity | `severity: 'HIGH' \| 'MEDIUM' \| 'LOW'` |
| snippet | `snippet: string` |
| explanation | `explanation: string` |
| suggestion | `suggestion: string` |
### AmbiguityAnalysisResult

| Miembro | Declaración |
|---|---|
| hasWarnings | `hasWarnings: boolean` |
| warningsCount | `warningsCount: number` |
| issues | `issues: AmbiguityIssue[]` |
### AmbiguityDetector

| Miembro | Declaración |
|---|---|
| VAGUE_TERMS | `VAGUE_TERMS: tipo inferido` |
| analyze | `analyze(description: string, acceptanceCriteria: string): AmbiguityAnalysisResult` |

## backend/src/modules/requirements/import.service.ts

### RowValidationError

| Miembro | Declaración |
|---|---|
| rowNumber | `rowNumber: number` |
| code | `code: string` |
| field | `field: string` |
| message | `message: string` |
### ImportPreviewResult

| Miembro | Declaración |
|---|---|
| totalRows | `totalRows: number` |
| validRows | `validRows: RequirementImportRow[]` |
| errors | `errors: RowValidationError[]` |
| isValid | `isValid: boolean` |
### RequirementImportService

| Miembro | Declaración |
|---|---|
| parseCsv | `parseCsv(csvText: string): string[][]` |
| previewCsv | `previewCsv(csvContent: string): ImportPreviewResult` |
| previewJson | `previewJson(data: unknown[]): ImportPreviewResult` |

## backend/src/modules/test-cases/duplicate-detector.ts

### TestCaseComparable

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| code | `code: string` |
| title | `title: string` |
| steps | `steps: string[] \| string` |
| expectedResult | `expectedResult: string` |
### DuplicateCandidate

| Miembro | Declaración |
|---|---|
| caseCodeA | `caseCodeA: string` |
| caseCodeB | `caseCodeB: string` |
| caseTitleA | `caseTitleA: string` |
| caseTitleB | `caseTitleB: string` |
| similarityScore | `similarityScore: number` |
| reason | `reason: 'EXACT_MATCH' \| 'HIGH_SIMILARITY' \| 'IDENTICAL_STEPS_AND_RESULT'` |
### DuplicateDetector

| Miembro | Declaración |
|---|---|
| normalizeText | `normalizeText(text: string): string` |
| normalizeSteps | `normalizeSteps(steps: string[] \| string): string` |
| calculateSimilarity | `calculateSimilarity(textA: string, textB: string): number` |
| findDuplicates | `findDuplicates(cases: TestCaseComparable[], threshold = 0.85): DuplicateCandidate[]` |

## backend/src/modules/test-runs/test-runs.service.ts

### TestCaseExecutionResult

| Miembro | Declaración |
|---|---|
| testCaseId | `testCaseId: string` |
| code | `code: string` |
| title | `title: string` |
| status | `status: ExecutionStatus` |
| durationSeconds | `durationSeconds: number` |
| executedAt | `executedAt: string \| null` |
| executedBy | `executedBy: string \| null` |
| evidenceText | `evidenceText: string \| null` |
| defectNotes | `defectNotes: string \| null` |
| defectLogged | `defectLogged: boolean` |
### TestRun

| Miembro | Declaración |
|---|---|
| id | `id: string` |
| projectId | `projectId: string` |
| name | `name: string` |
| environment | `environment: string` |
| createdAt | `createdAt: string` |
| updatedAt | `updatedAt: string` |
| status | `status: 'IN_PROGRESS' \| 'COMPLETED'` |
| cases | `cases: TestCaseExecutionResult[]` |
### toLegacyTestRun

`function toLegacyTestRun(entity: TestRunEntity): TestRun`

### TestRunsService

| Miembro | Declaración |
|---|---|
| createRun | `createRun(projectId: string, name: string, environment = 'QA Sandbox', caseIds?: string[]): Promise<TestRun>` |
| getRun | `getRun(runId: string): Promise<TestRun>` |
| listRunsByProject | `listRunsByProject(projectId: string): Promise<TestRun[]>` |
| recordExecution | `recordExecution(runId: string, caseId: string, status: ExecutionStatus, durationSeconds = 0, evidenceText?: string, executedBy = 'QA Tester'): Promise<TestCaseExecutionResult>` |
| logDefectFromRun | `logDefectFromRun(runId: string, caseId: string, defectNotes: string, userId: string): retorno inferido` |
| getRunMetrics | `getRunMetrics(runId: string): retorno inferido` |
| compareRuns | `compareRuns(runIdA: string, runIdB: string): retorno inferido` |
