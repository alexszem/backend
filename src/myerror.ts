export class MyError extends Error {
    statusCode: number
    path: string[]
    location: string = "body"
    value: string[];

    constructor(message: string, status: number, path: string[], value: string[], location?: string){
        super(message);
        this.statusCode = status;
        this.path = path
        this.value = value
        if (location) this.location = location
    }

    constructMessage(){
        const errors = this.path.map((path, index) => ({
            type: "field",
            location: this.location,
            msg: this.message,
            path: path,
            value: this.value[index]
        }));

        return { errors };
    }
}