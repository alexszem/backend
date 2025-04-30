import express from "express";
import { getAlleEintraege } from "../services/EintragService";
import { createProtokoll, deleteProtokoll, getAlleProtokolle, getProtokoll, updateProtokoll } from "../services/ProtokollService";
import { body, matchedData, param, validationResult } from "express-validator";
import { ProtokollResource } from "../Resources";
import { dateToString } from "../services/ServiceHelper";
import { MyError } from "../myerror";
import { optionalAuthentication, requiresAuthentication } from "./authentication";


export const protokollRouter = express.Router();

protokollRouter.get("/:id/eintraege",
optionalAuthentication,
param("id").isMongoId(),
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    const id = req.params!.id;
    try {
        const protokoll = await getProtokoll(id);
        if (!protokoll.public && protokoll.ersteller !== req.pflegerId) return res.sendStatus(403);
        const eintraege = await getAlleEintraege(id);
        res.send(eintraege); // 200 by default
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})

protokollRouter.get("/alle",
optionalAuthentication,
async (req, res) => {
    let protokolle;
    if (req.pflegerId) await getAlleProtokolle(req.pflegerId);
    else protokolle = await getAlleProtokolle();
    res.send(protokolle); // 200 by default
})

protokollRouter.get("/:id",
optionalAuthentication,
param("id").isMongoId(),
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    const id = req.params!.id;
    try {
        const protokoll = await getProtokoll(id);
        if (!protokoll.public && protokoll.ersteller !== req.pflegerId) return res.sendStatus(403);
        res.send(protokoll)
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    try {
        const resourceToBeCreated = matchedData(req) as ProtokollResource;
        if (resourceToBeCreated.ersteller !== req.pflegerId) return res.sendStatus(403);
        const createdProtokoll = await createProtokoll(resourceToBeCreated); 
        res.status(201).send(matchedData(createdProtokoll));
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    const modification = matchedData(req) as ProtokollResource;
    const httpId = req.params!.id;
    const bodyId = modification.id
    if (!bodyId || httpId != bodyId) return res.status(400).send({
        "errors": [ 
            {"type": "field",
            "location" : "params",
            "msg" : "Invalid value",
            "path" : "id",
            "value" : httpId }, 
            {"type": "field",
            "location" : "body",
            "msg" : "Invalid value",
            "path" : "id",
            "value" : bodyId }
        ]
    })
    try {
        const protokollToBeModified = await getProtokoll(modification.id!)
        if (protokollToBeModified.ersteller !== req.pflegerId) return res.sendStatus(403);
        const modifiedPfleger = await updateProtokoll(modification);
        res.send(modifiedPfleger);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})

protokollRouter.delete("/:id",
requiresAuthentication,
param("id").isMongoId(),
async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    const id = req.params!.id;
    try {
        const protokoll = await getProtokoll(id);
        if (protokoll.ersteller !== req.pflegerId) return res.sendStatus(403)
        await deleteProtokoll(id);
        res.sendStatus(204);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})