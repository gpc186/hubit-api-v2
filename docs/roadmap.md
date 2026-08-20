Roadmap Arquitetural e Guia Prático de Aprendizado Backend: HubIT API com NestJS, TypeScript, Prisma e TDDO objetivo deste roadmap é guiar o desenvolvimento do projeto HubIT API através de uma abordagem orientada à prática (hands-on) e baseada em testes (TDD). Em vez de fornecer o código final completo de cada funcionalidade, este guia apresenta os conceitos-chave, as ferramentas do ecossistema, os padrões de projeto e exemplos minimalistas de sintaxe. Com essa estrutura, você compreenderá o que ocorre sob o capô do NestJS e TypeScript enquanto implementa os requisitos do sistema por conta própria.Estrutura de Arquitetura e Módulos do SistemaA aplicação adota o padrão de monólito modular organizado por domínios de negócio. A separação clara entre camada de transporte (HTTP Fastify), regras de negócio (Services) e acesso a dados (Repositories/Prisma) garante facilidade de testes e baixa acoplabilidade.hubit-api/src/main.ts (Bootstrap do servidor HTTP Fastify)worker.ts (Bootstrap do worker isolado BullMQ)app.module.ts (Módulo raiz da aplicação)common/ (Abstrações globais reutilizáveis)decorators/ (Decoradores de parâmetro e rota)filters/ (Tratamento global de exceções)guards/ (Controle de acesso e autorização)interceptors/ (Transformação de resposta e métricas)pipes/ (Validação e sanitização de dados)infra/ (Clientes de banco de dados, cache e filas)prisma/ (Cliente e serviço Prisma ORM)queue/ (Conexão e abstração Redis/BullMQ)modules/ (Domínios do sistema: auth, users, candidates, companies, jobs, applications, integrations, matching, notifications)prisma/schema.prisma (Declaração de modelos e relacionamentos)seed.ts (Carga inicial de dados para desenvolvimento)test/ (Suítes de testes unitários e e2e)docker-compose.yml (Infraestrutura local PostgreSQL e Redis)Milestone 0: Fundação de Infraestrutura Local e Bootstrap do Ecossistema1. Fundamentos da Etapa: O Motor NestJS, Fastify Adapter e IoC ContainerO que muda do Express para o NestJS?No Express tradicional, o fluxo é imperativo: você cria instâncias manualmente, encadeia middlewares no objeto req/res e exporta rotas soltas. No NestJS, a arquitetura é declarativa e orientada a objetos.Inversão de Controle (IoC) e Injeção de Dependência (DI): Você não faz const service = new Service(). O container de IoC do NestJS gerencia a instanciação e o ciclo de vida das classes.Fastify Adapter: O NestJS abstrai o motor HTTP. Ao usar @nestjs/platform-fastify, o servidor substitui o Express pelo Fastify, que utiliza uma árvore Radix para roteamento e compilação de JSON schemas, resultando em maior vazão de requisições.DimensãoExpress TradicionalNestJS (Fastify Adapter)InstanciaçãoManual (new Service())Automatizada pelo container IoCRoteamentoMiddleware imperativoDecoradores e Controllers compiladosTipagem e MetadadosTipagem runtime simplesMetadados via reflect-metadata em tempo de transpilaçãoComo o TypeScript funciona por baixo dos panos (reflect-metadata)Quando você habilita emitDecoratorMetadata no tsconfig.json e usa @Injectable(), o compilador do TypeScript converte os tipos dos parâmetros do construtor em metadados invocando Reflect.metadata('design:paramtypes', [...]) no JavaScript transpilado. Em tempo de execução, o NestJS lê esses metadados para saber exatamente quais instâncias precisa injetar na classe.2. Configuração Pronta: Docker Compose e Prisma Service(Instalações e configurações base fixas do ambiente local)YAML# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: hubit_postgres
    environment:
      POSTGRES_USER: hubit_user
      POSTGRES_PASSWORD: hubit_password
      POSTGRES_DB: hubit_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: hubit_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
