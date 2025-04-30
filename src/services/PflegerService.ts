import { HydratedDocument } from "mongoose";
import { PflegerResource } from "../Resources";
import { Eintrag } from "../model/EintragModel";
import { IPfleger, Pfleger } from "../model/PflegerModel";
import { Protokoll } from "../model/ProtokollModel";
import { deleteProtokoll } from "./ProtokollService";
import { deleteEintrag } from "./EintragService";
import { MyError } from "../myerror";


/**
 * Die Passwörter dürfen nicht zurückgegeben werden.
 */
export async function getAllePfleger(): Promise<PflegerResource[]> {
    const allPflegerAsSchema = await Pfleger.find().exec();
    const allPflegerAsResource: PflegerResource[] = new Array();

    allPflegerAsSchema.forEach(pfleger => {
        allPflegerAsResource.push(documentToResource(pfleger));
    });

    return allPflegerAsResource;
}

/**
 * Erzeugt einen Pfleger. Das Password darf nicht zurückgegeben werden.
 */
export async function createPfleger(pflegerResource: PflegerResource): Promise<PflegerResource> {
    try {    
        const createdPflegerAsModel = await Pfleger.create({
        name: pflegerResource.name,
        password: pflegerResource.password,
        admin: pflegerResource.admin });

        return documentToResource(createdPflegerAsModel);
    }
    catch (error) {
        throw new MyError("Not Unique", 400, ["name"], [pflegerResource.name])
    }

}


/**
 * Updated einen Pfleger.
 * Beim Update wird der Pfleger über die ID identifiziert.
 * Der Admin kann einfach so ein neues Passwort setzen, ohne das alte zu kennen.
 */
export async function updatePfleger(pflegerResource: PflegerResource): Promise<PflegerResource> {
    const pflegerToUpdate = await Pfleger.findById(pflegerResource.id).exec();
    if (!pflegerToUpdate) throw new MyError("Invalid Value", 404, ["id"], [pflegerResource.id!]);
    
    try {
        await pflegerToUpdate.updateOne({
            name: pflegerResource.name,
            admin: pflegerResource.admin
        }).exec();
    
        if (pflegerResource.password) await pflegerToUpdate.updateOne({password: pflegerResource.password}).exec();
        const updatedPfleger = await Pfleger.findById(pflegerResource.id).exec();
    
        return documentToResource(updatedPfleger!);
    }
    catch (error) {
        throw new MyError("Not Unique", 400, ["name"], [pflegerResource.name])
    }
}

/**
 * Beim Löschen wird der Pfleger über die ID identifiziert.
 * Falls Pfleger nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 * Wenn der Pfleger gelöscht wird, müssen auch alle zugehörigen Protokolls und Eintrags gelöscht werden.
 */
export async function deletePfleger(id: string): Promise<void> {
    const deletedPfleger = await Pfleger.findByIdAndDelete(id).exec();
    if (!deletedPfleger) throw new MyError("Invalid Value", 404, ["id"], [id], "params");

    const protokolleToBeDeleted = await Protokoll.find({ersteller: deletedPfleger._id}).exec();
    for (let protokoll of protokolleToBeDeleted) {
        await deleteProtokoll(protokoll._id.toString());
    }

    const eintraegeToBeDeleted = await Eintrag.find({ersteller: deletedPfleger._id}).exec();
    for (const eintrag of eintraegeToBeDeleted) {
        await deleteEintrag(eintrag._id.toString());
    }
}


function documentToResource(protokollAsModel: HydratedDocument<IPfleger>): PflegerResource {
    const pflegerAsResource: PflegerResource = {
        id: protokollAsModel._id.toString(),
        name: protokollAsModel.name,
        admin: protokollAsModel.admin!
    }

    return pflegerAsResource;
}
