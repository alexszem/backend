// @ts-nocxheck

import supertest from "supertest";
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

test("/api/pfleger/alle get", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    
    const response = await testee.get(`/api/pfleger/alle`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
});

test("/api/pfleger post", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);

    const pflegerToBeCreated: PflegerResource = {name: "Steve", password: "Hallo123!!!", admin: false}
    const response = await testee.post(`/api/pfleger`).send(pflegerToBeCreated);
    expect(response.statusCode).toBe(201);
    expect(response.body).toBeDefined()
});

test("/api/pfleger post duplicate", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);

    const pflegerToBeCreated: PflegerResource = {name: "Alex Szemeitat", password: "Hallo123!!!", admin: false}
    const response = await testee.post(`/api/pfleger`).send(pflegerToBeCreated);
    expect(response.statusCode).toBe(400);
});

test("/api/pfleger/:id put", async () => {
    await performAuthentication("Alex Szemeitat", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const pflegerToBeModified: PflegerResource = {id: idAlex, name: "Karl szemeitat", password: "Hallo123!!!", admin: false}
    const response = await testee.put(`/api/pfleger/${idAlex}`).send(pflegerToBeModified);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
});

test("/api/pfleger/:id put: pfleger does not exist", async () => {
    await performAuthentication("Alex Szemeitat", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    await Pfleger.findByIdAndDelete(idAlex).exec();
    const pflegerToBeModified: PflegerResource = {id: idAlex, name: "Karl Szemeitat", password: "Hallo123!!!", admin: false}
    const response = await testee.put(`/api/pfleger/${idAlex}`).send(pflegerToBeModified);
    expect(response.statusCode).toBe(404);
    expect(response.body).toBeDefined()
});

test("/api/pfleger/:id delete", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/pfleger/${idAlex}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
});

test("/api/pfleger/:id delete a nonexistent pfleger", async () => {
    await Pfleger.findByIdAndDelete(idAlex);
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/pfleger/${idAlex}`);
    expect(response.statusCode).toBe(404);
});