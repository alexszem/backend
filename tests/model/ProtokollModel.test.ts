import { HydratedDocument } from "mongoose";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import { IProtokoll, Protokoll } from "../../src/model/ProtokollModel";

let alex: HydratedDocument<IPfleger>;
let montag: HydratedDocument <IProtokoll>;
let results: HydratedDocument<IProtokoll>[];
const date: Date = new Date("2000-08-23")
const date2: Date = new Date("2000-08-24")

beforeEach( async () => {
    await Protokoll.deleteMany({}).exec();
    
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

    results = await Protokoll.find().exec();
})

test("alex erstellen hat funktioniert", async () => {
    expect(results.length).toBe(1);
    expect(results[0].patient).toBe("Bob");
    expect(results[0].datum).toStrictEqual(date);
    expect(results[0].ersteller).toStrictEqual(alex._id);
    expect(results[0].ersteller).not.toBe(alex._id);
})

test("default bei admin richtig gesetzt", async () => {
    expect(results[0].public).toBe(false);
    expect(results[0].closed).toBe(false);
})

test("timestamp funktioniert", async () => {
    expect(results[0].updatedAt).not.toEqual(Date());
})

 test("faulty ersteller",async () => {
    try {
            let faultyProtocol: HydratedDocument<IProtokoll> = await Protokoll.create({
            patient: "Bob",
            datum: date,
            ersteller: alex._id
        });  
        
    } catch (error) {
        expect(error).toBeDefined();
    }
})

test("fehlender ersteller", async () => {
    try {
        let faultyProtocol: HydratedDocument<IProtokoll> = await Protokoll.create({
            patient: "Bob",
            datum: date
        });  
    } catch (error) {
        expect(error).toBeDefined();
    }
})

test("fehlender patient", async () => {
    try {
        let faultyProtocol: HydratedDocument<IProtokoll> = await Protokoll.create({
            datum: date,
            ersteller: alex._id
        });  
    } catch (error) {
        expect(error).toBeDefined();
    }
})

test("fehlendes datum", async () => {
    try {
        let faultyProtocol: HydratedDocument<IProtokoll> = await Protokoll.create({
            patient: "Bob",
            ersteller: alex._id
        });  
    } catch (error) {
        expect(error).toBeDefined();
    }
})

test("zweites Protokoll von Alex", async () => {
    let dienstag = await Protokoll.create({
        patient: "Bob",
        datum: date2,
        ersteller: alex._id
    })

    await dienstag.save();
    results = await Protokoll.find().exec();

    expect(results.length).toBe(2);
    expect(results[1].patient).toBe("Bob");
    expect(results[1].datum).toStrictEqual(date2);
    expect(results[1].ersteller).toStrictEqual(alex._id);
    expect(results[1].ersteller).not.toBe(alex._id);
});

test("Zweites Protokoll löschen", async () => {
    let dienstag = await Protokoll.create({
        patient: "Bob",
        datum: date2,
        ersteller: alex._id
    })

    await dienstag.save();

    await Protokoll.findOneAndDelete({patient: "Bob", datum: date2}).exec();

    results = await Protokoll.find().exec();

    expect(results.length).toBe(1);
})