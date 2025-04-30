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
let idAlex: string
let idEintrag1: string
let idEintrag2: string
let idProtokoll: string
let idPublic: string

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "Geheim1234..!", admin: false })
    idBehrens = behrens.id!;

    const alex = await createPfleger({ name: "Alex", password: "Geheim1234..!", admin: false })
    idAlex = alex.id!;

    const protokoll = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll = protokoll.id!;

    const publicP = await createProtokoll({ patient: "H. Castorp", datum: `02.11.1912`, ersteller: idAlex, public: false });
    idPublic = publicP.id!;
    
    const eintrag1 = await createEintrag({ getraenk: "BHTee", menge: 100, protokoll: idProtokoll, ersteller: idBehrens })
    const eintrag2 = await createEintrag({ getraenk: "BHTee", menge: 200, protokoll: idPublic, ersteller: idAlex })
    idEintrag1 = eintrag1.id!;
    idEintrag2 = eintrag2.id!;
})

test("/api/eintrag post", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeCreated: EintragResource = { getraenk: "BHTee", menge: 500, protokoll: idPublic, ersteller: idBehrens }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response.statusCode).toBe(403);
});

test("/api/eintrag/:id put", async () => {
    await performAuthentication("Alex", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const eintragToBeModified: EintragResource = {id: idEintrag1 ,getraenk: "BHTee", menge: 500, kommentar: "asd", protokoll: idBehrens, ersteller: idProtokoll }
    const response = await testee.put(`/api/eintrag/${idEintrag1}`).send(eintragToBeModified);
    expect(response.statusCode).toBe(403);
});

test("/api/eintrag/:id delete", async () => {
    await performAuthentication("Alex", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/eintrag/${idEintrag1}`);
    expect(response.statusCode).toBe(403);
});

test("/api/eintrag/:id get", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/eintrag/${idEintrag2}`);
    expect(response.statusCode).toBe(403);
});