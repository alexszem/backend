import express from "express";
import { createEintrag, deleteEintrag, getEintrag, updateEintrag } from "../services/EintragService";
import { body, matchedData, param, validationResult } from "express-validator";
import { EintragResource } from "../Resources";
import { Types } from "mongoose";
import { MyError } from "../myerror";
import { optionalAuthentication, requiresAuthentication } from "./authentication";
import { getProtokoll } from "../services/ProtokollService";

export const eintragRouter = express.Router();

eintragRouter.post("",
requiresAuthentication,
body("getraenk").isLength({min:1, max:100}),
body("menge").isInt(),
body("kommentar").optional().isLength({min:1, max:1000}),
body("ersteller").isMongoId(),
body("protokoll").isMongoId(),
async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    try {
        const resourceToBeCreated = matchedData(req) as EintragResource;
        const protokoll = await getProtokoll(resourceToBeCreated.protokoll);
        if (!protokoll.public && protokoll.ersteller !== req.pflegerId) return res.sendStatus(403);
        const createdEintrag = await createEintrag(resourceToBeCreated);
        res.status(201).send(createdEintrag);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})

eintragRouter.get("/:id",
optionalAuthentication,
param("id").isMongoId(),
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    try {
    const id = req.params!.id;;
    const eintrag = await getEintrag(id);
    const protokoll = await getProtokoll(eintrag.protokoll);
    if (!protokoll.public && protokoll.ersteller !== req.pflegerId && eintrag.ersteller !== req.pflegerId) return res.sendStatus(403);
    res.send(eintrag).status(200)
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})

eintragRouter.put("/:id",
requiresAuthentication,
param("id").isMongoId(),
body("id").isMongoId(),
body("getraenk").isLength({min:1, max:100}),
body("menge").isInt(),
body("kommentar").isLength({min:1, max:1000}),
 async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    
    const httpId = req.params!.id;
    const eintrag = matchedData(req) as EintragResource;
    const bodyId = eintrag["id"]
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
        const realEintrag = await getEintrag(eintrag.id!);
        const protokoll = await getProtokoll(realEintrag.protokoll);
        if (protokoll.ersteller !== req.pflegerId && eintrag.ersteller !== req.pflegerId) return res.sendStatus(403);
        const updatedEintrag = await updateEintrag(eintrag);
        res.send(updatedEintrag);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})


eintragRouter.delete("/:id",
requiresAuthentication,
param("id").isMongoId(),
 async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
     try {
    const id = req.params!.id;
        const eintrag = await getEintrag(id);
        const protokoll = await getProtokoll(eintrag.protokoll);
        if (protokoll.ersteller !== req.pflegerId && eintrag.ersteller !== req.pflegerId) return res.sendStatus(403);
        await deleteEintrag(id);
        res.sendStatus(204);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})