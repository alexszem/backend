import { Schema, Types, model } from "mongoose";

export interface IEintrag {
    getraenk: string;
    menge: number;
    kommentar?: string;
    createdAt?: Date;
    ersteller: Types.ObjectId;
    protokoll: Types.ObjectId;
}

const EintragSchema = new Schema<IEintrag> ({
    getraenk: {type: String, required: true},
    menge: {type: Number, required: true},
    kommentar: String,
    ersteller: {type: Schema.Types.ObjectId, ref: "Pfleger", required: true},
    protokoll: {type: Schema.Types.ObjectId, ref: "Protokoll", required: true}
}, {timestamps: true})

export const Eintrag = model("Eintrag", EintragSchema);