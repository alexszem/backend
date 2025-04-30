import { HydratedDocument } from "mongoose";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import { IProtokoll, Protokoll } from "../../src/model/ProtokollModel";
import { Eintrag, IEintrag } from "../../src/model/EintragModel";

let alex: HydratedDocument<IPfleger>;
let montag: HydratedDocument <IProtokoll>;
let eintrag: HydratedDocument<IEintrag>;
let results: HydratedDocument<IEintrag>[];
const date: Date = new Date("2000-08-23");

beforeEach( async () => {
    alex = await Pfleger.create({
        name: "Alex",
        password: "passwordisbht"
    });

    await alex.save();

    montag = await Protokoll.create({
        patient: "Bob",
        datum: date,
        ersteller: alex._id
    })

    await montag.save();

    eintrag = await Eintrag.create({
        getraenk: "Bier",
        menge: 500,
        ersteller: alex._id,
        protokoll: montag._id
    })

    await eintrag.save();

    results = await Eintrag.find().exec();
})

test("Bier trinken hat funktioniert", async () => {
    expect(results.length).toBe(1);
    expect(results[0].getraenk).toBe("Bier");
    expect(results[0].menge).toStrictEqual(500);
    expect(results[0].kommentar).not.toBeDefined();
    expect(results[0].ersteller).toEqual(alex._id);
    expect(results[0].protokoll).toEqual(montag._id)
})

test("timestamp funktioniert", async () => {
    expect(results[0].createdAt).not.toEqual(Date());
})

test("hier gibt es keine uniqueness", async () => {
    let secondBeer: HydratedDocument<IEintrag> = await Eintrag.create({
        getraenk: "Bier",
        menge: 500,
        ersteller: await Pfleger.create({
            name: "Ted",
            password: "nööö"
        }),
        protokoll: montag._id
    });
})

test("fehlendes getränk", async () => {
    await expect(async () => {
        await Eintrag.create({
            menge: 500,
            ersteller: alex._id,
            protokoll: montag._id
        })
    }).rejects.toThrow();
})

test("fehlende menge", async () => {
    await expect(async () => {
        await Eintrag.create({
            getraenk: "Bier",
            ersteller: alex._id,
            protokoll: montag._id
        })
    }).rejects.toThrow();
})

test("fehlender ersteller", async () => {
    await expect(async () => {
        await Eintrag.create({
            getraenk: "Bier",
            menge: 500,
            protokoll: montag._id
        })
    }).rejects.toThrow();
})

test("fehlendes protokoll", async () => {
    await expect(async () => {
        await Eintrag.create({
            getraenk: "Bier",
            menge: 500,
            ersteller: alex._id
        })
    }).rejects.toThrow();
})

test("kommentar funktioniert", async () => {
    await Eintrag.create({
        getraenk: "Fanta",
        menge: 500,
        ersteller: alex._id,
        protokoll: montag._id,
        kommentar: "Abends Fanta, morgens stand er!"
    })

    results = await Eintrag.find({getraenk: "Fanta"}).exec();

    expect(results[0].kommentar).toBeDefined();
    expect(results[0].kommentar).toBe("Abends Fanta, morgens stand er!");
})