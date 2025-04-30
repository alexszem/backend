import { Pfleger } from "../model/PflegerModel";

/**
 * Prüft Name und Passwort, bei Erfolg ist `success` true 
 * und es wird die `id` und `role` ("u" oder "a") des Pflegers zurückgegeben
 * 
 * Falls kein Pfleger mit gegebener Name existiert oder das Passwort falsch ist, wird nur 
 * `false` zurückgegeben. Aus Sicherheitsgründen wird kein weiterer Hinweis gegeben.
 */
export async function login(name: string, password: string): Promise<{ id: string, role: "a" | "u" } | false> {
    type Role = "u" | "a";
    let role: Role = "u"

    let pflegerFromDatabase = await Pfleger.findOne({name: name}).exec();
    if (pflegerFromDatabase === undefined || pflegerFromDatabase === null) return false;
    if (!(await pflegerFromDatabase.isCorrectPassword(password))) return false;

    if (pflegerFromDatabase.admin) role = "a";
    const id = pflegerFromDatabase._id.toString();
    
    return {id: id, role: role};
}