import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterCandidateDto } from "./dto/register-candidate.dto";
import { RegisterCompanyDto } from "./dto/register-company.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@ApiTags("Auth")
@Controller("auth")     // Prefixo: todas as rotas começam com /auth
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get("me")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Retorna o perfil do usuário logado" })
    async getMe(@CurrentUser() user: any) {
        return user;
    }

    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Realiza o login e retorna os tokens" })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: "Faz o refresh to jwt access token"})
    async refresh(@Body() dto: RefreshTokenDto){
        return this.authService.refreshToken(dto);
    };

    @Post("logout")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: "Realiza o logout do usuário!"})
    async logout(@Body() dto: RefreshTokenDto){
        return this.authService.logout(dto);
    };

    @Post("register/candidate")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Registra o usuário como candidato" })
    async registerCandidate(@Body() dto: RegisterCandidateDto) {
        return this.authService.registerCandidate(dto);
    }

    @Post("register/company")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Registra o usuário como empresa" })
    async registerCompany(@Body() dto: RegisterCompanyDto) {
        return this.authService.registerCompany(dto);
    };
}
