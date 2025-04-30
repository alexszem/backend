import express from "express";
import { createPfleger, deletePfleger, getAllePfleger, updatePfleger } from "../services/PflegerService";
import { body, matchedData, param, validationResult } from "express-validator";
import { PflegerResource, ProtokollResource } from "../Resources";
import { MyError } from "../myerror";
import { optionalAuthentication, requiresAuthentication } from "./authentication";

export const pflegerRouter = express.Router();

pflegerRouter.get("/alle",
requiresAuthentication,
async (req, res) => {
    if (req.role !== "a") return res.sendStatus(403);
    const pfleger = await getAllePfleger();
    res.send(pfleger); // 200 by default
})

pflegerRouter.post("",
requiresAuthentication,
body("name").isLength({min:1, max:100}),
body("admin").optional().isBoolean(),
body("password").isStrongPassword(),
async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    if (req.role !== "a") return res.sendStatus(403);
    try {
        const resourceToBeCreated = matchedData(req) as PflegerResource;
        const createdPfleger = await createPfleger(resourceToBeCreated);
        res.status(201).send(createdPfleger);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})

pflegerRouter.put("/:id",
requiresAuthentication,
param("id").isMongoId(),
body("id").isMongoId(),
body("name").isLength({min:1, max:100}),
body("admin").isBoolean(),
body("password").isStrongPassword(),
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
    if (req.role !== "a") return res.sendStatus(403);

    const requestBody = matchedData(req) as PflegerResource;
    const authId = req.pflegerId;
    const httpId = req.params!.id;
    const bodyId = requestBody["id"]
    if (!bodyId || httpId !== bodyId ) return res.status(400).send({
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
        const updatedPfleger = await updatePfleger(requestBody);
        res.send(updatedPfleger);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})

pflegerRouter.delete("/:id",
requiresAuthentication,
param("id").isMongoId(),
async (req, res) =>{
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()});
    if (req.role !== "a") return res.sendStatus(403);
    const id = req.params!.id;
    try {
        if (req.pflegerId === id) throw new MyError("Can't delete one self", 400, ["id"], [id], "params")
        await deletePfleger(id);
        res.sendStatus(200);
    } catch (error) {
        if (error instanceof MyError) return res.status(error.statusCode).send(error.constructMessage());
    }
})