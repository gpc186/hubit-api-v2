import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { AuthRepository } from '../auth.repository';

jest.mock('bcrypt');

describe('AuthService - login', () => {
    let authService: AuthService;
    let usersService: jest.Mocked<UsersService>;
    let authRepository: jest.Mocked<AuthRepository>;
    let jwtService: jest.Mocked<JwtService>;

    const mockUser = {
        id: 'user-id-123',
        email: 'desenvolvedor@exemplo.com',
        password: 'hashed_password_123',
        role: Role.CANDIDATE,
        status: 'ACTIVE',
    } as any;

    const loginDto = {
        email: 'desenvolvedor@exemplo.com',
        password: 'senhaCorreta123',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByEmail: jest.fn(),
                    },
                },
                {
                    provide: AuthRepository,
                    useValue: {
                        createRefreshToken: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersService = module.get(UsersService);
        authRepository = module.get(AuthRepository);
        jwtService = module.get(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('deve autenticar o usuário e retornar tokens + dados sem a senha', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        jwtService.signAsync.mockResolvedValue('fake_access_token');
        authRepository.createRefreshToken.mockResolvedValue({} as any);

        const result = await authService.login(loginDto);

        expect(authRepository.createRefreshToken).toHaveBeenCalled();
        expect(result).toHaveProperty('accessToken', 'fake_access_token');
        expect(result).toHaveProperty('refreshToken');
        expect(result.user).not.toHaveProperty('password');
    });

    it('deve lançar UnauthorizedException quando o e-mail não existir', async () => {
        usersService.findByEmail.mockResolvedValue(null);

        await expect(authService.login(loginDto)).rejects.toThrow(
            new UnauthorizedException('Usuario ou senha inválidos!'),
        );
    });

    it('deve lançar UnauthorizedException quando o usuário estiver com status BLOCKED', async () => {
        usersService.findByEmail.mockResolvedValue({ ...mockUser, status: 'BLOCKED' });

        await expect(authService.login(loginDto)).rejects.toThrow(
            new UnauthorizedException('Usuario ou senha inválidos!'),
        );
    });

    it('deve lançar UnauthorizedException quando a senha for incorreta', async () => {
        usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(authService.login(loginDto)).rejects.toThrow(
            new UnauthorizedException('Usuario ou senha inválidos!'),
        );
    });
});