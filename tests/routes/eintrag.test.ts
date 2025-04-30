// @ts-nocxheck

import supertest from "supertest";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { createEintrag, deleteEintrag } from "../../src/services/EintragService";
import { Protokoll } from "../../src/model/ProtokollModel";
import { EintragResource, ProtokollResource } from "../../src/Resources";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idEintrag1: string
let idEintrag2: string
let idProtokoll: string

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "Geheim1234..!", admin: false })
    idBehrens = behrens.id!;
    const protokoll = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll = protokoll.id!;
    
    const eintrag1 = await createEintrag({ getraenk: "BHTee", menge: 100, protokoll: idProtokoll, ersteller: idBehrens })
    const eintrag2 = await createEintrag({ getraenk: "BHTee", menge: 200, protokoll: idProtokoll, ersteller: idBehrens })
    idEintrag1 = eintrag1.id!;
    idEintrag2 = eintrag2.id!;
})

test("/api/eintrag post", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated: EintragResource = { getraenk: "BHTee", menge: 500, protokoll: idProtokoll, ersteller: idBehrens }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response.statusCode).toBe(201);
    expect(response.body).toBeDefined()
});

test("/api/eintrag post bad pfleger & protokollid", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated: EintragResource = { getraenk: "BHTee", menge: 500, protokoll: idBehrens, ersteller: idProtokoll }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response.statusCode).toBe(404);
    expect(response.body).toBeDefined()
});

test("/api/eintrag/:id put", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeModified: EintragResource = {id: idEintrag1 ,getraenk: "BHTee", menge: 500, kommentar: "asd", protokoll: idBehrens, ersteller: idProtokoll }
    const response = await testee.put(`/api/eintrag/${idEintrag1}`).send(eintragToBeModified);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined()
});

test("/api/eintrag/:id put falsche ids für ersteller & protokoll", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeModified: EintragResource = {id: idEintrag1 ,getraenk: "BHTee", menge: 500, protokoll: idProtokoll, ersteller: idProtokoll, kommentar: "asd" }
    const response = await testee.put(`/api/eintrag/${idEintrag1}`).send(eintragToBeModified);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined()
});

test("/api/eintrag/:id put falsche id für eintrag", async () => {
    await deleteEintrag(idEintrag1)
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeModified: EintragResource = {id: idEintrag1 ,getraenk: "BHTee", menge: 500, protokoll: idProtokoll, ersteller: idProtokoll, kommentar: "asd" }
    const response = await testee.put(`/api/eintrag/${idEintrag1}`).send(eintragToBeModified);
    expect(response.statusCode).toBe(404);
    expect(response.body).toBeDefined()
});

test("/api/eintrag/:id delete", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/eintrag/${idEintrag1}`);
    expect(response.statusCode).toBe(204);
});



test("/api/eintrag/:id get", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/eintrag/${idEintrag1}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body["id"]).toBe(idEintrag1);
    expect(response.body["protokoll"]).toBe(idProtokoll);
});

test("/api/eintrag/:id get: nicht gefunden", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/eintrag/${idBehrens}`);
    expect(response.statusCode).toBe(404);
});