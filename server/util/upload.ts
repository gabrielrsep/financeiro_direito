import type { MultiPartData } from "h3";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { nanoid } from "nanoid";
import { del, put, type PutBlobResult } from "@vercel/blob";
import { extname } from "node:path";

const DEV_STORAGE_PATH = "server/storage"

const compareKey = (key: string) => (item: MultiPartData) => item.name === key;

export const getFormDataValue = (body: MultiPartData[] | undefined, key: string) => {
    const item = body?.find(compareKey(key));
    return item?.data.toString();
}

export const findFormDataValue = (body: MultiPartData[] | undefined, key: string) => {
    return body?.find(compareKey(key))
}

export const getDevFileUrl = (path: string) => `/api/dev/file?path=${path}`

export interface UploadFileOptions {
    mimeType?: string[]
    fileSize?: number
}

export async function uploadFile(body: MultiPartData[], key: string, path: string, options: UploadFileOptions = {}) : Promise<{url: string} | PutBlobResult> {
    const item = findFormDataValue(body, key);
    if (!item) {
        throw createError({
            statusCode: 400,
            message: `Nenhum arquivo encontrado para a chave ${key}`,
        });
    }

    if(options.fileSize && item.data.length > options.fileSize) {
        throw createError({
            statusCode: 400,
            message: `Arquivo maior que o permitido`,
        });
    }

    if(options.mimeType) {
        if(!item.type) {
            throw createError({
                statusCode: 400,
                message: `Tipo de arquivo não informado`,
            });
        }
        if(!options.mimeType.includes(item.type)) {
            throw createError({
                statusCode: 400,
                message: `Tipo de arquivo não permitido`,
            });
        }
    }

    const randomKey = nanoid()
    const extension = item.filename ? extname(item.filename) : `.${item.type?.split("/")[1] || 'bin'}`;
    const fileName = `${randomKey}${extension}`
    switch (process.env.NODE_ENV) {
        case "development":
            await mkdir(`${DEV_STORAGE_PATH}/${path}`, { recursive: true })
            await writeFile(`${DEV_STORAGE_PATH}/${path}/${fileName}`, item.data);
            return {
                url: getDevFileUrl(`${path}/${fileName}`)
            }
        case "production":
            return await put(`${path}/${fileName}`, item.data, {
                access: "public",
                contentType: item.type,
            })
        default:
            throw createError({
                statusCode: 500,
                message: "Ambiente não configurado para upload.",
            })
    }
}

export function removeFile(path: string) {
    switch (process.env.NODE_ENV) {
        case "development":
            return unlink(`${DEV_STORAGE_PATH}/${path}`)
        case "production":
            return del(path)
    }
}