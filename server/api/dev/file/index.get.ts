import { createReadStream } from "node:fs"
import mime from "mime-types"

export default defineEventHandler(async (event) => {
    const { path } = getQuery(event)
    const p = path as string
    const mimeType = mime.lookup(p) || "application/octet-stream"

    setHeader(event, "Content-Type", mimeType)
    const stream = createReadStream(`server/storage/${p}`)
    return sendStream(event, stream)
})