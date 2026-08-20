import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';

describe("HealthController (e2e)", () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it("/health (GET) - deve retornar status ok e estado do banco de dados", async () => {
        const response = await app.inject({
            method: 'GET',
            url: "/health"
        });
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.payload)).toEqual({
            status: "ok",
            database: "up"
        });
    });

    afterAll(async () => {
        await app.close()
    })
});