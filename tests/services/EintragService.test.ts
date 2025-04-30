import { HydratedDocument } from "mongoose";
import { EintragResource, ProtokollResource } from "../../src/Resources";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import { IProtokoll, Protokoll } from "../../src/model/ProtokollModel";
import { Eintrag, IEintrag } from "../../src/model/EintragModel";
import { createEintrag, deleteEintrag, getAlleEintraege, getEintrag, updateEintrag } from "../../src/services/EintragService";

let protokoll: HydratedDocument<IProtokoll>;
let alex: HydratedDocument<IPfleger>;
let eintrag: HydratedDocument<IEintrag>;

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

    eintrag = await Eintrag.create({
        getraenk: "Bier",
        menge: 500,
        ersteller: alex._id,
        protokoll: protokoll._id
    })
})

test("get eintrag", async () => {
    let result: EintragResource = await getEintrag(eintrag._id.toString());

    expect(result.id).toBeDefined();
    expect(result.getraenk).toBe("Bier");
    expect(result.menge).toBe(500);
    expect(result.erstellerName).toBe("Alex");
    expect(result.kommentar).toBeUndefined();
    expect(result.protokoll).toEqual(protokoll._id.toString());
    expect(result.ersteller).toEqual(alex._id.toString());
    expect(result.createdAt).toBeDefined();
})

test("get eintrag, falsche id", async () => {
    await expect(async () => {
       await getEintrag(alex._id.toString());
    }).rejects.toThrow();
})

test("get alle einträge", async () => {

    const protokoll2 = await Protokoll.create({
        patient: "Bob",
        datum: new Date("2024-08-25"),
        ersteller: alex._id,
        closed: false
    })

    const resource1: EintragResource = {
        id: eintrag._id.toString(),
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    const resource2: EintragResource = {
        id: eintrag._id.toString(),
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll2._id.toString()
    }

    await createEintrag(resource1);
    await createEintrag(resource2);

    let result = await getAlleEintraege(protokoll._id.toString());
    expect(result.length).toBe(2);

    result = await getAlleEintraege(protokoll2._id.toString());
    expect(result.length).toBe(1);

    await Eintrag.deleteMany().exec();
    result = await getAlleEintraege(protokoll2._id.toString());
    expect(result.length).toBe(0);    
})

test("get alle einträge, falsche pfleger id", async () => {
    await expect(async () => {
       await getAlleEintraege(alex._id.toString());
    }).rejects.toThrow();
})

test("create eintrag", async () => {
    await Eintrag.deleteMany().exec();

    const resource: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    const result = await createEintrag(resource);

    expect(result.id).toBeDefined();
    expect(result.getraenk).toBe("Cola");
    expect(result.menge).toBe(333);
    expect(result.erstellerName).toBe("Alex");
    expect(result.kommentar).toBe("Yipeee")
    expect(result.protokoll).toEqual(protokoll._id.toString());
    expect(result.ersteller).toEqual(alex._id.toString());
    expect(result.createdAt).toBeDefined();
})

test("create eintrag, pfleger nicht gefunden", async () => {
    await Eintrag.deleteMany().exec();

    const resource: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: protokoll._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    await expect(async () => {
        await createEintrag(resource);
    }).rejects.toThrow();
})

test("create eintrag, protokoll nicht gefunden", async () => {
    await Eintrag.deleteMany().exec();

    const resource: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: alex._id.toString()
    }

    await expect(async () => {
        await createEintrag(resource);
    }).rejects.toThrow();
})

test("create eintrag, protokoll geschlossen", async () => {
    await Eintrag.deleteMany().exec();

    const resource: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    await protokoll.updateOne({closed: true}).exec();

    await expect(async () => {
        await createEintrag(resource);
    }).rejects.toThrow();
})

test("update eintrag", async () => {
    const resource: EintragResource = {
        id: eintrag._id.toString(),
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: protokoll._id.toString(),
        createdAt: "bla",
        protokoll: alex._id.toString()
    }

    const result = await updateEintrag(resource);

    expect(result.id).toBe(eintrag._id.toString());
    expect(result.getraenk).toBe("Cola");
    expect(result.menge).toBe(333);
    expect(result.erstellerName).toBe("Alex");
    expect(result.kommentar).toBe("Yipeee")
    expect(result.protokoll).toEqual(protokoll._id.toString());
    expect(result.ersteller).toEqual(alex._id.toString());
    expect(result.createdAt).toBeDefined();
})

test("update eintrag, eintrag nicht gefunden", async () => {
    const resource: EintragResource = {
        id: alex._id.toString(),
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: protokoll._id.toString(),
        createdAt: "bla",
        protokoll: alex._id.toString()
    }

    
    await expect(async () => {
        await updateEintrag(resource);
    }).rejects.toThrow();
})

test("delete eintrag", async () => {
    const resource: EintragResource = {
        getraenk: "Cola",
        menge: 333,
        kommentar: "Yipeee",
        ersteller: alex._id.toString(),
        createdAt: "bla",
        protokoll: protokoll._id.toString()
    }

    const result = await createEintrag(resource);

    await deleteEintrag(result.id!);
    expect((await Eintrag.find().exec()).length).toBe(1);

    await deleteEintrag(eintrag._id.toString());
    expect((await Eintrag.find().exec()).length).toBe(0);
})

test("delete eintrag, falsche id", async () => {
    await expect(async () => {
       await deleteEintrag(alex._id.toString());
    }).rejects.toThrow();
})