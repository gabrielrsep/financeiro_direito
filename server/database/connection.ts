import { neon } from '@neondatabase/serverless'

const { DATABASE_URL } = process.env;


const neonClient = neon(DATABASE_URL!);

export function databaseArg(arg: any) {
    if(arg === undefined) {
        return null;
    }
    return arg;
}

export function replaceQuestionMarks(sql: string) {
    let index = 0;
    return sql.replace(/\?/g, () => {
        index++;
        return `$${index}`;
    });
}

export function repeatParms(n: number) {
    const arr = []
    for(let i = 0; i < n; i++) {
        arr.push('$' + (i + 1))
    }
    return arr.join(',')
}


export { neonClient };


