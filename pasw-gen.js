import bcrypt from "bcrypt"

const senha = "senha_valida"
const hash = await bcrypt.hash(senha, 10)

console.log({senha, hash})