// @ts-nocxheck

import supertest from "supertest";
import "restmatcher";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { createEintrag, deleteEintrag } from "../../src/services/EintragService";
import { Protokoll } from "../../src/model/ProtokollModel";
import { EintragResource, ProtokollResource } from "../../src/Resources";
import { toHaveAnyValidationErrors } from "restmatcher/lib/responseMatcher";
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


test("/api/eintrag post getränk zu lang", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated: EintragResource = { getraenk: "BHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTee", menge: 500, protokoll: idProtokoll, ersteller: idBehrens }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response).toHaveValidationErrorsExactly({ status: "400", body: "getraenk" })
});

test("/api/eintrag post menge keine int", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated = { getraenk: "BHTee", menge: "500as", protokoll: idProtokoll, ersteller: idBehrens }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response).toHaveValidationErrorsExactly({ status: "400", body: "menge" })
});

test("/api/eintrag post kommentar keine int", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated = { getraenk: "BHTee", menge: 500, kommentar: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", protokoll: idProtokoll, ersteller: idBehrens }
   const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
   expect(response).toHaveValidationErrorsExactly({ status: "400", body: "kommentar" })
});

test("/api/eintrag post keine id: protokoll", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated: EintragResource = { getraenk: "tee", menge: 500, protokoll: "idProtokoll", ersteller: idBehrens }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response).toHaveValidationErrorsExactly({ status: "400", body: "protokoll" })
});

test("/api/eintrag post keine id: ersteller", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated: EintragResource = { getraenk: "tee", menge: 500, protokoll: idProtokoll, ersteller: "idBehrens" }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response).toHaveValidationErrorsExactly({ status: "400", body: "ersteller" })
});

test("/api/eintrag/:id id keine mongo id", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/eintrag/1234`);
    expect(response.statusCode).toBe(400);
    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" })
});

test("/api/eintrag/:id get: nicht gefunden", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/eintrag/${idBehrens}`);
    expect(response.statusCode).toBe(404);
    expect(response).toHaveValidationErrorsExactly({ status: "404", params: "id" })
});

test("/api/eintrag/:id put non matching ids", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeModified: EintragResource = {id: idEintrag2 ,getraenk: "BHTee", menge: 500, protokoll: idProtokoll, ersteller: idProtokoll, kommentar: "asd" }
    const response = await testee.put(`/api/eintrag/${idEintrag1}`).send(eintragToBeModified);
    expect(response.statusCode).toBe(400);
    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id", body: "id" })
});

test("/api/eintrag/:id falsche formate", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeModified = {id: "asdas3fw" ,getraenk: "BHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTeeBHTee", kommentar: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" ,menge: "fünf"}
    const response = await testee.put(`/api/eintrag/asdasd`).send(eintragToBeModified);
    expect(response.statusCode).toBe(400);
    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id", body: ["id", "getraenk", "kommentar", "menge"] })
});

test("/api/eintrag/:id delete non mongo id", async () => {
    await Protokoll.findByIdAndDelete(idEintrag1);
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/eintrag/asdasd`);
    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id"})
});

test("/api/eintrag/:id delete a nonexistent eintrag", async () => {
    await Protokoll.findByIdAndDelete(idEintrag1);
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/eintrag/${idBehrens}`);
    expect(response).toHaveValidationErrorsExactly({ status: "404", params: "id" })
});