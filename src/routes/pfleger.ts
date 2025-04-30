import express from "express";
import { createPfleger, deletePfleger, getAllePfleger, updatePfleger } from "../services/PflegerService";
import { body, matchedData, param, validationResult } from "express-validator";
import { PflegerResource, ProtokollResource } from "../Resources";
import { MyError } from "../myerror";
import { optionalAuthentication, requiresAdminPrivileges, requiresAuthentication } from "./authentication";
import { compareParamAndBodyId, handleErrors, handleMiddlewareErrors } from "./utils";

export const pflegerRouter = express.Router();

pflegerRouter.get("/alle",
requiresAuthentication,
requiresAdminPrivileges,
async (req, res) => {
    handleMiddlewareErrors(req, res);
    const pfleger = await getAllePfleger();
    res.send(pfleger); // 200 by default
})

pflegerRouter.post("",
requiresAuthentication,
requiresAdminPrivileges,
body("name").isLength({min:1, max:100}),
body("admin").optional().isBoolean(),
body("password").isStrongPassword(),
async (req, res) =>{
    handleMiddlewareErrors(req, res);
    try {
        const resourceToBeCreated = matchedData(req) as PflegerResource;
        const createdPfleger = await createPfleger(resourceToBeCreated);
        res.status(201).send(createdPfleger);
    } catch (error) {
        handleErrors(error, res);
    }
})

pflegerRouter.put("/:id",
requiresAuthentication,
requiresAdminPrivileges,
param("id").isMongoId(),
body("id").isMongoId(),
body("name").isLength({min:1, max:100}),
body("admin").isBoolean(),
body("password").isStrongPassword(),
async (req, res) => {
    handleMiddlewareErrors(req, res);
    const requestBody = matchedData(req) as PflegerResource;
    compareParamAndBodyId(requestBody, req, res)
    try {
        const updatedPfleger = await updatePfleger(requestBody);
        res.send(updatedPfleger);
    } catch (error) {
        handleErrors(error, res);
    }
})

pflegerRouter.delete("/:id",
requiresAuthentication,
requiresAdminPrivileges,
param("id").isMongoId(),
async (req, res) =>{
    handleMiddlewareErrors(req, res);
    const id = req.params!.id;
    try {
        if (req.pflegerId === id) throw new MyError("Can't delete one self", 400, ["id"], [id], "params")
        await deletePfleger(id);
        res.sendStatus(200);
    } catch (error) {
        handleErrors(error, res);
    }
})