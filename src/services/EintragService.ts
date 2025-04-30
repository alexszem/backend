import { HydratedDocument, Types } from "mongoose";
import { EintragResource } from "../Resources";
import { Eintrag, IEintrag } from "../model/EintragModel";
import { IPfleger, Pfleger } from "../model/PflegerModel";
import { Protokoll } from "../model/ProtokollModel";
import { dateToString } from "./ServiceHelper";
import { MyError } from "../myerror";

/**
 * Gibt alle Eintraege in einem Protokoll zurück.
 * Wenn das Protokoll nicht gefunden wurde, wird ein Fehler geworfen.
 */
export async function getAlleEintraege(protokollId: string): Promise<EintragResource[]> {
    const protokoll = await Protokoll.findById(protokollId).exec();
    if (!protokoll) throw new MyError("Invalid Value", 404, ["id"], [protokollId], "params");

    let resourcesToReturn: EintragResource[] = new Array();
    const results = await Eintrag.find({protokoll: protokoll!._id}).exec();

    for (const result of results) {
        resourcesToReturn.push(await documentToResource(result));
    }

    return resourcesToReturn;
}


/**
 * Liefert die EintragResource mit angegebener ID.
 * Falls kein Eintrag gefunden wurde, wird ein Fehler geworfen.
 */
export async function getEintrag(id: string): Promise<EintragResource> {
    const eintragAsModel = await Eintrag.findById(id).exec();
    if (!eintragAsModel) throw new MyError("Invalid Value", 404, ["id"], [id], "params");

    return await documentToResource(eintragAsModel);
}

/**
 * Erzeugt eine Eintrag.
 * Daten, die berechnet werden aber in der gegebenen Ressource gesetzt sind, werden ignoriert.
 * Falls die Liste geschlossen (done) ist, wird ein Fehler wird geworfen.
 */
export async function createEintrag(eintragResource: EintragResource): Promise<EintragResource> {
    const pfleger = await Pfleger.findById(eintragResource.ersteller).exec();
    if (!pfleger) {
        throw new MyError("Invalid Value", 404, ["ersteller"], [eintragResource.ersteller]);
    }
    const protokoll = await Protokoll.findById(eintragResource.protokoll).exec();
    if (!protokoll) {
        throw new MyError("Invalid Value", 404, ["protokoll"], [eintragResource.protokoll]);
    }
    if (protokoll.closed) {
        throw new MyError("Invalid Value", 400, ["closed"], [protokoll.closed! + ""]);
    }

    const eintrag = await Eintrag.create({
        getraenk: eintragResource.getraenk,
        menge: eintragResource.menge,
        kommentar: eintragResource.kommentar,
        ersteller: eintragResource.ersteller,
        protokoll: eintragResource.protokoll
    })

    return await documentToResource(eintrag, pfleger);
}


/**
 * Updated eine Eintrag. Es können nur Name, Quantity und Remarks geändert werden.
 * Aktuell können Eintrags nicht von einem Protokoll in einen anderen verschoben werden.
 * Auch kann der Creator nicht geändert werden.
 * Falls die Protokoll oder Creator geändert wurde, wird dies ignoriert.
 */
export async function updateEintrag(eintragResource: EintragResource): Promise<EintragResource> {
    const eintragToUpdate = await Eintrag.findById(eintragResource.id).exec();
    if (!eintragToUpdate) throw new MyError("Invalid Value", 404, ["id"], [eintragResource.id!]);

    await eintragToUpdate!.updateOne({
        getraenk: eintragResource.getraenk,
        menge: eintragResource.menge,
        kommentar: eintragResource.kommentar
    }).exec();
    
    const updatedEintrag = await Eintrag.findById(eintragToUpdate!._id).exec();

    return await documentToResource(updatedEintrag!);
}


/**
 * Beim Löschen wird das Eintrag über die ID identifiziert. 
 * Falls es nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 */
export async function deleteEintrag(id: string): Promise<void> {
    const deletedEintrag = await Eintrag.findByIdAndDelete(id).exec();
    if (!deletedEintrag) throw new MyError("Invalid Value", 404, ["id"], [id], "params");
}

async function documentToResource(eintragAsModel: HydratedDocument<IEintrag>, pfleger?: HydratedDocument<IPfleger>): Promise<EintragResource> {
    let erstellerName = pfleger?.name;
    if (!pfleger) erstellerName = (await Pfleger.findById(eintragAsModel.ersteller).exec())!.name;

    const eintragAsResource: EintragResource = {
        id: eintragAsModel._id.toString(),
        getraenk: eintragAsModel.getraenk,
        menge: eintragAsModel.menge,
        kommentar: eintragAsModel.kommentar,
        ersteller: eintragAsModel.ersteller.toString(),
        erstellerName: erstellerName,
        createdAt: dateToString(eintragAsModel.createdAt!),
        protokoll: eintragAsModel.protokoll.toString()
    }

    return eintragAsResource;
}
