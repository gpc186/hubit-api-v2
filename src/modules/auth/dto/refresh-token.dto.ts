import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
    @ApiProperty({ description: "Token usado para refrescar o access token", example: "d5a6b7c8-1234-4567-89ab-cdef01234567" })
    @IsString({ message: "O refresh token precisa ser um texto!" })
    @IsNotEmpty({ message: "O refresh token não pode estar vazio!" })

    refreshToken: string
}