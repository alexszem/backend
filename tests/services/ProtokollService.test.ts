import { HydratedDocument } from "mongoose";
import { EintragResource, ProtokollResource } from "../../src/Resources";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import { IProtokoll, Protokoll } from "../../src/model/ProtokollModel";
import { createProtokoll, deleteProtokoll, getAlleProtokolle, getProtokoll, updateProtokoll } from "../../src/services/ProtokollService";
import { createEintrag } from "../../src/services/EintragService";
import { Eintrag } from "../../src/model/EintragModel";

let protokoll: HydratedDocument<IProtokoll>;
let alex: HydratedDocument<IPfleger>;

beforeEach( async () => {
    await Protokoll.deleteMany({}).exec();

    alex = await Pfleger.create({
        name: "Alex",
        password: "passwordisbht"
    });

    protokoll = await Protokoll.create({
        patient: "Bob",
        datum: new Date("2024-08-24"),
        ersteller: alex._id,
        closed: false
    })
})

test("get protokoll", async () => {
    let result: ProtokollResource = await getProtokoll(protokoll._id.toString());

    expect(result.id).toBeDefined();
    expect(result.patient).toBe("Bob");
    expect(result.datum).toBeDefined();
    expect(result.public).toBeFalsy();
    expect(result.closed).toBeFalsy();
    expect(result.ersteller).toBeDefined();
    expect(result.updatedAt).toBeDefined();
})

test("get protokoll, falsche id", async () => {
    await expect(async () => {
       await getProtokoll(alex._id.toString());
    }).rejects.toThrow();
})

test("create protokoll", async () => {
    await Protokoll.deleteMany().exec();


    const resource: ProtokollResource = {
        id: protokoll._id.toString(),
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }

    const result = await createProtokoll(resource);

    expect(result).toBeDefined();
    expect(result.patient).toBe("Bob");
    expect(result.datum).toBe("23.08.2000");
    expect(result.public).toBeTruthy();
    expect(result.closed).toBeFalsy();
    expect(result.updatedAt).toBeDefined(),
    expect(result.ersteller).toEqual(alex._id.toString()),
    expect(result.erstellerName).toBe("Alex")
})

test("gesamtmenge", async () => {
    const cola: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    await createEintrag(cola);
    await createEintrag(cola);

    let result = await getProtokoll(protokoll._id.toString());
    expect(result.gesamtMenge).toBe(666);

    await createEintrag(cola);

    result = await getProtokoll(protokoll._id.toString());
    expect(result.gesamtMenge).toBe(999);
})

test("create zwei identische protokolle", async () => {
    await Protokoll.deleteMany({}).exec();


    const resource: ProtokollResource = {
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }

    await createProtokoll(resource);
    
    await expect(async () => {
        await createProtokoll(resource);
    }).rejects.toThrow();
})

test("create protokoll, falsche ersteller id", async () => {
    await Protokoll.deleteMany().exec();


    const resource: ProtokollResource = {
        id: protokoll._id.toString(),
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: protokoll._id.toString()
    }

    await expect(async () => {
        await createProtokoll(resource);
    }).rejects.toThrow();
})

test("update protokoll", async () => {
    const resource: ProtokollResource = {
        id: protokoll._id.toString(),
        patient: "Bill",
        datum: "23.08.2987",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }

    const result = await updateProtokoll(resource);

    expect(result).toBeDefined();
    expect(result.patient).toBe(resource.patient);
    expect(result.datum).toBe(resource.datum);
    expect(result.public).toBeTruthy();
    expect(result.closed).toBeFalsy();
    expect(result.updatedAt).toBeDefined(),
    expect(result.ersteller).toEqual(resource.ersteller)
})

test("update protokoll with defaults for public & closed", async () => {
    const resource: ProtokollResource = {
        id: protokoll._id.toString(),
        patient: "Bill",
        datum: "23.08.2987",
        ersteller: alex._id.toString()
    }

    const result = await updateProtokoll(resource);

    expect(result).toBeDefined();
    expect(result.patient).toBe(resource.patient);
    expect(result.datum).toBe(resource.datum);
    expect(result.public).toBeFalsy();
    expect(result.closed).toBeFalsy();
    expect(result.updatedAt).toBeDefined(),
    expect(result.ersteller).toEqual(resource.ersteller)
})

test("update into zwei identische protokolle", async () => {
    const resource: ProtokollResource = {
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }

    const resource2: ProtokollResource = {
        id: protokoll._id.toString(),
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }


    await createProtokoll(resource);
    
    await expect(async () => {
        await updateProtokoll(resource2);
    }).rejects.toThrow();
})

test("update protokoll, falsche id", async () => {
    const resource: ProtokollResource = {
        id: alex._id.toString(),
        patient: "Bill",
        datum: "23.08.2987",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }

    await expect(async () => {
        await updateProtokoll(resource);
     }).rejects.toThrow();
})

test("update protokoll, falsche id beim ersteller", async () => {
    const resource: ProtokollResource = {
        id: protokoll._id.toString(),
        patient: "Bill",
        datum: "23.08.2987",
        public: true,
        closed: false,
        ersteller: protokoll._id.toString()
    }

    await updateProtokoll(resource);
    await updateProtokoll(resource);
})

test("delete protokoll", async () => {
    await Protokoll.deleteMany({}).exec();


    const resource: ProtokollResource = {
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }

    const id = (await createProtokoll(resource)).id;
    let result = await Protokoll.find().exec();
    expect(result.length).toBe(1);
    await deleteProtokoll(id!);
    result = await Protokoll.find().exec();
    expect(result.length).toBe(0);
})

test("delete protokoll, anhängender eintrag", async () => {

    const eintragResource: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    const eintragResource2: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    await createEintrag(eintragResource);
    await createEintrag(eintragResource2);
    let results = await Eintrag.find().exec();
    expect(results.length).toBe(2);

    await deleteProtokoll(protokoll._id.toString());
    results = await Eintrag.find().exec();

    expect(results.length).toBe(0);
})

test("delete protokoll, protokoll nicht gefunden", async () => {
    await Protokoll.deleteMany({}).exec();


    const resource: ProtokollResource = {
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: alex._id.toString()
    }

    const id = (await createProtokoll(resource)).id;
    let result = await Protokoll.find().exec();
    expect(result.length).toBe(1);
    await deleteProtokoll(id!);

    await expect(async () => {
        await deleteProtokoll(id!);
    }).rejects.toThrow();
})

test("get all protokolle", async () => {
    let steve = await Pfleger.create({
        name: "Steve",
        password: "passwordisbht"
    });


    const resource: ProtokollResource = {
        patient: "Bob",
        datum: "23.08.2000",
        public: true,
        closed: false,
        ersteller: steve._id.toString()
    }

    const resource2: ProtokollResource = {
        patient: "Bill",
        datum: "23.08.2012",
        public: false,
        closed: false,
        ersteller: steve._id.toString()
    }

    await createProtokoll(resource);
    await createProtokoll(resource2)

    let results = await getAlleProtokolle(alex._id.toString());
    expect(results.length).toBe(2);

    results = await getAlleProtokolle(steve._id.toString());
    expect(results.length).toBe(2);

    results = await getAlleProtokolle();
    expect(results.length).toBe(1);

    await deleteProtokoll(protokoll.id);
    results = await getAlleProtokolle(alex._id.toString());
    expect(results.length).toBe(1);
})