TypeScript// src/infra/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
TypeScript// src/main.ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.enableShutdownHooks();
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
3. Exemplo Prático de TDD: Rota de HealthcheckFluxo Red -> Green -> RefactorRed: Escreva o teste solicitando GET /health. O teste falhará porque o controller não existe.Green: Crie a rota mínima que retorna { status: 'ok' } e executa um SELECT 1 via Prisma.Refactor: Organize as injeções de dependência no AppModule.TypeScript// Exemplo didático de teste E2E com Fastify Supertest/Inject
it('GET /health deve responder 200 OK e status da infra', async () => {
  const response = await app.inject({ method: 'GET', url: '/health' });
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.payload)).toHaveProperty('status', 'ok');
});
4. Curadoria de Fontes (Milestone 0)Documentação NestJS - Fastify Adapter: https://docs.nestjs.com/techniques/performanceDocumentação Prisma ORM - Getting Started: https://www.prisma.io/docs/ormArtigo sobre reflect-metadata e TypeScript Decorators: https://dev.to/tejastn10/deep-dive-into-nestjs-decorators-internals-usage-and-custom-implementations-4ehaMilestone 1: Autenticação, Gestão de Usuários e Segurança (Auth & Users)1. Fundamentos da Etapa: DTOs, ValidationPipe e GuardsDTOs com Classes vs InterfacesEm TypeScript, interface desaparece completamente após a compilação em JavaScript. Se você criar um DTO como interface, o NestJS não terá metadados em tempo de execução para validar os dados recebidos. Portanto, DTOs devem ser sempre Classes. As classes continuam existindo no JavaScript gerado, permitindo que decoradores do class-validator operem normalmente.O ciclo de um Guard (CanActivate)O Guard no NestJS é responsável pela autorização. Ele intercepta a requisição antes dos Controllers e Pipes. Diferente dos middlewares do Express, o Guard tem acesso ao ExecutionContext, permitindo ler metadados do método e da classe acionada. Se canActivate() retornar false ou disparar exceção, o NestJS interrompe a execução com erro HTTP 403/401 automaticamente.2. Ferramenta de Modelagem: Relacionamento 1:N no PrismaNo Prisma, para criar um relacionamento de um para muitos (ex: Um Usuário para muitos Refresh Tokens), declara-se a relação nos dois lados do schema.Snippet de código// Exemplo demonstrativo de sintaxe Prisma 1:N
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  refreshTokens RefreshToken[] // Lado 1 da relação
  createdAt     DateTime       @default(now())
}

model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade) // Lado N da relação
}
Uso Prático do Prisma StudioExecute npx prisma studio no terminal para abrir o painel em http://localhost:5555. Utilize-o para criar usuários de teste, validar se as senhas estão salvando como hash do bcrypt e verificar o vínculo de chave estrangeira userId.3. Aprendizado Prático TDD e Desafio do MóduloPadrão de Teste Unitário para Serviços de AutenticaçãoAo testar regras de negócio, utilize Mocks das dependências (ex: Repositório e JwtService) para não depender de banco de dados real nos testes unitários.TypeScript// Modelo de Teste Unitário com Mocks no Jest
describe('AuthService - Login', () => {
  it('deve disparar UnauthorizedException quando a senha for incorreta', async () => {
    // 1. Arrange: Configurar Mocks para retornar usuário, mas com senha divergente
    // 2. Act & Assert: Chamar serviço e esperar rejeição por exceção HTTP
  });
});
Sua Vez: O que você deve implementar[ ] Criar o DTO RegisterUserDto e LoginDto utilizando class-validator (@IsEmail, @MinLength).[ ] Implementar a tabela users e refresh_tokens no schema.prisma.[ ] Criar o AuthService com métodos para hash de senha (bcrypt), geração de JWT e validação de credenciais.[ ] Criar o JwtAuthGuard estendendo @nestjs/passport para proteger rotas autenticadas.[ ] Implementar o fluxo de rotação de Refresh Token (invalidar o antigo ao gerar um novo).4. Curadoria de Fontes (Milestone 1)Documentação NestJS - Authentication: https://docs.nestjs.com/security/authenticationDocumentação NestJS - ValidationPipe e DTOs: https://docs.nestjs.com/pipes#class-validatorMilestone 2: Perfis Profissionais e Validação Empresarial (Candidates & Companies)1. Fundamentos da Etapa: Custom Param DecoratorsExtraindo dados da requisição sem acoplar o ControllerNo Express, era comum acessar req.user manualmente dentro da rota. No NestJS, criamos Custom Decorators para extrair dados limpos diretamente dos parâmetros do método.A função createParamDecorator recebe (data, ctx: ExecutionContext). Através do ExecutionContext, ela acessa o objeto de requisição (seja Express ou Fastify) e retorna a propriedade desejada.TypeScript// Exemplo genérico de Custom Decorator para extrair o Usuário Autenticado
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user; // Permite usar @CurrentUser() ou @CurrentUser('id')
  },
);
2. Ferramenta de Modelagem: Relacionamento 1:1 no PrismaDiferente do relacionamento 1:N, no relacionamento 1:1 o campo da chave estrangeira deve possuir o atributo @unique.Snippet de código// Exemplo demonstrativo de sintaxe Prisma 1:1 (User <-> CandidateProfile)
model User {
  id               String            @id @default(uuid())
  candidateProfile CandidateProfile? // Lado opcional do relacionamento
}

