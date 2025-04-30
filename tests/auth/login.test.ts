// must be imported before any other imports
import dotenv from "dotenv";
dotenv.config();

import { parseCookies } from "restmatcher";
import supertest from "supertest";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { setTimeout } from "timers/promises";


/**
 * Eigentlich sind das hier sogar 5 Tests!
 */
test(`/api/login POST, Positivtest`, async () => {
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false })

    const testee = supertest(app);
    const loginData = { name: "John", password: "1234abcdABCD..;,." };
    const response = parseCookies(await testee.post(`/api/login`).send(loginData));
    expect(response).statusCode("2*")

    // added by parseCookies, similar to express middleware cookieParser
    expect(response).toHaveProperty("cookies"); // added by parseCookies
    expect(response.cookies).toHaveProperty("access_token"); // the cookie with the JWT
    const token = response.cookies.access_token;
    expect(token).toBeDefined();
        
    // added by parseCookies, array with raw cookies, i.e. with all options and value
    expect(response).toHaveProperty("cookiesRaw");
    const rawCookie = response.cookiesRaw.find(c=>c.name === "access_token");
    expect(rawCookie?.httpOnly).toBe(true);
    expect(rawCookie?.sameSite).toBe("None");
    expect(rawCookie?.secure).toBe(true);

    const getResponse = parseCookies(await testee.get(`/api/login`).set("Cookie", ["access_token=" + response.cookies.access_token]));
    
    expect(getResponse).statusCode("2*")
    expect(getResponse).toHaveProperty("cookies"); // added by parseCookies
    expect(getResponse.cookies).toHaveProperty("access_token"); // the cookie with the JWT
    const tokenGet = getResponse.cookies.access_token;
    expect(tokenGet).toBeDefined();
        
    // added by parseCookies, array with raw cookies, i.e. with all options and value
    expect(getResponse).toHaveProperty("cookiesRaw");
    const rawCookieGet = response.cookiesRaw.find(c=>c.name === "access_token");
    expect(rawCookieGet?.httpOnly).toBe(true);
    expect(rawCookieGet?.sameSite).toBe("None");
    expect(rawCookieGet?.secure).toBe(true);

    const deleteRespone = parseCookies(await testee.delete(`/api/login`).set("Cookie", ["access_token=" + response.cookies.access_token]));
    expect(deleteRespone).statusCode("2*");
    expect(deleteRespone).toHaveProperty("cookies"); // added by parseCookies
    expect(deleteRespone.cookies).not.toHaveProperty("access_token"); // the cookie with the JWT
 });


 test(`/api/login get, negavtivtest falsches pw`, async () => {
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false })

    const testee = supertest(app);
    const loginData = { name: "John", password: "1234abcdABCD.;,." };
    const response = parseCookies(await testee.post(`/api/login`).send(loginData));
    expect(response).statusCode("401")
 });

 test(`/api/login get, negavtivtest kein jwt`, async () => {
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false })

    const testee = supertest(app);
    const deleteRespone = parseCookies(await testee.get(`/api/login`).set("Cookie", ["access_token=ichbineinschwindler"]));

    expect(deleteRespone).statusCode(400)
 });

 test(`/api/login delete, negavtivtest kein jwt`, async () => {
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false })

    const testee = supertest(app);
    const deleteRespone = parseCookies(await testee.delete(`/api/login`).set("Cookie", ["access_token=ichbineinschwindler"]));

    expect(deleteRespone).statusCode(400)
 });

 test(`/api/login get, negavtivtest not valid input`, async () => {
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false })

    const testee = supertest(app);
    const loginData = { name: "JohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohnJohn", password: "asdas" };
    const response = parseCookies(await testee.post(`/api/login`).send(loginData));
    expect(response).statusCode("400")

 });

 test(`/api/login POST, kurze TTL`, async () => {
    process.env.JWT_TTL = "1"
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false })

    const testee = supertest(app);
    const loginData = { name: "John", password: "1234abcdABCD..;,." };
    const response = parseCookies(await testee.post(`/api/login`).send(loginData));
    expect(response).statusCode("2*")

    // added by parseCookies, similar to express middleware cookieParser
    expect(response).toHaveProperty("cookies"); // added by parseCookies
    expect(response.cookies).toHaveProperty("access_token"); // the cookie with the JWT
    const token = response.cookies.access_token;
    expect(token).toBeDefined();
        
    // added by parseCookies, array with raw cookies, i.e. with all options and value
    expect(response).toHaveProperty("cookiesRaw");
    const rawCookie = response.cookiesRaw.find(c=>c.name === "access_token");
    expect(rawCookie?.httpOnly).toBe(true);
    expect(rawCookie?.sameSite).toBe("None");
    expect(rawCookie?.secure).toBe(true);

    await setTimeout(2000);    
    const getResponse = parseCookies(await testee.get(`/api/login`).set("Cookie", ["access_token=" + response.cookies.access_token]));
    
    expect(getResponse).statusCode("401")
    process.env.JWT_TTL = "60"
 });