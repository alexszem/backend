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

export function requiresAuthentication(req: Request, res: Response, next: NextFunction): void {
    try {
        const loginResource = verifyJWT(req.cookies.access_token);
        req.pflegerId = loginResource.id;
        req.role = loginResource.role;
        next();    
    } catch (error) {
        if (error instanceof Error && error.message == "Internal Error") {
            res.status(500).send();
            return;
        }
        res.sendStatus(401);
    }
}

export function requiresAdminPrivileges(req: Request, res: Response, next: NextFunction) {
    if (!req.role || req.role !== "a") {
        res.sendStatus(403);
        return
    }
    next();
}

export function optionalAuthentication(req: Request, res: Response, next: NextFunction): void {
    try {
        const loginResource = verifyJWT(req.cookies.access_token);
        req.pflegerId = loginResource.id;
        req.role = loginResource.role;
        next();    
    } catch (error) {
        if (error instanceof Error && error.message == "Internal Error") {
            res.status(500).send();
            return;
        }
        if (error instanceof Error && error.message == "No JWT") {
            res.status(401)
            return next();
        }
        res.status(401).send();   
    }
}
