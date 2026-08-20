import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';


@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string): Promise<User | null>{
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                candidateProfile: true,
                companyProfile: true
            }
        });
    };

    async create(data: Prisma.UserCreateInput): Promise<User>{
        return this.prisma.user.create({
            data
        })
    }
}