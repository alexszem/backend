import { PflegerResource } from "../../src/Resources";
import { Eintrag } from "../../src/model/EintragModel";
import { Pfleger } from "../../src/model/PflegerModel";
import { Protokoll } from "../../src/model/ProtokollModel";
import { createPfleger, deletePfleger, getAllePfleger, updatePfleger } from "../../src/services/PflegerService";

beforeEach( async () => {
    await Pfleger.deleteMany({}).exec();

    await Pfleger.create({
        name: "Alex",
        password: "passwordisbht"
    });
})

test("get all pfleger", async () => { 
    await Pfleger.create({
        name: "Steve",
        password: "passwordisbht",
        admin: true
    });

    await Pfleger.create({
        name: "Lotta",
        password: "passwordisbht",
        admin: true
    });

    await Pfleger.create({
        name: "Magnus",
        password: "passwordisbht",
    });

    const results = await getAllePfleger();

    expect(results.length).toBe(4);
})

test("get all pfleger, aber es gibt keine pfleger", async () => {
    await Pfleger.deleteMany({}).exec();

    const results = await getAllePfleger();

    expect(results.length).toBe(0);
    expect(results).toStrictEqual(new Array());
})

test("create pfleger", async () => {
    const pflegerToCreate: PflegerResource = {name: "Willy", admin: false, password: "ichbindominikaner"};

    const createdPfleger: PflegerResource = await createPfleger(pflegerToCreate);

    expect(createdPfleger.id).toBeDefined();
    expect(createdPfleger.name).toBe("Willy");
    expect(createdPfleger.password).toBeUndefined();
    expect(createdPfleger.admin).toBeFalsy();

    const createdPflegerFromDatabase = await Pfleger.find({name: "Willy"}).exec();

    expect(createdPflegerFromDatabase).toBeDefined();
})

test("create pfleger, missingPassword", async () => {
    await Pfleger.deleteMany({}).exec();
    const pflegerToCreate: PflegerResource = {name: "Willy", admin: false};

    await expect(async () => {
        await createPfleger(pflegerToCreate);
    }).rejects.toThrow();
})


// FRAGE: Passwort welches in der DB ist nochmal prüfen??
test("update pfleger", async () => {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();

    const updatedAlexAsResource: PflegerResource = {id: alex!._id.toString(), name: alex!.name, admin: true, password: "ich will ein neues password"};

    const result = await updatePfleger(updatedAlexAsResource);

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Alex");
    expect(result.password).toBeUndefined();
    expect(result.admin).toBeTruthy();

    const updatedPflegerFromDatabase = await Pfleger.findOne({name: "Alex"}).exec();

    expect(updatedPflegerFromDatabase).toBeDefined();
    expect(updatedPflegerFromDatabase!.password).not.toBe(alex!.password);

})

test("update pfleger, ohne passwort", async () => {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();

    const updatedAlexAsResource: PflegerResource = {id: alex!._id.toString(), name: alex!.name, admin: true};

    const result = await updatePfleger(updatedAlexAsResource);

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Alex");
    expect(result.password).toBeUndefined();
    expect(result.admin).toBeTruthy();

    const updatedPflegerFromDatabase = await Pfleger.findOne({name: "Alex"}).exec();

    expect(updatedPflegerFromDatabase).toBeDefined();
    expect(updatedPflegerFromDatabase!.password).toBe(alex!.password);
})

test("update pfleger, falsche id bei der resource", async () => {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();

    const updatedAlexAsResource: PflegerResource = {id: "askjdbljaSVFÖJB", name: alex!.name, admin: true};

    await expect(async () => {
        const result = await updatePfleger(updatedAlexAsResource);
    }).rejects.toThrow();
})

test("update pfleger, fehlende id bei resource", async () => {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();

    const updatedAlexAsResource: PflegerResource = {name: alex!.name, admin: true};

    await expect(async () => {
        const result = await updatePfleger(updatedAlexAsResource);
    }).rejects.toThrow();
})

test("update pfleger, Pfleger wurde per deletePfleger zwischendurch gelöscht", async () => {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();
    let id: string = alex!._id.toString();
    await deletePfleger(id);

    const updatedAlexAsResource: PflegerResource = {id: id, name: alex!.name, admin: true};

    await expect(async () => {
        await updatePfleger(updatedAlexAsResource);
    }).rejects.toThrow();
})

test ("delete Pfleger", async function () {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();
    const steve = await Pfleger.create({
        name: "Steve",
        password: "passwordisbht",
        admin: true
    });

    await deletePfleger(alex!._id.toString());

    expect((await Pfleger.find().exec()).length).toBe(1);
})

test ("delete Pfleger,pfleger nicht gefunden", async function () {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();
    let id: string = alex!._id.toString()
    await deletePfleger(id);

    await expect(async () => {
        await deletePfleger(id);
    }).rejects.toThrow();
})

test ("delete Pfleger, mit anhängenden Protokollen", async function () {
    const alex = await Pfleger.findOne({name: "Alex"}).exec();
    if (alex === null) fail();

    const steve = await Pfleger.create({
        name: "Steve",
        password: "passwordisbht",
        admin: true
    });

    const lotta = await Pfleger.create({
        name: "Lotta",
        password: "passwordisbht",
        admin: true
    });

    const date: Date = new Date("2000-08-23")

    await Protokoll.create({
        patient: "Bob",
        datum: date,
        ersteller: alex._id
    })

    let montag = await Protokoll.create({
        patient: "Gill",
        datum: date,
        ersteller: alex._id
    })

    let dienstag = await Protokoll.create({
        patient: "Jim",
        datum: date,
        ersteller: steve._id
    })

    let mittwoch = await Protokoll.create({
        patient: "Jaaack",
        datum: date,
        ersteller: lotta._id
    })

    let bier = await Eintrag.create({
        getraenk: "Bier",
        menge: 500,
        ersteller: alex._id,
        protokoll: montag._id
    })

    let fanta = await Eintrag.create({
        getraenk: "Fanta",
        menge: 400,
        ersteller: lotta._id,
        protokoll: dienstag._id
    })

    let sprite = await Eintrag.create({
        getraenk: "Sprite",
        menge: 400,
        ersteller: alex._id,
        protokoll: mittwoch._id
    })

    await deletePfleger(alex._id.toString());

    expect((await Pfleger.find().exec()).length).toBe(2);
    expect((await Protokoll.find().exec()).length).toBe(2);
    expect((await Eintrag.find().exec()).length).toBe(1);

    await deletePfleger(steve._id.toString());

    expect((await Pfleger.find().exec()).length).toBe(1);
    expect((await Protokoll.find().exec()).length).toBe(1);
    expect((await Eintrag.find().exec()).length).toBe(0);
})