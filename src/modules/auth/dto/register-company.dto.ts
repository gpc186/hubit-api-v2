import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterCompanyDto {
    @ApiProperty({ description: "Email identificador do candidato", example: "empresa@empresa.com.br" })
    @IsEmail({}, { message: "O email precisa ser válido!" })
    @IsString({ message: "O email precisa ser um texto!" })
    @IsNotEmpty({ message: "O email é obrigatório!" })
    email: string

    @ApiProperty({ description: "Senha utilizada para logar na conta", example: "Senhaforte123!" })
    @IsString({ message: "A senha precisa ser um texto!" })
    @IsNotEmpty({ message: "A senha é obrigatória!" })
    @MinLength(6, { message: "A senha precisa ter no mínimo 6 caracteres!" })
    password: string

    @ApiProperty({ description: "Nome fantasia da empresa", example: "Guguinha Inc." })
    @IsString({ message: "O nome precisa ser um texto!" })
    @IsNotEmpty({ message: "O nome é obrigatório!" })
    companyName: string

    @ApiProperty({ description: "CNPJ da empresa", example: "05546918000154" })
    @IsString({ message: "O CNPJ precisa ser um texto!" })
    @IsNotEmpty({ message: "O CNPJ é obrigatório!" })
    cnpj: string

    @ApiPropertyOptional({ description: "Url para o site da empresa, ou algum link para identificar a empresa", example: "https://adidas.com.br" })
    @IsOptional()
    @IsString({ message: "O link precisa ser um texto!" })
    website?: string

    @ApiPropertyOptional({ description: "Descrição/bio da empresa", example: "Nós somos a guguinha Inc. E queremos oferecer serviço de qualidade!" })
    @IsOptional()
    @IsString({ message: "A descrição precisa ser um texto!" })
    description?: string
}