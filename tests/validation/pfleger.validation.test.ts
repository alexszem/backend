
// @ts-nocxheck

import supertest from "supertest";
import "restmatcher";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { PflegerResource } from "../../src/Resources";
import { Pfleger } from "../../src/model/PflegerModel";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idAlex: string

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "Geheim1234..!", admin: true })
    idBehrens = behrens.id!;
    const alex = await createPfleger({ name: "Alex Szemeitat", password: "Geheim1234..!", admin: true })
    idAlex = alex.id!;
})

test("/api/pfleger post no mongo id", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const pflegerToBeCreated = {name: "SteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteve", password: "Ha", admin: "asdasd"}
    const response = await testee.post(`/api/pfleger`).send(pflegerToBeCreated);
    expect(response).toHaveValidationErrorsExactly({ status: "400", body: ["name", "password", "admin"] })
});

test("/api/pfleger/:id put", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const pflegerToBeModified = {id: "asdasd",name: "SteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteveSteve", password: "Ha"}
    const response = await testee.put(`/api/pfleger/asd`).send(pflegerToBeModified);
    expect(response).toHaveValidationErrorsExactly({ status: "400",params: "id", body: ["id","name", "password", "admin"] })
});

test("/api/pfleger/:id put: different ids", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const pflegerToBeModified: PflegerResource = {id: idAlex, name: "Karl Szemeitat", password: "Hallo123!!!", admin: false}
    const response = await testee.put(`/api/pfleger/${idBehrens}`).send(pflegerToBeModified);
    expect(response).toHaveValidationErrorsExactly({ status: "400",params: "id", body: "id" })
});

test("/api/pfleger/:id delete", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/pfleger/asdasd`);
    expect(response).toHaveValidationErrorsExactly({ status: "400",params: "id" })
});

test("/api/pfleger/:id put duplicate", async () => {
    await performAuthentication("Alex Szemeitat", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const pflegerToBeModified: PflegerResource = {id: idAlex, name: "Hofrat Behrens", password: "Hallo123!!!", admin: false}
    const response = await testee.put(`/api/pfleger/${idAlex}`).send(pflegerToBeModified);
    expect(response).toHaveValidationErrorsExactly({ status: "400",body: "name" })
});