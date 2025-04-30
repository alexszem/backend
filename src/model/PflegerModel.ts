import { Model, Schema, model } from "mongoose";
import * as bcrypt from "bcryptjs";

const saltLength: number = 10;
const hashingAlgorythm: (password: string) => Promise<string> = async (password) => await bcrypt.hash(password, saltLength);

export interface IPfleger{
    name: string;
    password: string;
    admin?: boolean;
}

interface IPflegerMethods{
    isCorrectPassword(passwordToTest: string): Promise<boolean>;
}

export type PflegerModel = Model<IPfleger, {}, IPflegerMethods>;

const pfelgerSchema = new Schema<IPfleger, PflegerModel, IPflegerMethods> ({
    name: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    admin: {type: Boolean, default: false}
})

pfelgerSchema.pre("save", async function() {
    if (this.isModified("password")){
        const hashedPassword = await hashingAlgorythm(this.password);
        this.password = hashedPassword;
    }
})

pfelgerSchema.pre("updateOne", async function() {
    const update = this.getUpdate();
    if (update !== null) {
        if ("password" in update) {
            update["password"] = await hashingAlgorythm(update["password"]);
        }
    }
})

pfelgerSchema.pre("findOneAndUpdate", async function () {
    const update = this.getUpdate();
    if (update !== null) {
        if ("password" in update) {
            update["password"] = await hashingAlgorythm(update["password"]);       
        }
    }
})

pfelgerSchema.pre("findOneAndReplace", async function () {
    const update = this.getUpdate();
    if (update !== null) {
        if ("password" in update) {
            update["password"] = await hashingAlgorythm(update["password"]);
        }
    }
})

pfelgerSchema.method("isCorrectPassword", async function (passwordToTest: string): Promise<boolean> {
    if (this.isModified("password")) throw new Error("Passwort wurde noch nicht gehasht");

    return await bcrypt.compare(passwordToTest, this.password);
})



export const Pfleger = model<IPfleger, PflegerModel>("Pfleger", pfelgerSchema);