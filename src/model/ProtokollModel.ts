import { Schema, Types, model } from "mongoose";
import { stringToDate } from "../services/ServiceHelper";

export interface IProtokoll {
    patient: string;
    datum: Date;
    public?: boolean;
    closed?: boolean;
    updatedAt?: Date;
    ersteller: Types.ObjectId;
}

const protokollSchema = new Schema<IProtokoll> ({
    patient: {type: String, required: true},
    datum: {type: Date, required:true},
    public: {type: Boolean, default: false},
    closed: {type: Boolean, default: false},
    ersteller: {type: Schema.Types.ObjectId, ref: "Pfleger", required: true}
}, {timestamps: true})

export const Protokoll = model("Protokoll", protokollSchema);