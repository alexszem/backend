import { NextFunction, Request, Response } from "express";
import { verifyJWT } from "../services/JWTService";
import { JsonWebTokenError } from "jsonwebtoken";

declare global {
    namespace Express {
        export interface Request {
            /**
             * Mongo-ID of currently logged in pfleger; or undefined, if pfleger is a guest.
             */
            pflegerId?: string;
            /**
             * Role of currently logged in pfleger; or undefined, if pfleger is a guest.
             */
            role?: "u" | "a";
        }
    }
}

export function requiresAuthentication(req: Request, res: Response, next: NextFunction) {
    try {
        const loginResource = verifyJWT(req.cookies.access_token);
        req.pflegerId = loginResource.id;
        req.role = loginResource.role;
        next();    
    } catch (error) {
        if (error instanceof Error && error.message == "Internal Error") return res.status(500).send();
        res.status(401).send();
    }
}

export function optionalAuthentication(req: Request, res: Response, next: NextFunction) {
    try {
        const loginResource = verifyJWT(req.cookies.access_token);
        req.pflegerId = loginResource.id;
        req.role = loginResource.role;
        next();    
    } catch (error) {
        if (error instanceof Error && error.message == "Internal Error") return res.status(500).send();
        if (error instanceof Error && error.message == "No JWT") return next();
        res.status(401).send();    
    }
}
