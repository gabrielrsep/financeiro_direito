import type { MultiPartData } from "h3";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { nanoid } from "nanoid";
import { del, put, PutBlobResult } from "@vercel/blob";
import { devLogger } from "./logger";

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

export async function uploadFile(body: MultiPartData[], key: string, path: string) : Promise<{url: string} | PutBlobResult> {
    const item = findFormDataValue(body, key);
    devLogger.info(item)
    if (!item) {
        throw createError({
            statusCode: 400,
            message: `Nenhum arquivo encontrado para a chave ${key}`,
        });
    }

    const randomKey = nanoid()
    const fileName = `${randomKey}.${item.type?.split("/")[1]}`
    switch (process.env.NODE_ENV) {
        case "development":
            devLogger.info("Uploading file to development storage")
            devLogger.info(`${DEV_STORAGE_PATH}/${path}/${fileName}`)
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
    }
    throw createError({
        statusCode: 500,
        message: "Erro ao enviar arquivo.",
    })
}

export function removeFile(path: string) {
    switch (process.env.NODE_ENV) {
        case "development":
            return unlink(`${DEV_STORAGE_PATH}/${path}`)
        case "production":
            return del(path)
    }
}