model CandidateProfile {
  id     String @id @default(uuid())
  userId String @unique // @unique garante a restrição 1:1 no banco de dados
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
3. Aprendizado Prático TDD e Desafio do MóduloPadrão de Teste para Guard de Autorização por Role/StatusNesta etapa, o TDD deve garantir que empresas com status PENDING não consigam realizar ações restritas (como cadastrar vagas).TypeScript// Modelo de Teste de Integração / E2E para Bloqueio de Perfil Pendente
it('deve recusar acesso (403 Forbidden) caso a empresa não esteja aprovada', async () => {
  // Executa requisição com token de empresa PENDING e espera status 403
});
Sua Vez: O que você deve implementar[ ] Definir os modelos CandidateProfile, CompanyProfile e CompanyVerification no schema.prisma.[ ] Criar o decorador @CurrentUser() em common/decorators/current-user.decorator.ts.[ ] Criar o Guard VerifiedCompanyGuard para validar se a empresa possui status VERIFIED.[ ] Implementar a rota de aprovação/rejeição de empresas acessível apenas por administradores (ADMIN).[ ] Usar o Prisma Studio para alterar o status de uma empresa manualmente durante os testes.4. Curadoria de Fontes (Milestone 2)Documentação NestJS - Custom Decorators: https://docs.nestjs.com/custom-decoratorsDocumentação Prisma - Relacionamentos 1:1: https://www.prisma.io/docs/concepts/components/prisma-schema/relations/one-to-one-relationsMilestone 3: Vagas, Currículos e Candidaturas (Jobs, Resumes & Applications)1. Fundamentos da Etapa: Interceptors e Transações no PrismaProgramação Orientada a Aspectos (AOP) com InterceptorsInterceptors implementam a interface NestInterceptor e utilizam RxJS Observables. Eles envelopam o ciclo de execução do manipulador da rota, permitindo:Executar lógicas extras antes e depois da execução do método.Transformar a resposta retornada pelo Controller.Tratar ou substituir exceções lançadas.TypeScript// Exemplo didático de Interceptor para Padronizar Respostas HTTP
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
O Padrão Snapshot em CandidaturasAo se candidatar, o candidato não deve ter a candidatura alterada se atualizar seu currículo no futuro. Por isso, a candidatura armazena uma cópia imutável (Snapshot) do currículo como objeto JSON no banco de dados.2. Ferramenta de Modelagem: Chaves Compostas e Constraint @uniquePara evitar que um candidato aplique duas vezes para a mesma vaga, utiliza-se a restrição @unique composta no Prisma.Snippet de códigomodel Application {
  id             String   @id @default(uuid())
  jobId          String
  candidateId    String
  resumeSnapshot Json     // Guarda a cópia do currículo no momento do envio
  createdAt      DateTime @default(now())

  @@unique([jobId, candidateId]) // Garante unicidade do par (jobId + candidateId)
}
3. Aprendizado Prático TDD e Desafio do MóduloTestando Concorrência e ConflitosO teste deve validar a captura do erro de duplicidade e o lançamento do ConflictException (HTTP 409) do NestJS.Sua Vez: O que você deve implementar[ ] Criar os modelos Job, Resume e Application no Prisma.[ ] Criar o TransformInterceptor para estruturar o formato padrão dos retornos JSON.[ ] Implementar o serviço de candidaturas envelopando a verificação e a gravação dentro de uma transação do Prisma (prisma.$transaction).[ ] Escrever o teste unitário no Jest garantindo que aplicar para a mesma vaga duas vezes retorne erro de conflito.4. Curadoria de Fontes (Milestone 3)Documentação NestJS - Interceptors: https://docs.nestjs.com/interceptorsDocumentação Prisma - Interactive Transactions: https://www.prisma.io/docs/orm/prisma-client/queries/transactionsMilestone 4: Arquitetura Assíncrona com Redis, BullMQ e Workers Isolados1. Fundamentos da Etapa: Processamento Assíncrono vs Servidor HTTPPor que separar a API do Worker?Operações pesadas (envio de e-mail, geração de PDFs, sincronização externa) travam o Event Loop da API se executadas de forma síncrona.Ao adotar o BullMQ, o servidor HTTP publica apenas uma mensagem leve (Job) na fila do Redis e responde imediatamente ao usuário com status 202 Accepted. Um processo Node.js totalmente isolado (Worker) consome esses trabalhos em segundo plano sem impactar a API.Ponto de Entrada do Worker no NestJSUm Worker não precisa abrir portas HTTP ou carregar o adaptador Fastify. Ele é inicializado criando um Application Context do NestJS:TypeScript// Exemplo genérico de bootstrap para um Worker isolado (src/worker.ts)
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();
  console.log('Worker escutando tarefas do Redis...');
}
bootstrap();
2. Padrão Prático: Definindo um Processador do BullMQTypeScript// Exemplo de classe Processadora de Filas no NestJS
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    // Executa a lógica pesada de envio de e-mail usando job.data
    console.log(`Processando job: ${job.name} com dados:`, job.data);
  }
}
3. Aprendizado Prático TDD e Desafio do MóduloTestando Disparo de Jobs com MocksAo testar serviços que disparam tarefas assíncronas, você não executa o Redis nos testes unitários. Você testa se o método .add() da fila foi chamado com os argumentos corretos.Sua Vez: O que você deve implementar[ ] Configurar a conexão do Redis no @nestjs/bullmq.[ ] Criar o módulo NotificationsModule e configurar uma fila chamada notifications.[ ] Alterar o ApplicationsService para disparar um Job na fila sempre que uma candidatura for criada.[ ] Criar o arquivo src/worker.ts e o WorkerModule para rodar o processamento isoladamente.[ ] Rodar o worker via terminal (npx ts-node src/worker.ts) e observar o log ao criar uma candidatura.4. Curadoria de Fontes (Milestone 4)Documentação NestJS - BullMQ: https://docs.nestjs.com/techniques/queuesRepositório e Documentação BullMQ: https://docs.bullmq.io/Milestone 5: Integrações Externas, Mocks/Stubs e Motor de Evidências Técnicas1. Fundamentos da Etapa: Inversão de Dependência e Custom ProvidersComo testar integrações com APIs de terceiros sem depender da rede?Para evitar falhas nos testes devido a rate limits ou indisponibilidade de APIs externas (GitHub, Codewars), utiliza-se o princípio da Inversão de Dependência (DIP).Cria-se uma Interface TypeScript com os métodos da integração.Cria-se uma classe de Mock/Stub que implementa essa interface retornando dados estáticos na memória.Cria-se a classe Real que faz requisições HTTP reais usando @nestjs/axios.Utiliza-se um Custom Provider para injetar a implementação adequada dependendo do ambiente.TypeScript// Exemplo didático de injeção dinâmica por Custom Provider
{
  provide: 'IGitHubProvider',
  useClass: process.env.USE_MOCKS === 'true' ? MockGitHubProvider : RealGitHubProvider,
}
2. Ferramenta de Modelagem: Tabela de Evidências Genéricas no PrismaO modelo armazena metadados dinâmicos vindos de fontes distintas utilizando o tipo Json no PostgreSQL.Snippet de códigoenum EvidenceSource {
  GITHUB
  CODEWARS
}

