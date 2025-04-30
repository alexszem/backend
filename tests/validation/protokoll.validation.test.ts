// must be imported before any other imports
import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import { PflegerResource, ProtokollResource } from "../../src/Resources";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let pomfrey: PflegerResource
let fredsProtokoll: ProtokollResource
let idBehrens: string
let idProtokoll1: string
let idProtokoll2: string


beforeEach(async () => {
    pomfrey = await createPfleger({
        name: "Poppy Pomfrey", password: "12345bcdABCD..;,.", admin: false
    });
    fredsProtokoll = await createProtokoll({
        patient: "Fred Weasly", datum: "01.10.2023",
        public: true, closed: false,
        ersteller: pomfrey.id!
    })

    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "Geheim1234..!", admin: false })
    idBehrens = behrens.id!;
    const protokoll1 = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll1 = protokoll1.id!;

    const protokoll2 = await createProtokoll({ patient: "H. Castorp", datum: `02.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll2 = protokoll2.id!;
})

test("/api/protokoll GET, ungültige ID", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/1234`)

    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" })
})

test("/api/protokoll PUT, verschiedene ID (params und body)", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    // Hint: Gültige ID, aber für ein Protokoll ungültig!
    const invalidProtokollID = pomfrey.id;
    // Hint: Gebe hier Typ an, um im Objektliteral Fehler zu vermeiden!
    const update: ProtokollResource = { 
        ...fredsProtokoll, // Hint: Kopie von fredsProtokoll
        id: invalidProtokollID, // wir "überschreiben" die ID
        patient: "George Weasly" // und den Patienten
    }
    const response = await testee.put(`/api/protokoll/${fredsProtokoll.id}`).send(update);

    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id", body: "id" })
});


test("/api/:id/eintrag get non mongo id", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/hallo/eintraege`);
    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id"})
});

test("/api/protokoll/:id id keine mongo id", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.get(`/api/protokoll/mongo`);
    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id"})
});

test("/api/protokoll post", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeCreated = {id: "asdasd", patient: "H. CastorH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. Castorp", datum: `wow kein datum`, ersteller: "egaal", public: "nee", closed: "auch nicht" }
    const response = await testee.post(`/api/protokoll`).send(protokollToBeCreated);
    expect(response).toHaveValidationErrorsExactly({ status: "400",body: ["patient", "datum", "ersteller", "closed", "public"] })
});

test("/api/protokoll/:id put", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const protokollToBeModified = {id: "asdasd", patient: "H. CastorH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. CastorpH. Castorp", datum: `wow kein datum`, public: "nee", closed: "auch nicht" }
    const response = await testee.put(`/api/protokoll/asdasd`).send(protokollToBeModified);
    expect(response).toHaveValidationErrorsExactly({ status: "400",params: "id", body: ["id","patient", "datum", "closed", "public"] })
});

test("/api/protokoll/:id delete: nicht gefunden", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/protokoll/${idBehrens}`);
    expect(response).toHaveValidationErrorsExactly({ status: "404", params: "id"})
});

test("/api/protokoll/:id delete keine mongo id", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/protokoll/asd`);
    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id"})
});

