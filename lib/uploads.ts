import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUploads(files: File[], prefix: string) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const urls: { url: string; kind: "PHOTO" | "VIDEO"; name: string }[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = path.extname(file.name) || (file.type.startsWith("video") ? ".mp4" : ".jpg");
    const safe = `${prefix}-${crypto.randomUUID()}${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, safe), buf);
    urls.push({
      url: `/uploads/${safe}`,
      kind: file.type.startsWith("video") ? "VIDEO" : "PHOTO",
      name: file.name,
    });
  }
  return urls;
}