model Evidence {
  id          String         @id @default(uuid())
  candidateId String
  source      EvidenceSource
  title       String
  url         String
  metadata    Json           // Armazena stars, linguagens, pontos, etc.
  capturedAt  DateTime       @default(now())
}
3. Aprendizado Prático TDD e Desafio do MóduloEscrevendo o Teste com o Provider de MockCom a Inversão de Dependência, sua suíte de testes do Jest roda em milissegundos sem realizar nenhuma chamada HTTP externa.Sua Vez: O que você deve implementar[ ] Definir os modelos ExternalAccount, ExternalSync e Evidence no Prisma.[ ] Criar a interface IGitHubProvider e implementar a classe MockGitHubProvider.[ ] Criar o serviço que normaliza repositórios do GitHub e grava registros na tabela Evidence.[ ] Escrever testes unitários validando a normalização de dados usando o Mock.[ ] Implementar a classe GitHubHttpProvider com @nestjs/axios para realizar a comunicação real com a API do GitHub.4. Curadoria de Fontes (Milestone 5)Documentação NestJS - Custom Providers: https://docs.nestjs.com/fundamentals/custom-providersDocumentação NestJS - HTTP Module (Axios): https://docs.nestjs.com/techniques/http-moduleMilestone 6: Algoritmo de Matching e Recomendações de Vagas1. Fundamentos da Etapa: Relacionamentos N:M Explícitos e Cache com RedisPor que criar tabelas N:M explícitas?No Prisma, relacionamentos N:M podem ser implícitos. Porém, quando você precisa armazenar dados extras na relação (ex: se a skill na vaga é obrigatória, ou os anos de experiência do candidato naquela skill), é necessário criar uma Tabela de Junção Explícita.Estrutura no Prisma (Relacionamento N:M Explícito)Snippet de códigomodel Skill {
  id              String           @id @default(uuid())
  name            String           @unique
  candidateSkills CandidateSkill[]
  jobSkills       JobSkill[]
}

