import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { AuthRepository } from "./auth.repository";
import { JwtService } from "@nestjs/jwt";
import { Role, User } from "@prisma/client";
import { RegisterCandidateDto } from "./dto/register-candidate.dto";
import * as bcrypt from 'bcrypt';
import { RegisterCompanyDto } from "./dto/register-company.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService, private readonly authRepository: AuthRepository, private readonly jwtService: JwtService) { }

    private async generateTokens(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role }

        const accessToken = await this.jwtService.signAsync(payload);

        const rawRefreshToken = crypto.randomUUID();

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await this.authRepository.createRefreshToken({ token: rawRefreshToken, expiresAt, user: { connect: { id: user.id } } })

        return { accessToken, refreshToken: rawRefreshToken }
    }

    async registerCandidate(dto: RegisterCandidateDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({ email: dto.email, password: hashedPassword, role: Role.CANDIDATE, candidateProfile: { create: { fullName: dto.fullName, headline: dto.headline, bio: dto.bio, location: dto.location } } })

        const { accessToken, refreshToken } = await this.generateTokens(user);

        const { password: _, ...safeUser } = user

        return { user: safeUser, accessToken, refreshToken }
    }

    async registerCompany(dto: RegisterCompanyDto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({ email: dto.email, password: hashedPassword, role: Role.COMPANY, companyProfile: { create: { companyName: dto.companyName, cnpj: dto.cnpj, website: dto.website, description: dto.description } } })

        const { accessToken, refreshToken } = await this.generateTokens(user);

        const { password: _, ...safeUser } = user

        return { user: safeUser, accessToken, refreshToken }
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user || user.status === "BLOCKED") {
            throw new UnauthorizedException("Usuario ou senha inválidos!")
        }

        const correctPassword = await bcrypt.compare(dto.password, user.password);

        if (!correctPassword) {
            throw new UnauthorizedException("Usuario ou senha inválidos!")
        }

        const { accessToken, refreshToken } = await this.generateTokens(user);

        const { password: _, ...safeUser } = user

        return { user: safeUser, accessToken, refreshToken }
    }

    async refreshToken(dto: RefreshTokenDto) {
        const session = await this.authRepository.findByRefreshToken(dto.refreshToken);

        if (!session || session.revokedAt !== null || new Date() > session.expiresAt) {
            throw new UnauthorizedException("Sessão expirada ou inválida, faça login novamente!")
        }

        await this.authRepository.revokeRefreshToken(session.id);

        return this.generateTokens(session.user)
    }

    async logout(dto: RefreshTokenDto) {
        const session = await this.authRepository.findByRefreshToken(dto.refreshToken);

        if (session) {
            await this.authRepository.revokeRefreshToken(session.id);
        }

        return { message: "logout realizado com sucesso!" }
    }
}