import { Pfleger } from "../../src/model/PflegerModel";
import { login } from "../../src/services/AuthenticationService";


beforeEach( async () => {
    await Pfleger.deleteMany({}).exec();

    await Pfleger.create({
        name: "Alex",
        password: "passwordisbht"
    });
})

test("login successful", async () => {
    const result = await login("Alex", "passwordisbht");

    expect(result).toBeTruthy();
})

test("admin login successful", async () => {
    await Pfleger.create({
        name: "Steve",
        password: "passwordisbht",
        admin: true
    });

    const result = await login("Steve", "passwordisbht");

    expect(result).toBeTruthy();
})

test("login failed, wrong username", async () => {
    const result = await login("alex", "passwordisbht");

    expect(result).toBeFalsy();
})

test("login failed, wrong password", async () => {
    const result = await login("Alex", "passwordisnotbht");

    expect(result).toBeFalsy();
})