model CandidateSkill {
  candidateId String
  skillId     String
  yearsOfExp  Int              @default(0) // Dado extra na relação

  candidate   CandidateProfile @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  skill       Skill            @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([candidateId, skillId]) // Chave primária composta
}

model JobSkill {
  jobId       String
  skillId     String
  isMandatory Boolean @default(true) // Dado extra na relação

  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  skill       Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([jobId, skillId])
}
2. Padrão Prático: Motor de Cálculo com Caching no RedisO cálculo de match é uma função pura que computa o percentual de compatibilidade. O resultado é armazenado no Redis para evitar recalcular o score em todas as listagens.TypeScript// Padrão de leitura com Cache-Aside no Redis
async getMatchScore(jobId: string, candidateId: string) {
  const cacheKey = `match:${jobId}:${candidateId}`;
  const cached = await this.redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);

  const score = this.calculateLogic(...); // Executa o cálculo matemático
  await this.redis.set(cacheKey, JSON.stringify(score), 'EX', 1800); // Salva com TTL de 30 minutos
  return score;
}
3. Aprendizado Prático TDD e Desafio do MóduloTestando Funções Puras de MatchingComo o cálculo matemático do algoritmo é isolado, você deve criar testes unitários exaustivos cobrindo múltiplos cenários (ex: 100% de match, 0% de match, match parcial com bonificação por evidência do GitHub).Sua Vez: O que você deve implementar[ ] Definir as tabelas Skill, CandidateSkill e JobSkill no Prisma.[ ] Implementar a classe MatchingService com o método calculateScore(job, candidate).[ ] Adicionar bonificação na nota se o candidato possuir a skill confirmada por uma Evidence do GitHub/Codewars.[ ] Integrar o cliente Redis do NestJS para realizar o cache do resultado com tempo de expiração (TTL).4. Curadoria de Fontes (Milestone 6)Documentação Prisma - Relacionamentos Muitos-para-Muitos: https://www.prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relationsDocumentação Redis - Padrões de Caching: https://redis.io/docs/manual/client-side-caching/Guia de Comandos para Desenvolvimento LocalA tabela a seguir consolida os comandos indispensáveis para a operação local durante a construção do projeto.OperaçãoComando TerminalFinalidadeInfraestruturadocker compose up -dSobe PostgreSQL e Redis nos containers locais.Prisma ORMnpx prisma db pushAplica o schema diretamente no banco local de desenvolvimento.Prisma ORMnpx prisma studioAbre a interface gráfica em localhost:5555 para inspecionar e editar dados.Testes (TDD)npm run test:watchExecuta o Jest em modo contínuo de observação para apoio ao ciclo Red/Green/Refactor.Testes (E2E)npm run test:e2eRoda testes de integração acionando o adaptador Fastify.Aplicação APInpm run start:devInicia a API NestJS com suporte a hot-reload.Processo Workernpx ts-node src/worker.tsExecuta o processo isolado do BullMQ em segundo plano.A aplicação rigorosa deste roadmap permitirá que você domine o ecossistema NestJS, TypeScript de forma estrita, Prisma e arquiteturas assíncronas no seu próprio ritmo, garantindo o aprendizado prático e profundo.