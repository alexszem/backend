import { Result, ValidationError, validationResult } from "express-validator";
import { MyError } from "../myerror";
import { Request, Response } from "express";


export function handleMiddlewareErrors(req: any, res: any) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new MiddlewareError("",errors)
}

export function handleErrors(error: any, res: Response){
    if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    else if (error instanceof MiddlewareError) return error.sendErrors(res);
    else if (error instanceof IdError) return error.sendError(res);
    else return res.status(500);
}

export function compareParamAndBodyId(body: any, req: Request, res: Response) {
    const httpId = req.params!.id;
    const bodyId = body.id
    if (!bodyId || httpId != bodyId) throw new IdError("", httpId, bodyId)
}

export class IdError extends Error {
    httpId: string;
    bodyId: string;

    constructor(message: string, httpId: string, bodyId: string){
        super(message);
        this.httpId = httpId;
        this.bodyId = bodyId;
    }

    sendError(res: Response) {
        res.status(400).send({"errors": [{
            "type": "field",
            "location" : "params",
            "msg" : "Not matching ID in request body",
            "path" : "id",
            "value" : this.httpId},
            {"type": "field",
            "location" : "body",
            "msg" : "Not matching ID in parameters",
            "path" : "id",
            "value" : this.bodyId }]
        })
    }
}

export class MiddlewareError extends Error {
    errors: Result<ValidationError>;

    constructor(message: string, errors: Result<ValidationError>){
        super(message);
        this.errors = errors
    }

    sendErrors(res: Response){
        res.status(400).json({errors: this.errors.array()})
    }
}