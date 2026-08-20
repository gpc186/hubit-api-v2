import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ description: "Email identificador da conta para login", example: "guguinha@gmail.com" })
    @IsEmail({}, { message: "O email precisa ser válido!" })
    @IsNotEmpty({ message: "O email é obrigatório!" })
    email: string

    @ApiProperty({ description: "Senha utilizada para logar", example: "Guguinha!123" })
    @IsString({ message: "A senha precisa ser um texto!" })
    @IsNotEmpty({ message: "A senha é obrigatória!" })
    @MinLength(6, { message: "A senha precisa ter ao menos 6 caracteres!" })
    password: string
}