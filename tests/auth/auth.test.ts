import supertest from "supertest"
import { createEintrag } from "../../src/services/EintragService"
import { createPfleger } from "../../src/services/PflegerService"
import { createProtokoll } from "../../src/services/ProtokollService"
import app from "../../src/app"
import { EintragResource, PflegerResource, ProtokollResource } from "../../src/Resources"

let idBehrens: string
let idEintrag1: string
let idEintrag2: string
let idProtokoll: string

beforeEach(async () => {
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
    const testee = supertest(app);
    const eintragToBeCreated: EintragResource = { getraenk: "BHTee", menge: 500, protokoll: idProtokoll, ersteller: idBehrens }
    const response = await testee.post(`/api/eintrag`).send(eintragToBeCreated);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBeDefined()
});

test("/api/eintrag/:id put", async () => {
    const testee = supertest(app);
    const eintragToBeModified: EintragResource = {id: idEintrag1 ,getraenk: "BHTee", menge: 500, kommentar: "asd", protokoll: idBehrens, ersteller: idProtokoll }
    const response = await testee.put(`/api/eintrag/${idEintrag1}`).send(eintragToBeModified);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBeDefined()
});

test("/api/eintrag/:id delete", async () => {
    const testee = supertest(app);
    const response = await testee.delete(`/api/eintrag/${idEintrag1}`);
    expect(response.statusCode).toBe(401);
});

test("/api/eintrag/:id get", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/eintrag/${idEintrag1}`);
    expect(response.statusCode).toBe(200);
});

test("/api/pfleger/alle get", async () => {
    const testee = supertest(app);
    
    const response = await testee.get(`/api/pfleger/alle`);
    expect(response.statusCode).toBe(401);
});

test("/api/pfleger post", async () => {
    const testee = supertest(app);
    const pflegerToBeCreated: PflegerResource = {name: "Steve", password: "Hallo123!!!", admin: false}
    const response = await testee.post(`/api/pfleger`).send(pflegerToBeCreated);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBeDefined()
});

test("/api/pfleger/:id put", async () => {
    const testee = supertest(app);

    const pflegerToBeModified: PflegerResource = {id: idBehrens, name: "Karl szemeitat", password: "Hallo123!!!", admin: false}
    const response = await testee.put(`/api/pfleger/${idBehrens}`).send(pflegerToBeModified);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBeDefined();
});

test("/api/pfleger/:id delete", async () => {
    const testee = supertest(app);

    const response = await testee.delete(`/api/pfleger/${idBehrens}`);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBeDefined();
});

test("/api/protokoll/:id/eintrage get, 5 Einträge", async () => {
    const testee = supertest(app);

    for (let i = 1; i <= 5; i++) {
        await createEintrag({ getraenk: "BHTee", menge: i * 10, protokoll: idProtokoll, ersteller: idBehrens })
    }
    const response = await testee.get(`/api/protokoll/${idProtokoll}/eintraege`);
    expect(response.statusCode).toBe(200);
});

test("/api/protokoll/alle get", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/alle`);
    expect(response.statusCode).toBe(200);
});

test("/api/protokoll/alle get falsches JWT", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/alle`).set("Cookie", ["access_token=ichbineinschwindler"]);
    expect(response.statusCode).toBe(401);
});

test("/api/protokoll post", async () => {
    const testee = supertest(app);

    const protokollToBeCreated: ProtokollResource = { patient: "H. Castorp", datum: `03.11.1912`, ersteller: idBehrens, public: true, closed: false }
    const response = await testee.post(`/api/protokoll`).send(protokollToBeCreated);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBeDefined();
});

test("/api/protokoll/:id put", async () => {
    const testee = supertest(app);

    const protokollToBeModified: ProtokollResource = {id: idProtokoll, patient: "Herr Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true, closed: false }
    const response = await testee.put(`/api/protokoll/${idProtokoll}`).send(protokollToBeModified);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBeDefined()
});

test("/api/protokoll/:id delete", async () => {
    const testee = supertest(app);
    const response = await testee.delete(`/api/protokoll/${idProtokoll}`);
    expect(response.statusCode).toBe(401);
});