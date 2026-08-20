import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Prisma, RefreshToken, User } from '@prisma/client';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
        return this.prisma.refreshToken.create({
            data,
        });
    }

    async findByRefreshToken(token: string): Promise<RefreshToken & { user: User } | null> {
        return this.prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true }
        })
    }

    async revokeRefreshToken(id: string): Promise<RefreshToken> {
        return this.prisma.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() }
        })
    }
}