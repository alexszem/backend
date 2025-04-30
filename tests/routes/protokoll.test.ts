// @ts-nocxheck

import supertest from "supertest";
import "restmatcher";
import app from "../../src/app";
import { createPfleger, deletePfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { createEintrag } from "../../src/services/EintragService";
import { Protokoll } from "../../src/model/ProtokollModel";
import { ProtokollResource } from "../../src/Resources";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idProtokoll1: string
let idProtokoll2: string

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "Geheim1234..!", admin: false })
    idBehrens = behrens.id!;
    const protokoll1 = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll1 = protokoll1.id!;

    const protokoll2 = await createProtokoll({ patient: "H. Castorp", datum: `02.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll2 = protokoll2.id!;
})

test("/api/protokoll/:id/eintrage get, 5 Einträge", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    for (let i = 1; i <= 5; i++) {
        await createEintrag({ getraenk: "BHTee", menge: i * 10, protokoll: idProtokoll1, ersteller: idBehrens })
    }
    const response = await testee.get(`/api/protokoll/${idProtokoll1}/eintraege`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(5);
});

test("/api/protokoll/:id/eintrage get, keine Einträge", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/${idProtokoll1}/eintraege`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
});

test("/api/protokoll/:id/eintrage get, falsche Protokoll-ID", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/${idBehrens}/eintraege`);
    expect(response).toHaveValidationErrorsExactly({ status: "404", params: "id" })
});

test("/api/protokoll/alle get", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/alle`);
    expect(response.statusCode).toBe(200);
});

test("/api/protokoll/alle get keine protokolle", async () => {
    await Protokoll.deleteMany({}).exec();
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/alle`);
    expect(response.statusCode).toBe(200);
});

test("/api/protokoll post", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeCreated: ProtokollResource = { patient: "H. Castorp", datum: `03.11.1912`, ersteller: idBehrens, public: true, closed: false }
    const response = await testee.post(`/api/protokoll`).send(protokollToBeCreated);
    expect(response.statusCode).toBe(201);
    expect(response.body).toBeDefined();
});

test("/api/protokoll post duplicate unique", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeCreated: ProtokollResource = { patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true }
    const response = await testee.post(`/api/protokoll`).send(protokollToBeCreated);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBeDefined()
});

test("/api/protokoll post bad PflegerID", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeCreated: ProtokollResource = { patient: "H. Castorp", datum: `05.11.1912`, ersteller: idBehrens, public: true };
    await deletePfleger(idBehrens);
    const response = await testee.post(`/api/protokoll`).send(protokollToBeCreated);
    expect(response.statusCode).toBe(404);
    expect(response.body).toBeDefined()
});

test("/api/protokoll/:id put", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeModified: ProtokollResource = {id: idProtokoll1, patient: "Herr Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true, closed: false }
    const response = await testee.put(`/api/protokoll/${idProtokoll1}`).send(protokollToBeModified);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined()
});

test("/api/protokoll/:id put non unique", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeModified: ProtokollResource = {id: idProtokoll1, patient: "H. Castorp", datum: `02.11.1912`, ersteller: idBehrens, public: true }
    const response = await testee.put(`/api/protokoll/${idProtokoll1}`).send(protokollToBeModified);
    expect(response.statusCode).toBe(400);
});

test("/api/protokoll/:id put update the erstellerid to be faulty", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeModified: ProtokollResource = {id: idProtokoll1, patient: "H. Castorp", datum: `01.11.1912`, ersteller: idProtokoll2, public: true,closed: false }
    const response = await testee.put(`/api/protokoll/${idProtokoll1}`).send(protokollToBeModified);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined()
});

test("/api/protokoll/:id put update the protokollid to be faulty", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeModified: ProtokollResource = {id: idBehrens, patient: "H. Castorp", datum: `01.11.1912`, ersteller: idProtokoll2, public: true,closed: false }
    const response = await testee.put(`/api/protokoll/${idBehrens}`).send(protokollToBeModified);
    expect(response.statusCode).toBe(404);
});

test("/api/protokoll/:id delete", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/protokoll/${idProtokoll1}`);
    expect(response.statusCode).toBe(204);
});

test("/api/protokoll/:id delete a nonexistent pfleger", async () => {
    await Protokoll.findByIdAndDelete(idProtokoll1);
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/protokoll/${idProtokoll1}`);
    expect(response.statusCode).toBe(404);
});

test("/api/protokoll/:id get", async () => {
    for (let i = 1; i <= 5; i++) {
        await createEintrag({ getraenk: "BHTee", menge: i * 10, protokoll: idProtokoll1, ersteller: idBehrens })
    }
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/${idProtokoll1}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body["id"]).toBe(idProtokoll1);
    expect(response.body["gesamtMenge"]).toBe(150);
});

test("/api/protokoll/:id get: nicht gefunden", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/${idBehrens}`);
    expect(response.statusCode).toBe(404);
});