import type { MultiPartData } from "h3";

export const getFormDataValue = (body: MultiPartData[] | undefined, key: string) => {
    const item = body?.find(item => item.name === key)
    return item?.data.toString();
}

export const findFormDataValue = (body: MultiPartData[] | undefined, key: string) => {
    return body?.find(item => item.name === key)
}