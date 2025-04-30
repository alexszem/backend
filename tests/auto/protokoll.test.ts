// @ts-nocxheck

import supertest from "supertest";
import "restmatcher";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { createEintrag } from "../../src/services/EintragService";
import { Protokoll } from "../../src/model/ProtokollModel";
import { ProtokollResource } from "../../src/Resources";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idAlex: string;
let idProtokoll1: string
let idProtokoll2: string

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "Geheim1234..!", admin: false })
    idBehrens = behrens.id!;
    const alex = await createPfleger({ name: "Alex", password: "Geheim1234..!", admin: false })
    idAlex = alex.id!;

    const protokoll1 = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll1 = protokoll1.id!;
    const protokoll2 = await createProtokoll({ patient: "H. Castorp", datum: `02.11.1912`, ersteller: idAlex, public: false });
    idProtokoll2 = protokoll2.id!;
})

test("/api/protokoll/:id/eintrage get", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);

    const response = await testee.get(`/api/protokoll/${idProtokoll2}/eintraege`);
    expect(response.statusCode).toBe(403);
});

test("/api/protokoll/alle get", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/alle`);
    expect(response.statusCode).toBe(200);
});

test("/api/protokoll post", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeCreated: ProtokollResource = { patient: "H. Castorp", datum: `03.11.1912`, ersteller: idAlex, public: true, closed: false }
    const response = await testee.post(`/api/protokoll`).send(protokollToBeCreated);
    expect(response.statusCode).toBe(403);
});

test("/api/protokoll/:id put", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeModified: ProtokollResource = {id: idProtokoll2, patient: "Herr Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true, closed: false }
    const response = await testee.put(`/api/protokoll/${idProtokoll2}`).send(protokollToBeModified);
    expect(response.statusCode).toBe(403);
});

test("/api/protokoll/:id delete", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/protokoll/${idProtokoll2}`);
    expect(response.statusCode).toBe(403);
});

test("/api/protokoll/:id get", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/${idProtokoll2}`);
    expect(response.statusCode).toBe(403);
});