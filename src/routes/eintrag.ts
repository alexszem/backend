import express from "express";
import { createEintrag, deleteEintrag, getEintrag, updateEintrag } from "../services/EintragService";
import { body, matchedData, param, validationResult } from "express-validator";
import { EintragResource, ProtokollResource } from "../Resources";
import { optionalAuthentication, requiresAuthentication } from "./authentication";
import { getProtokoll } from "../services/ProtokollService";
import { compareParamAndBodyId, handleErrors, handleMiddlewareErrors } from "./utils";

export const eintragRouter = express.Router();

eintragRouter.post("",
requiresAuthentication,
body("getraenk").isLength({min:1, max:100}),
body("menge").isInt(),
body("kommentar").optional().isLength({min:1, max:1000}),
body("ersteller").isMongoId(),
body("protokoll").isMongoId(),
async (req, res) =>{
    try {
        handleMiddlewareErrors(req, res);
        const resourceToBeCreated = matchedData(req) as EintragResource;
        const protokoll = await getProtokoll(resourceToBeCreated.protokoll);
        const isNotProtokollErsteller = protokoll.ersteller !== req.pflegerId
        if (!protokoll.public && isNotProtokollErsteller) {
            res.sendStatus(403);
            return
        }
        const createdEintrag = await createEintrag(resourceToBeCreated);
        res.status(201).send(createdEintrag);
    } catch (error) {
        handleErrors(error, res);
    }
})

eintragRouter.get("/:id",
optionalAuthentication,
param("id").isMongoId(),
async (req, res) => {
    try {
        handleMiddlewareErrors(req, res);
        const id = req.params!.id;;
        const eintrag = await getEintrag(id);
        const protokoll = await getProtokoll(eintrag.protokoll);
        if (!protokoll.public && isNotContributor(protokoll, eintrag, req)) {
            res.sendStatus(403);
            return
        }
        res.status(200).send(eintrag)
    } catch (error) {
        handleErrors(error, res);
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
    try {
        handleMiddlewareErrors(req, res);
        const eintrag = matchedData(req) as EintragResource;
        compareParamAndBodyId(eintrag, req, res);
        const realEintrag = await getEintrag(eintrag.id!);
        const protokoll = await getProtokoll(realEintrag.protokoll);
        if (isNotContributor(protokoll, eintrag, req)) {
            res.sendStatus(403);
            return
        }
        const updatedEintrag = await updateEintrag(eintrag);
        res.status(200).send(updatedEintrag);
    } catch (error) {
        handleErrors(error, res);
    }
})

eintragRouter.delete("/:id",
requiresAuthentication,
param("id").isMongoId(),
 async (req, res) =>{
    try {
        handleMiddlewareErrors(req, res);
        const id = req.params!.id;
        const eintrag = await getEintrag(id);
        const protokoll = await getProtokoll(eintrag.protokoll);
        if (isNotContributor(protokoll, eintrag, req)){
            res.sendStatus(403);
            return
        }
        await deleteEintrag(id);
        res.sendStatus(204);
    } catch (error) {
        handleErrors(error, res);
    }
})

function isNotContributor(protokoll: ProtokollResource, eintrag: EintragResource, req: any): boolean {
    return protokoll.ersteller !== req.pflegerId && eintrag.ersteller !== req.pflegerId
}