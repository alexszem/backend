import { HydratedDocument } from "mongoose";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";

let alex: HydratedDocument<IPfleger>;
let results: HydratedDocument<IPfleger>[];

beforeEach( async () => {
    await Pfleger.deleteMany({}).exec()

    alex = await Pfleger.create({
        name: "Alex",
        password: "passwordisbht"
    });

    results = await Pfleger.find().exec();
})


// Basic passing tests

test("alex erstellen hat funktioniert", async () => {
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Alex");
})

test("default bei admin richtig gesetzt", async () => {
    expect(results[0].admin).toBe(false);
})

test("admin erstellt", async () => {
    let jens = await Pfleger.create({
        name: "Jens",
        password: "passwordisbht",
        admin: true
    });

    await jens.save();

    results = await Pfleger.find().exec();

    expect(results.length).toBe(2);
    expect(results[1].name).toBe("Jens");
    expect(results[1].admin).toBeTruthy;
})

// Passwortcheck

test("passwordcheck bob, richtiges Passwort", async () => {
    let bob = await Pfleger.create({
        name: "bob",
        password: "passwordisbht"
    });

    await bob.save();

    expect(await bob.isCorrectPassword("passwordisbht")).toBeTruthy();
})

test("passwordcheck bob, falsches Passwort", async () => {
    let bob = await Pfleger.create({
        name: "bob",
        password: "passwordisbht"
    });

    await bob.save();

    expect(await bob.isCorrectPassword("einloggen")).toBeFalsy();
})


// fall passwort geändert aber nicht gesaved

test("bob noch nicht gesaved", async () => {
    let bob = await Pfleger.create({
        name: "bob",
        password: "passwordisbht"
    });

    expect(bob.password).not.toBe("passwordisbht");

    bob.password = "passwordisbht"
    await expect(async () => await bob.isCorrectPassword("passwordisbht")).rejects.toThrowError();
    await bob.save();
})

// Passwortänderung

test("findOneAndUpdate", async () => {
    await Pfleger.findOneAndUpdate({name: "Alex"}, {password: "passwordisnotbhtanymore"}).exec();

    results = await Pfleger.find({name: "Alex"}).exec();
})

test("passwordänderung mit findOneAndReplace", async () => {
    await Pfleger.findOneAndReplace({name: "Alex"}, {name: "Bill", password: "passwordisnotbhtanymore"}).exec();

    results = await Pfleger.find({name: "Bill"}).exec();
})

test("passwordänderung mit updateOne", async () => {
    await results[0].updateOne({password: "passwordisnotbhtanymore"}).exec();

    results = await Pfleger.find({name: "Alex"}).exec();
})

// fehlende required Parameter

test("fehlender name", async () => {
    try {
        let faultyAlex: HydratedDocument<IPfleger> = await Pfleger.create({
            password: "passwordisbht"
        });  
    } catch (error) {
        expect(error).toBeDefined();
    }
})

test("fehlendes passwort", async () => {
    try {
        let faultyAlex: HydratedDocument<IPfleger> = await Pfleger.create({
            name: "Fred"
        });  
    } catch (error) {
        expect(error).toBeDefined();
    }
})

test("fehlendes passwort 2", async () => {
    await expect(async ()=> { await Pfleger.create({
        name: "Fred"
    });  }).rejects.toThrow();
})

// duplicate unique

test("zweiter alex", async () => {
    try {
        let faultyAlex: HydratedDocument<IPfleger> = await Pfleger.create({
            name: "Alex",
            password: "iamevilduplicate"
        });
    } catch (error) {
        expect(error).toBeDefined();
    }
})