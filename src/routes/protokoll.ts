import express from "express";
import { getAlleEintraege } from "../services/EintragService";
import { createProtokoll, deleteProtokoll, getAlleProtokolle, getProtokoll, updateProtokoll } from "../services/ProtokollService";
import { body, matchedData, param } from "express-validator";
import { ProtokollResource } from "../Resources";
import { MyError } from "../myerror";
import { optionalAuthentication, requiresAuthentication } from "./authentication";
import { compareParamAndBodyId, handleErrors, handleMiddlewareErrors } from "./utils";


export const protokollRouter = express.Router();

protokollRouter.get("/:id/eintraege",
optionalAuthentication,
param("id").isMongoId(),
async (req, res) => {
    try {
        handleMiddlewareErrors(req, res);
        const id = req.params!.id;
        const protokoll = await getProtokoll(id);
        if (!protokoll.public && isNotErsteller(protokoll, req)) {
            res.sendStatus(403);
            return
        }
        const eintraege = await getAlleEintraege(id);
        res.status(200).send(eintraege); // 200 by default
    } catch (error) {
        handleErrors(error, res)
    }
})

protokollRouter.get("/alle",
optionalAuthentication,
async (req, res) => {
    let protokolle;
    if (req.pflegerId) protokolle = await getAlleProtokolle(req.pflegerId);
    else protokolle = await getAlleProtokolle();
    res.status(200).send(protokolle); 
})

protokollRouter.get("/:id",
optionalAuthentication,
param("id").isMongoId(),
async (req, res) => {
    try {
        handleMiddlewareErrors(req, res);
        const id = req.params!.id;
        const protokoll = await getProtokoll(id);
        if (!protokoll.public && isNotErsteller(protokoll, req)) {
            res.sendStatus(403);
            return
        }
        res.status(200).send(protokoll);
    } catch (error) {
        handleErrors(error, res)
    }
})

protokollRouter.post("",
requiresAuthentication,
body("patient").isLength({min:1, max:100}),
body("datum").isDate({format: "DD.MM.YYYY", delimiters: ["."]}),
body("public").optional().isBoolean(),
body("closed").optional().isBoolean(),
body("ersteller").isMongoId(),
async (req, res) => {
    try {
        handleMiddlewareErrors(req, res);
        const resourceToBeCreated = matchedData(req) as ProtokollResource;
        if (isNotErsteller(resourceToBeCreated, req)) {
            res.sendStatus(403);
            return
        }
        const createdProtokoll = await createProtokoll(resourceToBeCreated); 
        res.status(201).send(createdProtokoll);
    } catch (error) {
        handleErrors(error, res)
    }
})

protokollRouter.put("/:id",
requiresAuthentication,
param("id").isMongoId(),
body("id").isMongoId(),
body("patient").isLength({min:1, max:100}),
body("datum").isDate({format: "DD.MM.YYYY", delimiters: ["."]}),
body("public").isBoolean(),
body("closed").isBoolean(),
async (req, res) => {
    try {
        handleMiddlewareErrors(req, res);

        const modification = matchedData(req) as ProtokollResource;
        compareParamAndBodyId(modification, req, res)
        const protokollToBeModified = await getProtokoll(modification.id!)
        if (isNotErsteller(protokollToBeModified, req)) {
            res.sendStatus(403);
            return
        }
        const modifiedPfleger = await updateProtokoll(modification);
        res.status(200).send(modifiedPfleger);
    } catch (error) {
        handleErrors(error, res)
    }
})

protokollRouter.delete("/:id",
requiresAuthentication,
param("id").isMongoId(),
async (req, res) =>{
    try {
        handleMiddlewareErrors(req, res);
        const id = req.params!.id;
        const protokoll = await getProtokoll(id);
        if (isNotErsteller(protokoll, req)) {
            res.sendStatus(403);
            return
        }
        await deleteProtokoll(id);
        res.sendStatus(204);
    } catch (error) {
        if (error instanceof MyError) {
            res.status(error.statusCode).send(error.constructMessage());
            return 
        } 
    }
})

function isNotErsteller(protokoll: ProtokollResource, req: any) {
    return protokoll.ersteller !== req.pflegerId
}