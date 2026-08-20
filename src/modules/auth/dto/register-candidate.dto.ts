import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterCandidateDto {
    @ApiProperty({ description: "Email identificador do candidato", example: "candidato@gmail.com" })
    @IsEmail({}, { message: "O email precisa ser válido!" })
    @IsString({ message: "O email precisa ser um texto!" })
    @IsNotEmpty({ message: "O email é obrigatório!" })
    email: string

    @ApiProperty({ description: "Senha utilizada para logar na conta", example: "Senhaforte123!" })
    @IsString({ message: "A senha precisa ser um texto!" })
    @IsNotEmpty({ message: "A senha é obrigatória!" })
    @MinLength(6, { message: "A senha precisa ter no mínimo 6 caracteres!" })
    password: string

    @ApiProperty({ description: "Nome completo do candidato", example: "Guguinha gameplays" })
    @IsString({ message: "O nome precisa ser um texto!" })
    @IsNotEmpty({ message: "O nome é obrigatório!" })
    fullName: string

    @ApiPropertyOptional({ description: "Headline do perfil do candidato", example: "Estudador de node.js" })
    @IsOptional()
    @IsString({ message: "O headline precisa ser um texto!" })
    headline?: string

    @ApiPropertyOptional({ description: "Bio/descrição do perfil do candidato", example: "Olá! Sou o guguinha gameplays, dev de backend" })
    @IsOptional()
    @IsString({ message: "A bio precisa ser um texto!" })
    bio?: string

    @ApiPropertyOptional({ description: "Localização do candidato, setada por ele mesmo", example: "Xique-xique, Bahia, Brasil" })
    @IsOptional()
    @IsString({ message: "A localização precisa ser um texto!" })
    location?: string
}