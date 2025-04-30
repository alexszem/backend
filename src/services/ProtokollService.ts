import { HydratedDocument, Types } from "mongoose";
import { ProtokollResource } from "../Resources";
import { IPfleger, Pfleger } from "../model/PflegerModel";
import { IProtokoll, Protokoll } from "../model/ProtokollModel";
import { dateToString, stringToDate } from "./ServiceHelper";
import { Eintrag } from "../model/EintragModel";
import { deleteEintrag } from "./EintragService";
import { MyError } from "../myerror";

/**
 * Gibt alle Protokolls zurück, die für einen Pfleger sichtbar sind. Dies sind:
 * - alle öffentlichen (public) Protokolls
 * - alle eigenen Protokolls, dies ist natürlich nur möglich, wenn die pflegerId angegeben ist.
 */
export async function getAlleProtokolle(pflegerId?: string): Promise<ProtokollResource[]> {
    let resourcesToReturn: ProtokollResource[] = new Array();
    const results = await Protokoll.find({
        $or: [
            {public: true},
            {ersteller: pflegerId}
        ]
    }).exec();

    for (const result of results) {
        resourcesToReturn.push(await documentToResource(result));
    }

    return resourcesToReturn;
}

/**
 * Liefer die Protokoll mit angegebener ID.
* Falls keine Protokoll gefunden wurde, wird ein Fehler geworfen.
*/
export async function getProtokoll(id: string): Promise<ProtokollResource> {
    const protokollAsModel = await Protokoll.findById(id).exec();
    if (!protokollAsModel) throw new MyError("Couldnt find protokoll", 404, ["id"], [id], "params");

    return documentToResource(protokollAsModel);
}

/**
 * Erzeugt das Protokoll.
 */
export async function createProtokoll(protokollResource: ProtokollResource): Promise<ProtokollResource> {
    const pfleger = await Pfleger.findById(protokollResource.ersteller).exec();
    if (!pfleger) throw new MyError("Invalid Value", 404, ["id"], [protokollResource.id!]);
    await uniquenessCheck(protokollResource);

    const createdProtokoll: HydratedDocument<IProtokoll> = await Protokoll.create({
        patient: protokollResource.patient,
        datum: stringToDate(protokollResource.datum),
        ersteller: protokollResource.ersteller,
        public: protokollResource.public,
        closed: protokollResource.closed        
    })

    return documentToResource(createdProtokoll, pfleger);
}

/**
 * Ändert die Daten einer Protokoll.
 */
export async function updateProtokoll(protokollResource: ProtokollResource): Promise<ProtokollResource> {
    const protokollToUpdate = await Protokoll.findById(protokollResource.id).exec();
    if (!protokollToUpdate) throw new MyError("Invalid Value", 404, ["id"], [protokollResource.id!]);

    await uniquenessCheck(protokollResource, protokollToUpdate._id);

    await protokollToUpdate!.updateOne({
        patient: protokollResource.patient,
        datum: stringToDate(protokollResource.datum),
        public: protokollResource.public,
        closed: protokollResource.closed
    }).exec();
    
    const updatedProtokoll = await Protokoll.findById(protokollToUpdate!._id).exec();

    return documentToResource(updatedProtokoll!);
}

/**
 * Beim Löschen wird die Protokoll über die ID identifiziert.
 * Falls keine Protokoll nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 * Wenn die Protokoll gelöscht wird, müssen auch alle zugehörigen Eintrags gelöscht werden.
 */
export async function deleteProtokoll(id: string): Promise<void> {
    const deletedProtokoll = await Protokoll.findByIdAndDelete(id).exec();
    if (!deletedProtokoll) throw new MyError("Invalid Value", 404, ["id"], [id], "params");

    const eintraegeToBeDeleted = await Eintrag.find({protokoll: deletedProtokoll._id}).exec();
    for (const eintrag of eintraegeToBeDeleted) {
        await deleteEintrag(eintrag._id.toString());
    }
}

async function uniquenessCheck(resource: ProtokollResource, id?: Types.ObjectId) {
    const forbiddenCombination = await Protokoll.find({patient: resource.patient, datum: stringToDate(resource.datum), _id: {$ne: id}}).exec();
    if (forbiddenCombination.length > 0) throw new MyError("Invalid Value", 400, ["patient", "datum"], [resource.patient, resource.datum]);
}

async function documentToResource(protokollAsModel: HydratedDocument<IProtokoll>, pfleger?: HydratedDocument<IPfleger>): Promise<ProtokollResource> {
    let erstellerName = pfleger?.name;
    if (!pfleger) erstellerName = (await Pfleger.findById(protokollAsModel.ersteller).exec())!.name;

    const protokollAsResource: ProtokollResource = {
        id: protokollAsModel._id.toString(),
        patient: protokollAsModel.patient,
        datum: dateToString(protokollAsModel.datum),
        public: protokollAsModel.public,
        closed: protokollAsModel.closed,
        ersteller: protokollAsModel.ersteller.toString(),
        erstellerName: erstellerName,
        updatedAt: dateToString(protokollAsModel.updatedAt!),
        gesamtMenge: await getGesamteMenge(protokollAsModel._id)
    }

    return protokollAsResource;
}

async function getGesamteMenge(id: Types.ObjectId): Promise<number> {
    let gesamtMenge = 0;
    const eintraege = await Eintrag.find({protokoll: id}).exec();

    for (const eintrag of eintraege) {
        gesamtMenge += eintrag.menge;
    }

    return gesamtMenge;
}