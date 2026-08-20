import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { Prisma, User } from "@prisma/client";

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async findByEmail(email: string): Promise<User | null>{
        const user = await this.usersRepository.findByEmail(email);
        return user;
    }

    async findById(id: string): Promise<User | null>{
        const user = await this.usersRepository.findById(id);
        if(!user){
            throw new NotFoundException("Usuário não encontrado!")
        }
        return user;
    }

    async create(data: Prisma.UserCreateInput): Promise<User>{
        const userExists = await this.usersRepository.findByEmail(data.email);
        if(userExists){
            throw new ConflictException("Já existe um usuario cadastrado com esse email!");
        };
        return this.usersRepository.create(data)
    }
}