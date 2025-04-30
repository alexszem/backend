import dotenv from "dotenv";
dotenv.config() // read ".env"

import { LoginResource } from "../Resources";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { login } from "./AuthenticationService";
import { MyError } from "../myerror";

export async function verifyPasswordAndCreateJWT(name: string, password: string): Promise<string | undefined> {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtTTL = process.env.JWT_TTL;
    if (!jwtSecret) throw new Error("Internal Error");
    if (!jwtTTL) throw new Error("Internal Error");
    

    const loginResource = await login(name, password);
    if (!loginResource) return undefined;

    const payload: JwtPayload = {
        sub: loginResource.id,
        role: loginResource.role
    }

    const jwtString = sign(
        payload,
        jwtSecret,
        {
            expiresIn: parseInt(jwtTTL),
            algorithm: "HS256"
        }
    );

    return jwtString;
}

export function verifyJWT(jwtString: string | undefined): LoginResource {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtTTL = process.env.JWT_TTL;
    if (!jwtSecret) throw new Error("Internal Error")
    if (!jwtTTL) throw new Error("Internal Error");
    if (!jwtString) throw new Error("No JWT")

    const payload: JwtPayload = verify(jwtString!, jwtSecret) as JwtPayload;
    const userId = payload.sub;
    const role: "a" | "u" = payload.role;
    const exp = payload.exp;

    return {id: userId!, role: role, exp: exp!};
}
