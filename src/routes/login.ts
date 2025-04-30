import express from "express";
import { body, cookie, validationResult } from "express-validator";
import { verifyJWT, verifyPasswordAndCreateJWT } from "../services/JWTService";
import { JsonWebTokenError } from "jsonwebtoken";
import { MyError } from "../myerror";
import { handleMiddlewareErrors, MiddlewareError } from "./utils";

export const loginRouter = express.Router();

loginRouter.post("",
body("name").isLength({min:1, max:100}),
body("password").isStrongPassword(),
async (req, res) =>{
    try {
        handleMiddlewareErrors(req, res);
        const token = await verifyPasswordAndCreateJWT(req.body.name, req.body.password);
        const loginResource = verifyJWT(token);
        res.status(201).cookie("access_token", token, {
            httpOnly: true,
            expires: new Date(loginResource.exp * 1000),
            secure: true,
            sameSite: "none"
        }).send(loginResource);
    } catch (error) {
        if (error instanceof Error && error.message === "Internal Error") {
            res.sendStatus(500);
            return
        }
        else if (error instanceof MiddlewareError) return error.sendErrors(res);
        res.status(401).send(false);
    }
})

loginRouter.get("",
cookie("access_token").isJWT(),
async (req, res) =>{
    try {
        handleMiddlewareErrors(req, res);
        const loginResource = verifyJWT(req.cookies.access_token);
        res.status(201).cookie("access_token", req.cookies.access_token, {
            httpOnly: true,
            expires: new Date(loginResource.exp * 1000),
            secure: true,
            sameSite: "none"
        }).send(loginResource);
    } catch (error) {
        if (error instanceof Error && error.message === "Internal Error") {
            res.sendStatus(500);
            return
        } 
        else if (error instanceof MiddlewareError) return error.sendErrors(res);
        res.status(401).send(false);
    }
})

loginRouter.delete("",
cookie("access_token").isJWT(),
async (req, res) =>{
    res.clearCookie("access_token").sendStatus(200);
})