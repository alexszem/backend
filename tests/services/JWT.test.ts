import dotenv from "dotenv";
import { verifyJWT, verifyPasswordAndCreateJWT } from "../../src/services/JWTService";
dotenv.config();


test(`keine TTL`, async () => {
    process.env.JWT_TTL = ""

    await expect(async () => {
        await verifyPasswordAndCreateJWT("bla", "bla")
    }).rejects.toThrow();

    process.env.JWT_TTL = "60"
})

test(`keine Secret`, async () => {
    process.env.JWT_Secret = ""

    await expect(async () => {
        await verifyPasswordAndCreateJWT("bla", "bla")
    }).rejects.toThrow();

    process.env.JWT_Secret = "0904edf0391a949565bd78b6e9b0a1329cd971adbaea9534434a27434fa81237"
})

test(`keine TTL, verify`, async () => {
    process.env.JWT_TTL = ""

    await expect(async () => {
        await verifyJWT("bla")
    }).rejects.toThrow();

    process.env.JWT_TTL = "60"
})

test(`keine Secret, verify`, async () => {
    process.env.JWT_Secret = ""

    await expect(async () => {
        await verifyJWT("bla")
    }).rejects.toThrow();

    process.env.JWT_Secret = "0904edf0391a949565bd78b6e9b0a1329cd971adbaea9534434a27434fa81237"
})